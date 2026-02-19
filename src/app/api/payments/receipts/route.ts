import { NextRequest, NextResponse } from "next/server";
import { getSessionFromCookie } from "@/lib/session";
import { getDb } from "@/lib/db";
import { paymentReceipts, payments, orders } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    if (!session?.sellerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const receiptId = searchParams.get("receiptId");
    const paymentId = searchParams.get("paymentId");
    const format = searchParams.get("format") || "json"; // json, html, pdf

    if (!receiptId && !paymentId) {
      return NextResponse.json(
        { error: "receiptId or paymentId is required" },
        { status: 400 }
      );
    }

    const db = getDb();
    let receipt;

    if (receiptId) {
      const result = await db
        .select()
        .from(paymentReceipts)
        .where(eq(paymentReceipts.id, parseInt(receiptId)))
        .limit(1);
      receipt = result.length > 0 ? result[0] : null;
    } else if (paymentId) {
      const result = await db
        .select()
        .from(paymentReceipts)
        .where(eq(paymentReceipts.paymentId, parseInt(paymentId)))
        .limit(1);
      receipt = result.length > 0 ? result[0] : null;
    }

    if (!receipt) {
      return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
    }

    // Verify the receipt belongs to the current seller
    if (receipt.sellerId !== session.sellerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (format === "html") {
      // Generate HTML receipt
      const htmlReceipt = generateHTMLReceipt(receipt);
      return new NextResponse(htmlReceipt, {
        headers: {
          "Content-Type": "text/html",
          "Content-Disposition": `inline; filename="receipt-${receipt.receiptNumber}.html"`,
        },
      });
    } else if (format === "pdf") {
      // For PDF generation, you would typically use a library like puppeteer or jsPDF
      // For now, we'll return the HTML with PDF headers
      const htmlReceipt = generateHTMLReceipt(receipt);
      return new NextResponse(htmlReceipt, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="receipt-${receipt.receiptNumber}.pdf"`,
        },
      });
    }

    // Default JSON response
    return NextResponse.json({
      receipt: {
        id: receipt.id,
        receiptNumber: receipt.receiptNumber,
        receiptDate: receipt.receiptDate,
        paymentId: receipt.paymentId,
        orderId: receipt.orderId,
        customerName: receipt.customerName,
        customerEmail: receipt.customerEmail,
        customerPhone: receipt.customerPhone,
        paymentMethod: receipt.paymentMethod,
        paymentAmount: receipt.paymentAmount,
        paymentReference: receipt.paymentReference,
        orderItems: receipt.orderItems,
        orderSubtotal: receipt.orderSubtotal,
        orderDiscount: receipt.orderDiscount,
        orderShipping: receipt.orderShipping,
        orderTotal: receipt.orderTotal,
        storeName: receipt.storeName,
        storeAddress: receipt.storeAddress,
        storePhone: receipt.storePhone,
        storeEmail: receipt.storeEmail,
        createdAt: receipt.createdAt,
      },
    });
  } catch (error) {
    console.error("Error fetching receipt:", error);
    return NextResponse.json(
      { error: "Failed to fetch receipt" },
      { status: 500 }
    );
  }
}

function generateHTMLReceipt(receipt: any): string {
  const paymentMethodNames = {
    mpesa: "M-Pesa",
    bank_transfer: "Bank Transfer"
  };

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Receipt - ${receipt.receiptNumber}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          color: #333;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #000;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .receipt-title {
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .receipt-number {
          font-size: 18px;
          color: #666;
        }
        .section {
          margin-bottom: 25px;
        }
        .section-title {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 10px;
          border-bottom: 1px solid #ccc;
          padding-bottom: 5px;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
        }
        .info-label {
          font-weight: bold;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        .items-table th,
        .items-table td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        .items-table th {
          background-color: #f2f2f2;
          font-weight: bold;
        }
        .total-row {
          font-weight: bold;
          border-top: 2px solid #000;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          color: #666;
          font-size: 14px;
        }
        @media print {
          body { margin: 0; padding: 10px; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="receipt-title">PAYMENT RECEIPT</div>
        <div class="receipt-number">Receipt #${receipt.receiptNumber}</div>
      </div>

      <div class="section">
        <div class="section-title">Store Information</div>
        <div class="info-row">
          <span class="info-label">Store Name:</span>
          <span>${receipt.storeName}</span>
        </div>
        ${receipt.storeAddress ? `
          <div class="info-row">
            <span class="info-label">Address:</span>
            <span>${receipt.storeAddress}</span>
          </div>
        ` : ''}
        ${receipt.storePhone ? `
          <div class="info-row">
            <span class="info-label">Phone:</span>
            <span>${receipt.storePhone}</span>
          </div>
        ` : ''}
        ${receipt.storeEmail ? `
          <div class="info-row">
            <span class="info-label">Email:</span>
            <span>${receipt.storeEmail}</span>
          </div>
        ` : ''}
      </div>

      <div class="section">
        <div class="section-title">Customer Information</div>
        <div class="info-row">
          <span class="info-label">Name:</span>
          <span>${receipt.customerName}</span>
        </div>
        ${receipt.customerEmail ? `
          <div class="info-row">
            <span class="info-label">Email:</span>
            <span>${receipt.customerEmail}</span>
          </div>
        ` : ''}
        ${receipt.customerPhone ? `
          <div class="info-row">
            <span class="info-label">Phone:</span>
            <span>${receipt.customerPhone}</span>
          </div>
        ` : ''}
      </div>

      <div class="section">
        <div class="section-title">Payment Details</div>
        <div class="info-row">
          <span class="info-label">Receipt Date:</span>
          <span>${new Date(receipt.receiptDate).toLocaleDateString()}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Payment Method:</span>
          <span>${paymentMethodNames[receipt.paymentMethod as keyof typeof paymentMethodNames] || receipt.paymentMethod}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Payment Reference:</span>
          <span>${receipt.paymentReference}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Order ID:</span>
          <span>#${receipt.orderId}</span>
        </div>
      </div>

      ${receipt.orderItems && receipt.orderItems.length > 0 ? `
        <div class="section">
          <div class="section-title">Order Items</div>
          <table class="items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${receipt.orderItems.map((item: any) => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.quantity}</td>
                  <td>${parseFloat(item.price).toFixed(2)} MZN</td>
                  <td>${parseFloat(item.total).toFixed(2)} MZN</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}

      <div class="section">
        <div class="section-title">Payment Summary</div>
        <div class="info-row">
          <span class="info-label">Subtotal:</span>
          <span>${parseFloat(receipt.orderSubtotal).toFixed(2)} MZN</span>
        </div>
        ${parseFloat(receipt.orderDiscount) > 0 ? `
          <div class="info-row">
            <span class="info-label">Discount:</span>
            <span>-${parseFloat(receipt.orderDiscount).toFixed(2)} MZN</span>
          </div>
        ` : ''}
        ${parseFloat(receipt.orderShipping) > 0 ? `
          <div class="info-row">
            <span class="info-label">Shipping:</span>
            <span>${parseFloat(receipt.orderShipping).toFixed(2)} MZN</span>
          </div>
        ` : ''}
        <div class="info-row total-row">
          <span class="info-label">Total Paid:</span>
          <span>${parseFloat(receipt.paymentAmount).toFixed(2)} MZN</span>
        </div>
      </div>

      <div class="footer">
        <p>Thank you for your business!</p>
        <p>Receipt generated on ${new Date().toLocaleDateString()}</p>
      </div>
    </body>
    </html>
  `;
}