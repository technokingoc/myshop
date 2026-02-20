import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { orders, notifications } from "@/lib/schema";
import { eq } from "drizzle-orm";

type DeliveryConfirmationData = {
  confirmed: boolean;
  photos?: string[];
  notes?: string;
  deliveryRating?: number;
  sellerRating?: number;
  deliveredBy?: string;
  deliveryLocation?: string;
};

function parseOrderId(token: string) {
  const match = token.match(/^(ORD|MS)-?(\d+)$/i);
  return match ? Number(match[2]) : 0;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;
    const orderId = parseOrderId(token);
    
    if (!orderId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    const data: DeliveryConfirmationData = await request.json();
    const { confirmed, photos, notes, deliveryRating, sellerRating, deliveredBy, deliveryLocation } = data;

    const db = getDb();

    // Verify the order exists
    const existingOrder = await db
      .select({
        id: orders.id,
        sellerId: orders.sellerId,
        status: orders.status,
        customerName: orders.customerName,
        deliveryConfirmed: orders.deliveryConfirmed,
      })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (existingOrder.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const order = existingOrder[0];

    // Check if order is in a deliverable status
    if (!['delivered', 'in-transit', 'shipped'].includes(order.status)) {
      return NextResponse.json({ 
        error: "Order must be shipped or delivered to confirm delivery" 
      }, { status: 400 });
    }

    // Prepare update data
    const updateData: any = {
      deliveryConfirmed: confirmed,
      deliveryConfirmedAt: confirmed ? new Date() : null,
    };

    // Add delivery details if confirmed
    if (confirmed) {
      if (deliveryRating !== undefined && deliveryRating >= 1 && deliveryRating <= 5) {
        updateData.deliveryRating = deliveryRating;
      }
      
      if (sellerRating !== undefined && sellerRating >= 1 && sellerRating <= 5) {
        updateData.sellerRating = sellerRating;
      }
      
      if (deliveredBy) {
        updateData.deliveredBy = deliveredBy;
      }
      
      if (deliveryLocation) {
        updateData.deliveryLocation = deliveryLocation;
      }
      
      if (notes) {
        updateData.deliveryNotes = notes;
      }
      
      if (photos && photos.length > 0) {
        updateData.deliveryPhotos = JSON.stringify(photos);
      }

      // Update status to delivered if not already
      if (order.status !== 'delivered') {
        updateData.status = 'delivered';
        
        // Add to status history
        const statusHistoryEntry = {
          status: 'delivered',
          at: new Date().toISOString(),
          note: 'Delivery confirmed by customer'
        };
        
        // Get existing status history
        const currentOrder = await db
          .select({ statusHistory: orders.statusHistory })
          .from(orders)
          .where(eq(orders.id, orderId))
          .limit(1);
          
        const currentHistory = (currentOrder[0]?.statusHistory as any[]) || [];
        updateData.statusHistory = [...currentHistory, statusHistoryEntry];
      }
    }

    // Update the order
    await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, orderId));

    // Create notification for seller
    if (confirmed) {
      try {
        const notificationTitle = `Order ${orderId} delivery confirmed`;
        const notificationMessage = `${order.customerName} has confirmed delivery of order ${orderId}${deliveryRating ? ` (${deliveryRating}/5 stars)` : ''}`;

        await db.insert(notifications).values({
          sellerId: order.sellerId,
          type: 'delivery_confirmation',
          title: notificationTitle,
          message: notificationMessage,
          orderId,
          actionUrl: `/dashboard/orders/${orderId}`,
          priority: 2,
          metadata: {
            deliveryRating,
            sellerRating,
            hasPhotos: photos && photos.length > 0,
            customerNotes: notes || '',
          },
        });
      } catch (notificationError) {
        console.warn('Failed to create delivery confirmation notification:', notificationError);
        // Don't fail the main request
      }
    }

    return NextResponse.json({
      success: true,
      message: confirmed ? "Delivery confirmed successfully" : "Delivery marked as not received",
      orderId,
      confirmed,
      confirmedAt: confirmed ? new Date().toISOString() : null,
    });

  } catch (error) {
    console.error("Error confirming delivery:", error);
    return NextResponse.json(
      { error: "Failed to process delivery confirmation" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;
    const orderId = parseOrderId(token);
    
    if (!orderId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    const db = getDb();

    // Get delivery confirmation details
    const result = await db
      .select({
        id: orders.id,
        status: orders.status,
        deliveryConfirmed: orders.deliveryConfirmed,
        deliveryConfirmedAt: orders.deliveryConfirmedAt,
        deliveryRating: orders.deliveryRating,
        sellerRating: orders.sellerRating,
        deliveredBy: orders.deliveredBy,
        deliveryLocation: orders.deliveryLocation,
        deliveryNotes: orders.deliveryNotes,
        deliveryPhotos: orders.deliveryPhotos,
      })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const order = result[0];

    let photos: string[] = [];
    if (order.deliveryPhotos) {
      try {
        photos = JSON.parse(order.deliveryPhotos);
      } catch {
        photos = [];
      }
    }

    return NextResponse.json({
      orderId,
      confirmed: order.deliveryConfirmed || false,
      confirmedAt: order.deliveryConfirmedAt,
      deliveryRating: order.deliveryRating,
      sellerRating: order.sellerRating,
      deliveredBy: order.deliveredBy || '',
      deliveryLocation: order.deliveryLocation || '',
      notes: order.deliveryNotes || '',
      photos,
      canConfirm: ['delivered', 'in-transit', 'shipped'].includes(order.status) && !order.deliveryConfirmed,
    });

  } catch (error) {
    console.error("Error fetching delivery confirmation:", error);
    return NextResponse.json(
      { error: "Failed to fetch delivery confirmation" },
      { status: 500 }
    );
  }
}