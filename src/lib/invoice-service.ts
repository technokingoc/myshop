import { getDb } from './db';
import {
  subscriptionInvoices,
  subscriptionInvoiceItems,
  subscriptions,
  sellers,
} from './schema';
import { eq, desc } from 'drizzle-orm';
import { formatStripeAmount } from './stripe';
import jsPDF from 'jspdf';

export interface InvoiceData {
  id: number;
  invoiceNumber: string;
  sellerId: number;
  status: string;
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  periodStart: Date;
  periodEnd: Date;
  invoiceDate: Date;
  dueDate?: Date;
  paidAt?: Date;
  customer: {
    name: string;
    email: string;
    address?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
  };
  seller: {
    name: string;
    email: string;
    address: string;
    city: string;
    country: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    unitAmount: number;
    amount: number;
    currency: string;
    plan?: string;
    usageStart?: Date;
    usageEnd?: Date;
  }>;
  pdfUrl?: string;
}

export class InvoiceService {
  private db = getDb();

  // Generate invoice number
  private generateInvoiceNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const timestamp = now.getTime().toString().slice(-6);
    return `INV-${year}${month}-${timestamp}`;
  }

  // Create invoice from Stripe invoice
  async createInvoiceFromStripe(stripeInvoice: any, sellerId: number): Promise<InvoiceData> {
    try {
      // Get seller info
      const seller = await this.db
        .select()
        .from(sellers)
        .where(eq(sellers.id, sellerId))
        .limit(1);

      if (seller.length === 0) {
        throw new Error('Seller not found');
      }

      const sellerData = seller[0];

      // Get subscription
      let subscriptionId = null;
      if (stripeInvoice.subscription) {
        const subscription = await this.db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.stripeSubscriptionId, stripeInvoice.subscription))
          .limit(1);
        
        if (subscription.length > 0) {
          subscriptionId = subscription[0].id;
        }
      }

      // Create invoice record
      const invoiceNumber = this.generateInvoiceNumber();
      
      const [newInvoice] = await this.db
        .insert(subscriptionInvoices)
        .values({
          sellerId,
          subscriptionId,
          stripeInvoiceId: stripeInvoice.id,
          invoiceNumber,
          status: stripeInvoice.status,
          subtotal: stripeInvoice.subtotal || 0,
          tax: stripeInvoice.tax || 0,
          total: stripeInvoice.total || 0,
          amountPaid: stripeInvoice.amount_paid || 0,
          amountRemaining: stripeInvoice.amount_remaining || 0,
          currency: stripeInvoice.currency?.toUpperCase() || 'USD',
          periodStart: new Date(stripeInvoice.period_start * 1000),
          periodEnd: new Date(stripeInvoice.period_end * 1000),
          invoiceDate: new Date(stripeInvoice.created * 1000),
          dueDate: stripeInvoice.due_date ? new Date(stripeInvoice.due_date * 1000) : null,
          paidAt: stripeInvoice.status_transitions?.paid_at 
            ? new Date(stripeInvoice.status_transitions.paid_at * 1000) 
            : null,
          customerDetails: {
            name: stripeInvoice.customer_name || sellerData.name,
            email: stripeInvoice.customer_email || sellerData.email || '',
            address: stripeInvoice.customer_address || undefined,
          },
          metadata: {
            stripeHostedInvoiceUrl: stripeInvoice.hosted_invoice_url,
            stripeInvoicePdf: stripeInvoice.invoice_pdf,
            paymentIntentId: stripeInvoice.payment_intent,
          },
        })
        .returning();

      // Create line items
      if (stripeInvoice.lines?.data) {
        for (const line of stripeInvoice.lines.data) {
          await this.db.insert(subscriptionInvoiceItems).values({
            invoiceId: newInvoice.id,
            stripeInvoiceItemId: line.id,
            description: line.description || '',
            quantity: line.quantity || 1,
            unitAmount: line.price?.unit_amount || 0,
            amount: line.amount || 0,
            currency: line.currency?.toUpperCase() || 'USD',
            plan: line.price?.metadata?.plan || '',
            pricingType: line.price?.type || 'recurring',
            usageStart: line.period?.start ? new Date(line.period.start * 1000) : null,
            usageEnd: line.period?.end ? new Date(line.period.end * 1000) : null,
            metadata: {
              planFeatures: line.price?.metadata?.features ? 
                JSON.parse(line.price.metadata.features) : [],
            },
          });
        }
      }

      const invoiceData = await this.getInvoice(newInvoice.id);
      if (!invoiceData) {
        throw new Error('Failed to retrieve created invoice');
      }
      return invoiceData;
    } catch (error) {
      console.error('Error creating invoice from Stripe:', error);
      throw error;
    }
  }

  // Get invoice by ID
  async getInvoice(invoiceId: number): Promise<InvoiceData | null> {
    try {
      // Get invoice
      const invoice = await this.db
        .select()
        .from(subscriptionInvoices)
        .where(eq(subscriptionInvoices.id, invoiceId))
        .limit(1);

      if (invoice.length === 0) {
        return null;
      }

      const inv = invoice[0];

      // Get seller info
      const seller = await this.db
        .select()
        .from(sellers)
        .where(eq(sellers.id, inv.sellerId))
        .limit(1);

      if (seller.length === 0) {
        throw new Error('Seller not found');
      }

      const sellerData = seller[0];

      // Get line items
      const items = await this.db
        .select()
        .from(subscriptionInvoiceItems)
        .where(eq(subscriptionInvoiceItems.invoiceId, invoiceId))
        .orderBy(desc(subscriptionInvoiceItems.createdAt));

      return {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        sellerId: inv.sellerId,
        status: inv.status,
        subtotal: inv.subtotal || 0,
        tax: inv.tax || 0,
        total: inv.total || 0,
        currency: inv.currency || 'USD',
        periodStart: inv.periodStart,
        periodEnd: inv.periodEnd,
        invoiceDate: inv.invoiceDate,
        dueDate: inv.dueDate || undefined,
        paidAt: inv.paidAt || undefined,
        customer: inv.customerDetails as any,
        seller: {
          name: sellerData.name,
          email: sellerData.email || '',
          address: sellerData.address || '',
          city: sellerData.city || '',
          country: sellerData.country || '',
        },
        items: items.map(item => ({
          description: item.description,
          quantity: item.quantity || 1,
          unitAmount: item.unitAmount || 0,
          amount: item.amount || 0,
          currency: item.currency || 'USD',
          plan: item.plan || undefined,
          usageStart: item.usageStart || undefined,
          usageEnd: item.usageEnd || undefined,
        })),
        pdfUrl: inv.pdfUrl || undefined,
      };
    } catch (error) {
      console.error('Error getting invoice:', error);
      throw error;
    }
  }

  // Get invoices for seller
  async getInvoicesForSeller(sellerId: number, limit = 50): Promise<InvoiceData[]> {
    try {
      const invoices = await this.db
        .select()
        .from(subscriptionInvoices)
        .where(eq(subscriptionInvoices.sellerId, sellerId))
        .orderBy(desc(subscriptionInvoices.createdAt))
        .limit(limit);

      const invoiceData: InvoiceData[] = [];

      for (const invoice of invoices) {
        const fullInvoice = await this.getInvoice(invoice.id);
        if (fullInvoice) {
          invoiceData.push(fullInvoice);
        }
      }

      return invoiceData;
    } catch (error) {
      console.error('Error getting invoices for seller:', error);
      throw error;
    }
  }

  // Generate PDF invoice
  async generatePDF(invoiceId: number): Promise<string> {
    try {
      const invoice = await this.getInvoice(invoiceId);
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      let yPosition = margin;

      // Helper function to add text with word wrapping
      const addText = (text: string, x: number, y: number, maxWidth?: number, fontSize = 10) => {
        pdf.setFontSize(fontSize);
        if (maxWidth) {
          const lines = pdf.splitTextToSize(text, maxWidth);
          pdf.text(lines, x, y);
          return y + (lines.length * fontSize * 0.5);
        } else {
          pdf.text(text, x, y);
          return y + fontSize * 0.5;
        }
      };

      // Header
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('INVOICE', margin, yPosition);
      yPosition += 15;

      // Invoice details (right side)
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const rightX = pageWidth - margin - 60;
      let rightY = margin + 5;

      pdf.text('Invoice #:', rightX, rightY);
      pdf.setFont('helvetica', 'bold');
      pdf.text(invoice.invoiceNumber, rightX + 25, rightY);
      rightY += 6;

      pdf.setFont('helvetica', 'normal');
      pdf.text('Date:', rightX, rightY);
      pdf.setFont('helvetica', 'bold');
      pdf.text(invoice.invoiceDate.toLocaleDateString(), rightX + 25, rightY);
      rightY += 6;

      if (invoice.dueDate) {
        pdf.setFont('helvetica', 'normal');
        pdf.text('Due Date:', rightX, rightY);
        pdf.setFont('helvetica', 'bold');
        pdf.text(invoice.dueDate.toLocaleDateString(), rightX + 25, rightY);
        rightY += 6;
      }

      pdf.setFont('helvetica', 'normal');
      pdf.text('Status:', rightX, rightY);
      pdf.setFont('helvetica', 'bold');
      pdf.text(invoice.status.toUpperCase(), rightX + 25, rightY);
      
      yPosition += 10;

      // From section
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('FROM:', margin, yPosition);
      yPosition += 8;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('MyShop Platform', margin, yPosition);
      yPosition += 5;

      pdf.setFont('helvetica', 'normal');
      pdf.text('Digital Commerce Platform', margin, yPosition);
      yPosition += 4;
      pdf.text('support@myshop.platform', margin, yPosition);
      yPosition += 4;
      pdf.text('www.myshop.platform', margin, yPosition);
      yPosition += 15;

      // To section
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('TO:', margin, yPosition);
      yPosition += 8;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text(invoice.seller.name, margin, yPosition);
      yPosition += 5;

      pdf.setFont('helvetica', 'normal');
      pdf.text(invoice.seller.email, margin, yPosition);
      yPosition += 4;

      if (invoice.seller.address) {
        pdf.text(invoice.seller.address, margin, yPosition);
        yPosition += 4;
      }

      if (invoice.seller.city || invoice.seller.country) {
        const location = [invoice.seller.city, invoice.seller.country].filter(Boolean).join(', ');
        pdf.text(location, margin, yPosition);
        yPosition += 4;
      }

      yPosition += 15;

      // Billing period
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('BILLING PERIOD:', margin, yPosition);
      yPosition += 8;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const periodText = `${invoice.periodStart.toLocaleDateString()} - ${invoice.periodEnd.toLocaleDateString()}`;
      pdf.text(periodText, margin, yPosition);
      yPosition += 15;

      // Line items table
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('ITEMS:', margin, yPosition);
      yPosition += 10;

      // Table header
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Description', margin, yPosition);
      pdf.text('Qty', pageWidth - margin - 80, yPosition);
      pdf.text('Unit Price', pageWidth - margin - 60, yPosition);
      pdf.text('Amount', pageWidth - margin - 30, yPosition);
      yPosition += 5;

      // Draw line under header
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 5;

      // Table rows
      pdf.setFont('helvetica', 'normal');
      for (const item of invoice.items) {
        const description = item.description + (item.plan ? ` (${item.plan.toUpperCase()} Plan)` : '');
        
        pdf.text(description, margin, yPosition, { maxWidth: pageWidth - 150 });
        pdf.text(item.quantity.toString(), pageWidth - margin - 80, yPosition);
        pdf.text(formatStripeAmount(item.unitAmount, item.currency), pageWidth - margin - 60, yPosition);
        pdf.text(formatStripeAmount(item.amount, item.currency), pageWidth - margin - 30, yPosition);
        
        yPosition += 6;

        if (item.usageStart && item.usageEnd) {
          pdf.setFontSize(8);
          pdf.setTextColor(128, 128, 128);
          const usagePeriod = `Period: ${item.usageStart.toLocaleDateString()} - ${item.usageEnd.toLocaleDateString()}`;
          pdf.text(usagePeriod, margin + 10, yPosition);
          yPosition += 4;
          pdf.setFontSize(9);
          pdf.setTextColor(0, 0, 0);
        }
      }

      yPosition += 10;

      // Totals
      const totalsX = pageWidth - margin - 80;
      
      // Subtotal
      pdf.line(totalsX - 10, yPosition, pageWidth - margin, yPosition);
      yPosition += 5;
      
      pdf.setFont('helvetica', 'normal');
      pdf.text('Subtotal:', totalsX, yPosition);
      pdf.text(formatStripeAmount(invoice.subtotal, invoice.currency), pageWidth - margin - 30, yPosition);
      yPosition += 6;

      if (invoice.tax > 0) {
        pdf.text('Tax:', totalsX, yPosition);
        pdf.text(formatStripeAmount(invoice.tax, invoice.currency), pageWidth - margin - 30, yPosition);
        yPosition += 6;
      }

      // Total
      pdf.line(totalsX - 10, yPosition, pageWidth - margin, yPosition);
      yPosition += 5;
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text('Total:', totalsX, yPosition);
      pdf.text(formatStripeAmount(invoice.total, invoice.currency), pageWidth - margin - 30, yPosition);
      
      yPosition += 15;

      // Payment status
      if (invoice.status === 'paid' && invoice.paidAt) {
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 128, 0);
        pdf.text(`✓ PAID on ${invoice.paidAt.toLocaleDateString()}`, margin, yPosition);
      } else if (invoice.status === 'open' && invoice.dueDate) {
        pdf.setTextColor(255, 128, 0);
        pdf.text(`⚠ DUE ${invoice.dueDate.toLocaleDateString()}`, margin, yPosition);
      }

      yPosition += 20;

      // Footer
      pdf.setFontSize(8);
      pdf.setTextColor(128, 128, 128);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Thank you for using MyShop!', margin, yPosition);
      pdf.text('This is a computer-generated invoice.', margin, yPosition + 4);

      // Generate PDF as base64 string
      const pdfData = pdf.output('datauristring');
      
      // In a real implementation, you would upload this to cloud storage
      // For now, we'll just store the base64 data URL
      const pdfUrl = pdfData;

      // Update invoice with PDF info
      await this.db
        .update(subscriptionInvoices)
        .set({
          pdfGenerated: true,
          pdfUrl: pdfUrl,
          pdfGeneratedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(subscriptionInvoices.id, invoiceId));

      return pdfUrl;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }

  // Mark invoice as paid
  async markInvoiceAsPaid(invoiceId: number, paidAt = new Date()): Promise<void> {
    try {
      await this.db
        .update(subscriptionInvoices)
        .set({
          status: 'paid',
          paidAt: paidAt,
          amountPaid: subscriptionInvoices.total,
          amountRemaining: 0,
          updatedAt: new Date(),
        })
        .where(eq(subscriptionInvoices.id, invoiceId));
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
      throw error;
    }
  }

  // Void invoice
  async voidInvoice(invoiceId: number, reason = ''): Promise<void> {
    try {
      await this.db
        .update(subscriptionInvoices)
        .set({
          status: 'void',
          voidedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(subscriptionInvoices.id, invoiceId));
    } catch (error) {
      console.error('Error voiding invoice:', error);
      throw error;
    }
  }
}