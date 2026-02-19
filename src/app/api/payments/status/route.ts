import { NextRequest, NextResponse } from "next/server";
import { paymentService } from "@/lib/payment-service";
import { emitEvent } from "@/lib/events";

export async function GET(req: NextRequest) {
  try {
    const orderId = Number(req.nextUrl.searchParams.get("orderId") || 0);
    const paymentId = Number(req.nextUrl.searchParams.get("paymentId") || 0);
    
    if (!orderId && !paymentId) {
      return NextResponse.json({ error: "orderId or paymentId required" }, { status: 400 });
    }

    let payment;
    if (paymentId) {
      payment = await paymentService.getPayment(paymentId);
    } else {
      payment = await paymentService.getPaymentByOrderId(orderId);
    }

    if (!payment) {
      return NextResponse.json({ status: "pending", message: "No payment found" });
    }

    return NextResponse.json({
      id: payment.id,
      orderId: payment.orderId,
      status: payment.status,
      method: payment.method,
      provider: payment.provider,
      amount: parseFloat(payment.amount),
      currency: payment.currency,
      externalId: payment.externalId,
      confirmationCode: payment.confirmationCode,
      createdAt: payment.createdAt,
      completedAt: payment.completedAt,
      metadata: payment.metadata
    });
  } catch (error) {
    console.error('Payment status error:', error);
    return NextResponse.json(
      { error: "Failed to get payment status" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const paymentId = Number(body.paymentId || 0);
    const orderId = Number(body.orderId || 0);
    const sellerId = Number(body.sellerId || 0);
    const status = body.status as "pending" | "processing" | "completed" | "failed" | "cancelled";
    const reason = body.reason as string | undefined;

    if (!paymentId && !orderId) {
      return NextResponse.json({ error: "paymentId or orderId required" }, { status: 400 });
    }

    if (!status) {
      return NextResponse.json({ error: "status required" }, { status: 400 });
    }

    let payment;
    if (paymentId) {
      payment = await paymentService.getPayment(paymentId);
    } else {
      payment = await paymentService.getPaymentByOrderId(orderId);
    }

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    await paymentService.updatePaymentStatus(payment.id, status, reason);
    
    // Get updated payment
    const updatedPayment = await paymentService.getPayment(payment.id);

    if (sellerId || payment.sellerId) {
      emitEvent({
        type: "payment:status",
        sellerId: sellerId || payment.sellerId,
        message: `Payment status updated to ${status} for order #${payment.orderId}`,
        payload: { paymentId: payment.id, orderId: payment.orderId, status },
      });
    }

    return NextResponse.json({
      id: updatedPayment?.id,
      status: updatedPayment?.status,
      updatedAt: updatedPayment?.updatedAt
    });
  } catch (error) {
    console.error('Payment status update error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update payment status" },
      { status: 500 }
    );
  }
}
