import { NextRequest, NextResponse } from "next/server";
import { paymentService } from "@/lib/payment-service";
import { getDb } from "@/lib/db";
import { orders } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      orderId, 
      method, 
      provider, 
      customerPhone, 
      customerEmail, 
      customerName 
    } = body;

    if (!orderId || !method) {
      return NextResponse.json(
        { error: "orderId and method are required" },
        { status: 400 }
      );
    }

    // Validate method
    if (!['mpesa', 'bank_transfer', 'cash_on_delivery'].includes(method)) {
      return NextResponse.json(
        { error: "Invalid payment method" },
        { status: 400 }
      );
    }

    // Validate M-Pesa specific requirements
    if (method === 'mpesa') {
      if (!provider || !['vodacom', 'movitel'].includes(provider)) {
        return NextResponse.json(
          { error: "Valid provider (vodacom/movitel) required for M-Pesa" },
          { status: 400 }
        );
      }
      
      if (!customerPhone) {
        return NextResponse.json(
          { error: "Customer phone required for M-Pesa" },
          { status: 400 }
        );
      }
    }

    // Get order details
    const db = getDb();
    const [order] = await db.select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Check if payment already exists for this order
    const existingPayment = await paymentService.getPaymentByOrderId(orderId);
    if (existingPayment && ['completed', 'processing'].includes(existingPayment.status)) {
      return NextResponse.json(
        { error: "Payment already exists for this order" },
        { status: 409 }
      );
    }

    // Calculate payment amount from order
    const orderTotal = await calculateOrderTotal(order);

    // Create payment request
    const paymentRequest = {
      orderId: order.id,
      sellerId: order.sellerId,
      customerId: order.customerId || undefined,
      method: method as 'mpesa' | 'bank_transfer' | 'cash_on_delivery',
      amount: orderTotal,
      currency: 'MZN', // Mozambican Metical
      customerPhone,
      customerEmail,
      customerName,
      metadata: {
        provider,
        userAgent: req.headers.get('user-agent'),
        timestamp: new Date().toISOString()
      }
    };

    // Process payment
    const result = await paymentService.createPayment(paymentRequest);

    return NextResponse.json({
      success: true,
      paymentId: result.id,
      status: result.status,
      externalId: result.externalId,
      confirmationCode: result.confirmationCode,
      instructions: result.instructions,
      metadata: result.metadata
    });

  } catch (error) {
    console.error('Payment initiation error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to initiate payment",
        success: false 
      },
      { status: 500 }
    );
  }
}

async function calculateOrderTotal(order: any): Promise<number> {
  // Extract total from order message or calculate from shipping cost + discount
  let total = 0;

  // Try to extract total from order message
  const message = order.message || '';
  const totalMatch = message.match(/Total[:\s]+\$?(\d+\.?\d*)/i);
  
  if (totalMatch) {
    total = parseFloat(totalMatch[1]);
  } else {
    // Fallback: assume order message contains item prices
    const priceMatches = message.match(/\$(\d+\.?\d*)/g);
    if (priceMatches) {
      total = priceMatches.reduce((sum: number, match: string) => {
        return sum + parseFloat(match.replace('$', ''));
      }, 0);
    }
  }

  // Add shipping cost if available
  if (order.shippingCost) {
    total += parseFloat(order.shippingCost);
  }

  // Subtract discount if available
  if (order.discountAmount) {
    total -= parseFloat(order.discountAmount);
  }

  // Convert USD to MZN (approximate rate: 1 USD = 64 MZN)
  // In production, this should use a real exchange rate API
  const usdToMzn = 64;
  const totalInMzn = Math.round(total * usdToMzn * 100) / 100; // Round to 2 decimal places

  return Math.max(totalInMzn, 1); // Minimum 1 MZN
}