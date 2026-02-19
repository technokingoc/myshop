import { NextRequest, NextResponse } from "next/server";
import { getSessionFromCookie } from "@/lib/session";
import { paymentService } from "@/lib/payment-service";
import { getDb } from "@/lib/db";
import { payments } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    if (!session?.sellerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { paymentId, notes, externalTransactionId } = body;

    if (!paymentId) {
      return NextResponse.json(
        { error: "paymentId is required" },
        { status: 400 }
      );
    }

    const db = getDb();

    // Get payment details
    const paymentRecord = await db
      .select()
      .from(payments)
      .where(eq(payments.id, paymentId))
      .limit(1);

    if (paymentRecord.length === 0) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const payment = paymentRecord[0];

    // Verify the payment belongs to the current seller
    if (payment.sellerId !== session.sellerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if payment is already confirmed
    if (payment.status === "confirmed") {
      return NextResponse.json(
        { error: "Payment is already confirmed" },
        { status: 400 }
      );
    }

    // Check if payment is in a valid state for confirmation
    if (payment.status !== "pending") {
      return NextResponse.json(
        { error: "Payment cannot be confirmed in its current state" },
        { status: 400 }
      );
    }

    // Confirm the payment
    await paymentService.updatePaymentStatus(
      paymentId,
      "completed",
      notes || "Manually confirmed by seller",
      {
        confirmedBy: session.sellerId || 0,
        externalTransactionId,
        confirmMethod: "manual"
      }
    );
    
    // Get the updated payment
    const confirmedPayment = await paymentService.getPayment(paymentId);

    return NextResponse.json({
      success: true,
      payment: {
        id: confirmedPayment.id,
        orderId: confirmedPayment.orderId,
        method: confirmedPayment.method,
        status: confirmedPayment.status,
        amount: parseFloat(confirmedPayment.amount),
        currency: confirmedPayment.currency,
        externalReference: confirmedPayment.externalReference,
        completedAt: confirmedPayment.completedAt,
        confirmationCode: confirmedPayment.confirmationCode,
      },
    });
  } catch (error) {
    console.error("Payment confirmation error:", error);
    return NextResponse.json(
      { error: "Failed to confirm payment" },
      { status: 500 }
    );
  }
}

// Get payment details for confirmation
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    if (!session?.sellerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get("paymentId");
    const orderId = searchParams.get("orderId");

    if (!paymentId && !orderId) {
      return NextResponse.json(
        { error: "paymentId or orderId is required" },
        { status: 400 }
      );
    }

    const db = getDb();
    let payment;

    if (paymentId) {
      const result = await db
        .select()
        .from(payments)
        .where(eq(payments.id, parseInt(paymentId)))
        .limit(1);
      payment = result.length > 0 ? result[0] : null;
    } else if (orderId) {
      payment = await paymentService.getPaymentByOrderId(parseInt(orderId));
    }

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Verify the payment belongs to the current seller
    if (payment.sellerId !== session.sellerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json({
      payment: {
        id: payment.id,
        orderId: payment.orderId,
        method: payment.method,
        status: payment.status,
        amount: parseFloat(payment.amount),
        currency: payment.currency,
        externalReference: payment.externalReference,
        externalId: payment.externalId,
        payerPhone: payment.payerPhone,
        payerName: payment.payerName,
        confirmationCode: payment.confirmationCode,
        completedAt: payment.completedAt,
        processedAt: payment.processedAt,
        failedAt: payment.failedAt,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching payment details:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment details" },
      { status: 500 }
    );
  }
}