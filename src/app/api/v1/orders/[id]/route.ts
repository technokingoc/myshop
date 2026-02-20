import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { orders, catalogItems, sellers, users } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { authenticateApiRequest, API_PERMISSIONS } from "@/lib/api-keys";
import { sendOrderWebhook, WEBHOOK_EVENTS } from "@/lib/webhook-service";

// GET /api/v1/orders/[id] - Get single order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateApiRequest(request, API_PERMISSIONS.ORDERS_READ);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const { id } = await params;
    const orderId = parseInt(id, 10);
    if (isNaN(orderId)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    const db = getDb();
    
    // Build conditions
    const conditions = [eq(orders.id, orderId)];
    if (auth.sellerId) {
      conditions.push(eq(orders.sellerId, auth.sellerId));
    }

    // Get order with related data
    const orderResult = await db
      .select({
        id: orders.id,
        sellerId: orders.sellerId,
        itemId: orders.itemId,
        customerName: orders.customerName,
        customerContact: orders.customerContact,
        message: orders.message,
        status: orders.status,
        notes: orders.notes,
        statusHistory: orders.statusHistory,
        couponCode: orders.couponCode,
        discountAmount: orders.discountAmount,
        customerId: orders.customerId,
        trackingToken: orders.trackingToken,
        cancelReason: orders.cancelReason,
        refundReason: orders.refundReason,
        refundAmount: orders.refundAmount,
        shippingMethodId: orders.shippingMethodId,
        shippingCost: orders.shippingCost,
        shippingAddress: orders.shippingAddress,
        estimatedDelivery: orders.estimatedDelivery,
        trackingNumber: orders.trackingNumber,
        createdAt: orders.createdAt,
        // Product info
        productName: catalogItems.name,
        productPrice: catalogItems.price,
        productImage: catalogItems.imageUrl,
        productCategory: catalogItems.category,
        // Seller info
        sellerName: sellers.name,
        sellerSlug: sellers.slug,
        // Customer info (if available)
        customerEmail: users.email,
        customerPhone: users.phone,
      })
      .from(orders)
      .leftJoin(catalogItems, eq(orders.itemId, catalogItems.id))
      .leftJoin(sellers, eq(orders.sellerId, sellers.id))
      .leftJoin(users, eq(orders.customerId, users.id))
      .where(and(...conditions))
      .limit(1);

    if (!orderResult.length) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ data: orderResult[0] });
    
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}

// PUT /api/v1/orders/[id] - Update order (mainly status)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateApiRequest(request, API_PERMISSIONS.ORDERS_WRITE);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  if (!auth.sellerId) {
    return NextResponse.json({ error: "Seller ID required" }, { status: 400 });
  }

  try {
    const { id } = await params;
    const orderId = parseInt(id, 10);
    if (isNaN(orderId)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    const body = await request.json();
    const db = getDb();

    // Get current order
    const existingOrder = await db
      .select({
        id: orders.id,
        status: orders.status,
        statusHistory: orders.statusHistory,
        customerName: orders.customerName,
        trackingToken: orders.trackingToken,
      })
      .from(orders)
      .where(and(
        eq(orders.id, orderId),
        eq(orders.sellerId, auth.sellerId)
      ))
      .limit(1);

    if (!existingOrder.length) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const currentOrder = existingOrder[0];

    // Prepare update data
    const updateData: any = {};
    const allowedFields = [
      'status', 'notes', 'trackingNumber', 'estimatedDelivery', 
      'cancelReason', 'refundReason', 'refundAmount', 'shippingAddress'
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Handle status change
    let newStatusHistory = currentOrder.statusHistory || [];
    let webhookEventType = null;

    if (body.status && body.status !== currentOrder.status) {
      // Add to status history
      newStatusHistory = [
        ...newStatusHistory,
        {
          status: body.status,
          at: new Date().toISOString(),
          note: body.statusNote || `Status changed to ${body.status} via API`
        }
      ];
      updateData.statusHistory = newStatusHistory;

      // Determine webhook event type
      switch (body.status) {
        case 'confirmed':
        case 'processing':
          webhookEventType = WEBHOOK_EVENTS.ORDER_UPDATED;
          break;
        case 'shipped':
          webhookEventType = WEBHOOK_EVENTS.ORDER_SHIPPED;
          break;
        case 'delivered':
          webhookEventType = WEBHOOK_EVENTS.ORDER_DELIVERED;
          break;
        case 'cancelled':
          webhookEventType = WEBHOOK_EVENTS.ORDER_CANCELLED;
          break;
        default:
          webhookEventType = WEBHOOK_EVENTS.ORDER_UPDATED;
      }
    }

    // Handle date fields
    if (updateData.estimatedDelivery) {
      updateData.estimatedDelivery = new Date(updateData.estimatedDelivery);
    }

    // Update order
    const updatedOrder = await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, orderId))
      .returning({
        id: orders.id,
        status: orders.status,
        customerName: orders.customerName,
        trackingToken: orders.trackingToken,
        trackingNumber: orders.trackingNumber,
        createdAt: orders.createdAt,
      });

    // Send webhook notification if status changed
    if (webhookEventType) {
      try {
        await sendOrderWebhook(auth.userId!, webhookEventType, {
          order_id: updatedOrder[0].id,
          status: updatedOrder[0].status,
          previous_status: currentOrder.status,
          customer_name: updatedOrder[0].customerName,
          tracking_token: updatedOrder[0].trackingToken,
          tracking_number: updatedOrder[0].trackingNumber,
          updated_at: new Date().toISOString(),
          status_note: body.statusNote || null,
        });
      } catch (webhookError) {
        console.error("Failed to send webhook:", webhookError);
        // Don't fail the order update if webhook fails
      }
    }

    return NextResponse.json({
      data: updatedOrder[0],
      message: "Order updated successfully"
    });
    
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}