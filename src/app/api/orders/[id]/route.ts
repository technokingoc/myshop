import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { orders, sellers, catalogItems, users, customerAddresses } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: Request, 
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const { searchParams } = new URL(request.url);
  const sellerId = searchParams.get('sellerId');
  
  try {
    if (!sellerId) {
      return NextResponse.json({ error: "Seller ID required" }, { status: 400 });
    }

    const db = getDb();
    
    const orderData = await db
      .select({
        // Order fields
        id: orders.id,
        customerName: orders.customerName,
        customerContact: orders.customerContact,
        message: orders.message,
        status: orders.status,
        notes: orders.notes,
        statusHistory: orders.statusHistory,
        createdAt: orders.createdAt,
        trackingNumber: orders.trackingNumber,
        estimatedDelivery: orders.estimatedDelivery,
        shippingAddress: orders.shippingAddress,
        customerId: orders.customerId,
        
        // Item fields
        itemId: orders.itemId,
        itemName: catalogItems.name,
        itemType: catalogItems.type,
        itemPrice: catalogItems.price,
        
        // Seller fields
        sellerName: sellers.name,
        sellerSlug: sellers.slug,
      })
      .from(orders)
      .leftJoin(catalogItems, eq(orders.itemId, catalogItems.id))
      .leftJoin(sellers, eq(orders.sellerId, sellers.id))
      .where(eq(orders.id, Number(id)));

    if (!orderData.length) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const order = orderData[0];
    
    // Verify order belongs to the seller
    if (order.sellerName) {
      const sellerInfo = await db
        .select({ id: sellers.id })
        .from(sellers)
        .where(eq(sellers.id, Number(sellerId)))
        .limit(1);
        
      if (!sellerInfo.length) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }

    // Format the response
    const response = {
      id: String(order.id),
      customerName: order.customerName,
      customerContact: order.customerContact,
      message: order.message || '',
      itemId: order.itemId,
      itemName: order.itemName || '',
      itemType: order.itemType || '',
      itemPrice: order.itemPrice || '',
      storeName: order.sellerName || '',
      status: order.status,
      notes: order.notes || '',
      statusHistory: order.statusHistory || [],
      createdAt: order.createdAt,
      trackingNumber: order.trackingNumber || '',
      estimatedDelivery: order.estimatedDelivery,
      shippingAddress: order.shippingAddress,
      sellerName: order.sellerName || '',
      sellerSlug: order.sellerSlug || '',
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Order fetch error:', error);
    return NextResponse.json(
      { error: "Failed to fetch order" }, 
      { status: 500 }
    );
  }
}