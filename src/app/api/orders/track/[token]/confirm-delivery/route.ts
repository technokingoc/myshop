import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { orders } from "@/lib/schema";
import { eq } from "drizzle-orm";

function parseOrderId(token: string) {
  const match = token.match(/^(ORD|MS)-?(\d+)$/i);
  return match ? Number(match[2]) : 0;
}

export async function POST(
  request: Request, 
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  
  try {
    const orderId = parseOrderId(token);
    if (!orderId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    const body = await request.json();
    const {
      confirmed,
      photos,
      notes,
      deliveryRating,
      sellerRating,
      deliveredBy,
      deliveryLocation,
    } = body;

    const db = getDb();
    
    // Check if order exists and is delivered
    const existingOrder = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!existingOrder.length) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const order = existingOrder[0];

    // Only allow confirmation for delivered orders
    if (order.status !== 'delivered') {
      return NextResponse.json(
        { error: "Order is not yet delivered" }, 
        { status: 400 }
      );
    }

    // Prepare the confirmation data
    const confirmationData = {
      confirmed: Boolean(confirmed),
      confirmationDate: confirmed ? new Date() : null,
      photos: photos || [],
      notes: notes || '',
      deliveryRating: deliveryRating || null,
      sellerRating: sellerRating || null,
      deliveredBy: deliveredBy || '',
      deliveryLocation: deliveryLocation || '',
    };

    // For now, we'll store this in the order's metadata
    // In a production app, you'd store this in the delivery_confirmations table
    const updatedStatusHistory = [
      ...(order.statusHistory || []),
      {
        status: 'delivered',
        at: new Date().toISOString(),
        note: confirmed 
          ? `Delivery confirmed by customer${notes ? `: ${notes}` : ''}`
          : 'Customer reported order not yet delivered',
      }
    ];

    // Update the order with confirmation metadata
    await db
      .update(orders)
      .set({
        statusHistory: updatedStatusHistory,
        // Store confirmation in notes for now (in production, use delivery_confirmations table)
        notes: (order.notes || '') + 
          (order.notes ? '\n\n' : '') + 
          `DELIVERY CONFIRMATION (${new Date().toISOString()}): ` +
          `Confirmed: ${confirmed ? 'Yes' : 'No'}` +
          (notes ? `, Notes: ${notes}` : '') +
          (deliveryRating ? `, Delivery Rating: ${deliveryRating}/5` : '') +
          (sellerRating ? `, Seller Rating: ${sellerRating}/5` : '') +
          (deliveredBy ? `, Delivered by: ${deliveredBy}` : '') +
          (deliveryLocation ? `, Location: ${deliveryLocation}` : '') +
          (photos?.length ? `, Photos: ${photos.length} uploaded` : ''),
      })
      .where(eq(orders.id, orderId));

    return NextResponse.json({ 
      success: true, 
      message: "Delivery confirmation recorded successfully",
      confirmed,
    });

  } catch (error) {
    console.error('Delivery confirmation error:', error);
    return NextResponse.json(
      { error: "Failed to record delivery confirmation" }, 
      { status: 500 }
    );
  }
}