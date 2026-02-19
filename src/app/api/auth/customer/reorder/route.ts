import { NextRequest, NextResponse } from "next/server";
import { orders, catalogItems, sellers } from "@/lib/schema";
import { getDb } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { getCustomerSession } from "@/lib/customer-session";

export async function POST(request: NextRequest) {
  try {
    const session = await getCustomerSession();
    if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    const db = getDb();
    
    // Get the order details
    const orderDetails = await db
      .select({
        orderId: orders.id,
        itemId: orders.itemId,
        itemName: catalogItems.name,
        itemPrice: catalogItems.price,
        itemStatus: catalogItems.status,
        sellerSlug: sellers.slug,
        sellerId: sellers.id,
      })
      .from(orders)
      .leftJoin(catalogItems, eq(orders.itemId, catalogItems.id))
      .leftJoin(sellers, eq(orders.sellerId, sellers.id))
      .where(and(eq(orders.id, orderId), eq(orders.customerId, session.customerId)))
      .limit(1);

    if (orderDetails.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const order = orderDetails[0];

    // Check if the item is still available
    if (!order.itemId || order.itemStatus !== "Active") {
      return NextResponse.json({ 
        error: "This item is no longer available", 
        itemName: order.itemName 
      }, { status: 400 });
    }

    // Return item information for frontend to handle cart addition
    return NextResponse.json({ 
      success: true, 
      message: "Item ready to add to cart",
      item: {
        id: order.itemId,
        name: order.itemName,
        price: parseFloat(order.itemPrice || "0"),
        storeId: order.sellerId,
        storeName: order.sellerSlug, // Using slug as store name for now
        quantity: 1,
      },
      redirectUrl: "/cart"
    });
  } catch (error) {
    console.error("Error reordering:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}