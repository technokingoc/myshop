import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { orders } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function PUT(
  request: Request, 
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  
  try {
    const body = await request.json();
    const {
      sellerId,
      trackingNumber,
      trackingProvider,
      trackingUrl,
      estimatedDelivery,
      status
    } = body;

    if (!sellerId) {
      return NextResponse.json({ error: "Seller ID required" }, { status: 400 });
    }

    const db = getDb();
    
    // Verify order belongs to seller
    const existingOrder = await db
      .select()
      .from(orders)
      .where(eq(orders.id, Number(id)))
      .limit(1);

    if (!existingOrder.length || existingOrder[0].sellerId !== Number(sellerId)) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {};
    
    if (trackingNumber !== undefined) {
      updateData.trackingNumber = trackingNumber;
    }
    
    if (estimatedDelivery !== undefined) {
      updateData.estimatedDelivery = estimatedDelivery ? new Date(estimatedDelivery) : null;
    }
    
    if (status !== undefined) {
      updateData.status = status;
      
      // Add to status history
      const currentHistory = existingOrder[0].statusHistory || [];
      const newHistoryEntry = {
        status,
        at: new Date().toISOString(),
        note: trackingNumber ? `Tracking number added: ${trackingNumber}` : `Status updated to ${status}`
      };
      updateData.statusHistory = [...currentHistory, newHistoryEntry];
    }

    // Update the order
    await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, Number(id)));

    return NextResponse.json({ 
      success: true, 
      message: "Shipping information updated successfully" 
    });

  } catch (error) {
    console.error('Shipping update error:', error);
    return NextResponse.json(
      { error: "Failed to update shipping information" }, 
      { status: 500 }
    );
  }
}