import { NextRequest } from 'next/server';
import { InvoiceService } from '@/lib/invoice-service';
import { getSellerFromSession } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const invoiceId = parseInt(resolvedParams.id);
    if (isNaN(invoiceId)) {
      return Response.json({ error: 'Invalid invoice ID' }, { status: 400 });
    }

    // Get seller from session
    const sellerId = await getSellerFromSession(request);
    if (!sellerId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const invoiceService = new InvoiceService();
    
    // Get the invoice and verify ownership
    const invoice = await invoiceService.getInvoice(invoiceId);
    if (!invoice) {
      return Response.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (invoice.sellerId !== sellerId) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Generate PDF if it doesn't exist
    let pdfUrl = invoice.pdfUrl;
    if (!pdfUrl) {
      pdfUrl = await invoiceService.generatePDF(invoiceId);
    }

    if (!pdfUrl) {
      return Response.json({ error: 'Failed to generate PDF' }, { status: 500 });
    }

    // Return PDF data
    if (pdfUrl.startsWith('data:application/pdf;base64,')) {
      const base64Data = pdfUrl.replace('data:application/pdf;base64,', '');
      const pdfBuffer = Buffer.from(base64Data, 'base64');
      
      return new Response(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`,
          'Cache-Control': 'private, no-cache',
        },
      });
    } else {
      // If it's a URL, redirect to it
      return Response.redirect(pdfUrl);
    }
  } catch (error) {
    console.error('Error downloading invoice:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}