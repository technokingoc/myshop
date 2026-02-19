import { NextRequest, NextResponse } from "next/server";
import { paymentService } from "@/lib/payment-service";
import { emitEvent } from "@/lib/events";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const provider = req.nextUrl.searchParams.get('provider') as 'vodacom' | 'movitel' | null;
    
    // Legacy support for old webhook format
    if (body.orderId && body.status) {
      const orderId = Number(body.orderId);
      const sellerId = Number(body.sellerId || 0);
      const status = body.status as "pending" | "paid" | "failed" | "manual";

      // Handle legacy webhook - find payment by order ID and update
      const payment = await paymentService.getPaymentByOrderId(orderId);
      if (payment) {
        const newStatus = status === 'paid' ? 'completed' : 
                         status === 'failed' ? 'failed' : 
                         status === 'manual' ? 'completed' : 'pending';
        
        await paymentService.updatePaymentStatus(
          payment.id,
          newStatus,
          `Legacy webhook: ${status}`,
          { legacyWebhook: body }
        );

        if (sellerId) {
          emitEvent({
            type: "payment:status",
            sellerId,
            message: `Payment ${newStatus} for order #${orderId}`,
            payload: { paymentId: payment.id, status: newStatus, orderId },
          });
        }

        return NextResponse.json({ 
          ok: true, 
          payment: { paymentId: payment.id, status: newStatus } 
        });
      }
    }

    // New M-Pesa webhook format
    if (!provider) {
      return NextResponse.json({ 
        error: "Provider parameter required for M-Pesa webhooks" 
      }, { status: 400 });
    }

    // Process M-Pesa webhook
    const result = await paymentService.processWebhook(body, provider);
    
    if (result.success && result.paymentId) {
      const payment = await paymentService.getPayment(result.paymentId);
      if (payment) {
        emitEvent({
          type: "payment:status",
          sellerId: payment.sellerId,
          message: `M-Pesa payment ${result.status} for order #${payment.orderId}`,
          payload: { 
            paymentId: result.paymentId, 
            status: result.status, 
            orderId: payment.orderId,
            method: 'mpesa',
            provider 
          },
        });
      }
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Webhook processing failed",
        success: false 
      },
      { status: 500 }
    );
  }
}