import { NextRequest, NextResponse } from "next/server";
import { getSessionFromCookie } from "@/lib/session";
import { getDb } from "@/lib/db";
import { payments, orders, sellers } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    if (!session?.sellerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get("paymentId");
    const format = searchParams.get("format") || "json"; // json, html, pdf

    if (!paymentId) {
      return NextResponse.json(
        { error: "paymentId is required" },
        { status: 400 }
      );
    }

    const db = getDb();

    // Get payment with order and seller details
    const paymentQuery = await db
      .select({
        payment: payments,
        order: orders,
        seller: sellers,
      })
      .from(payments)
      .leftJoin(orders, eq(payments.orderId, orders.id))
      .leftJoin(sellers, eq(payments.sellerId, sellers.id))
      .where(
        and(
          eq(payments.id, parseInt(paymentId)),
          eq(payments.sellerId, session.sellerId)
        )
      )
      .limit(1);

    if (paymentQuery.length === 0) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const { payment, order, seller } = paymentQuery[0];

    if (format === "html") {
      const htmlReceipt = generateHTMLReceipt(payment, order, seller);
      return new NextResponse(htmlReceipt, {
        headers: {
          "Content-Type": "text/html",
          "Content-Disposition": `inline; filename="receipt-${payment.id}.html"`,
        },
      });
    }

    // Default JSON response
    return NextResponse.json({
      receipt: {
        id: payment.id,
        receiptNumber: `RCP-${payment.id}`,
        receiptDate: payment.completedAt || payment.createdAt,
        paymentId: payment.id,
        orderId: payment.orderId,
        customerName: payment.payerName || order?.customerName,
        customerEmail: payment.payerEmail || order?.shippingAddress?.email,
        customerPhone: payment.payerPhone || order?.shippingAddress?.phone,
        paymentMethod: payment.method,
        paymentAmount: payment.netAmount,
        paymentReference: payment.externalReference || payment.externalId,
        currency: payment.currency,
        storeName: seller?.name,
        storeEmail: seller?.email,
        orderTotal: payment.netAmount,
        createdAt: payment.createdAt,
        status: payment.status,
      },
    });
  } catch (error) {
    console.error("Error generating receipt:", error);
    return NextResponse.json(
      { error: "Failed to generate receipt" },
      { status: 500 }
    );
  }
}

function generateHTMLReceipt(payment: any, order: any, seller: any): string {
  const paymentMethodNames = {
    mpesa: "M-Pesa Mobile Money",
    bank_transfer: "Bank Transfer",
    cash_on_delivery: "Cash on Delivery"
  };

  const statusNames = {
    completed: "Paid",
    pending: "Pending",
    processing: "Processing",
    failed: "Failed",
    cancelled: "Cancelled"
  };

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Receipt - RCP-${payment.id}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          color: #333;
          line-height: 1.6;
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #16a34a;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .receipt-title {
          font-size: 32px;
          font-weight: bold;
          color: #16a34a;
          margin-bottom: 10px;
        }
        .receipt-number {
          font-size: 18px;
          color: #666;
          font-weight: 500;
        }
        .section {
          margin-bottom: 30px;
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
        }
        .section-title {
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 15px;
          color: #16a34a;
          border-bottom: 2px solid #16a34a;
          padding-bottom: 5px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 10px;
          margin-bottom: 10px;
        }
        .info-label {
          font-weight: 600;
          color: #374151;
        }
        .info-value {
          color: #111827;
        }
        .status-badge {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 14px;
          text-transform: uppercase;
        }
        .status-completed {
          background: #dcfce7;
          color: #166534;
        }
        .status-pending {
          background: #fef3c7;
          color: #92400e;
        }
        .status-failed {
          background: #fee2e2;
          color: #991b1b;
        }
        .amount-highlight {
          font-size: 24px;
          font-weight: bold;
          color: #16a34a;
          background: #f0fdf4;
          padding: 15px;
          border-radius: 8px;
          text-align: center;
          margin: 20px 0;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #e5e7eb;
          text-align: center;
          color: #6b7280;
          font-size: 14px;
        }
        .qr-placeholder {
          width: 120px;
          height: 120px;
          background: #f3f4f6;
          border: 2px dashed #d1d5db;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 20px auto;
          font-size: 12px;
          color: #6b7280;
        }
        @media print {
          body { margin: 0; padding: 15px; }
          .section { break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="receipt-title">PAYMENT RECEIPT</div>
        <div class="receipt-number">Receipt #RCP-${payment.id}</div>
      </div>

      <div class="section">
        <div class="section-title">Store Information</div>
        <div class="info-grid">
          <div class="info-label">Store Name:</div>
          <div class="info-value">${seller?.name || 'MyShop Store'}</div>
          <div class="info-label">Store Email:</div>
          <div class="info-value">${seller?.email || 'Not provided'}</div>
          <div class="info-label">Store Location:</div>
          <div class="info-value">${seller?.city || 'Mozambique'}</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Customer Information</div>
        <div class="info-grid">
          <div class="info-label">Name:</div>
          <div class="info-value">${payment.payerName || order?.customerName || 'Not provided'}</div>
          <div class="info-label">Email:</div>
          <div class="info-value">${payment.payerEmail || order?.shippingAddress?.email || 'Not provided'}</div>
          <div class="info-label">Phone:</div>
          <div class="info-value">${payment.payerPhone || order?.shippingAddress?.phone || 'Not provided'}</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Payment Details</div>
        <div class="info-grid">
          <div class="info-label">Payment Date:</div>
          <div class="info-value">${new Date(payment.completedAt || payment.createdAt).toLocaleDateString('en-GB')}</div>
          <div class="info-label">Payment Method:</div>
          <div class="info-value">${paymentMethodNames[payment.method as keyof typeof paymentMethodNames] || payment.method}</div>
          <div class="info-label">Payment Status:</div>
          <div class="info-value">
            <span class="status-badge status-${payment.status}">
              ${statusNames[payment.status as keyof typeof statusNames] || payment.status}
            </span>
          </div>
          <div class="info-label">Order Number:</div>
          <div class="info-value">#${payment.orderId}</div>
          ${payment.externalReference || payment.externalId ? `
          <div class="info-label">Reference:</div>
          <div class="info-value">${payment.externalReference || payment.externalId}</div>
          ` : ''}
          ${payment.confirmationCode ? `
          <div class="info-label">Confirmation Code:</div>
          <div class="info-value">${payment.confirmationCode}</div>
          ` : ''}
        </div>

        <div class="amount-highlight">
          Total Paid: ${parseFloat(payment.netAmount).toFixed(2)} ${payment.currency}
        </div>
      </div>

      <div class="section">
        <div class="section-title">Transaction Summary</div>
        <div class="info-grid">
          <div class="info-label">Gross Amount:</div>
          <div class="info-value">${parseFloat(payment.amount).toFixed(2)} ${payment.currency}</div>
          <div class="info-label">Transaction Fees:</div>
          <div class="info-value">${parseFloat(payment.fees).toFixed(2)} ${payment.currency}</div>
          <div class="info-label">Net Amount:</div>
          <div class="info-value"><strong>${parseFloat(payment.netAmount).toFixed(2)} ${payment.currency}</strong></div>
        </div>
      </div>

      <div class="footer">
        <p><strong>Thank you for your business!</strong></p>
        <p>Receipt generated on ${new Date().toLocaleDateString('en-GB')} at ${new Date().toLocaleTimeString('en-GB')}</p>
        <p>For support, please contact the store directly.</p>
        
        <div class="qr-placeholder">
          QR Code
          <br>
          (Receipt ${payment.id})
        </div>
      </div>
    </body>
    </html>
  `;
}