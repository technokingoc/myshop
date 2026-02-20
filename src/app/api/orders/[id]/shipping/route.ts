import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { orders, deliveryStatusChanges, notifications } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { notifyOrderStatusChanged } from "@/lib/notification-service";

type ShippingUpdateData = {
  trackingNumber?: string;
  trackingProvider?: string;
  estimatedDelivery?: string;
  status?: string;
  notes?: string;
  sellerId: number;
};

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const orderId = parseInt(id);
    
    if (isNaN(orderId)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    const session = await auth();
    if (!session?.sellerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data: ShippingUpdateData = await request.json();
    const { trackingNumber, trackingProvider, estimatedDelivery, status, notes, sellerId } = data;

    if (!sellerId) {
      return NextResponse.json({ error: "Seller ID required" }, { status: 400 });
    }

    const db = getDb();

    // Verify the order belongs to the seller
    const existingOrder = await db
      .select({
        id: orders.id,
        sellerId: orders.sellerId,
        status: orders.status,
        customerName: orders.customerName,
        customerContact: orders.customerContact,
      })
      .from(orders)
      .where(and(
        eq(orders.id, orderId),
        eq(orders.sellerId, sellerId)
      ))
      .limit(1);

    if (existingOrder.length === 0) {
      return NextResponse.json({ error: "Order not found or access denied" }, { status: 404 });
    }

    const order = existingOrder[0];
    const oldStatus = order.status;

    // Build update object
    const updateData: any = {};
    
    if (trackingNumber !== undefined) {
      updateData.trackingNumber = trackingNumber;
    }
    
    if (estimatedDelivery) {
      updateData.estimatedDelivery = new Date(estimatedDelivery);
    }

    if (status && status !== oldStatus) {
      updateData.status = status;
      
      // Add to status history
      const statusHistoryEntry = {
        status,
        at: new Date().toISOString(),
        note: notes || `Tracking updated${trackingNumber ? ` - ${trackingNumber}` : ''}`
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

    if (notes) {
      // Get current notes and append
      const currentOrder = await db
        .select({ notes: orders.notes })
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);
        
      const currentNotes = currentOrder[0]?.notes || '';
      updateData.notes = currentNotes ? `${currentNotes}\n${notes}` : notes;
    }

    // Update the order
    await db
      .update(orders)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    // Log delivery status change if status changed
    if (status && status !== oldStatus) {
      try {
        await db.insert(deliveryStatusChanges).values({
          orderId,
          sellerId,
          oldStatus,
          newStatus: status,
          changedBy: (session as any).user.id,
          changeReason: notes || 'Tracking update',
          customerPhone: order.customerContact.includes('@') ? '' : order.customerContact,
          customerEmail: order.customerContact.includes('@') ? order.customerContact : '',
          customerName: order.customerName,
        });

        // Send notifications
        const statusMessages: Record<string, { en: string; pt: string }> = {
          confirmed: {
            en: `Your order has been confirmed and is being prepared.`,
            pt: `O seu pedido foi confirmado e está a ser preparado.`
          },
          preparing: {
            en: `Your order is being prepared for shipping.`,
            pt: `O seu pedido está a ser preparado para envio.`
          },
          shipped: {
            en: `Your order has been shipped${trackingNumber ? ` with tracking number ${trackingNumber}` : ''}.`,
            pt: `O seu pedido foi enviado${trackingNumber ? ` com número de rastreio ${trackingNumber}` : ''}.`
          },
          'in-transit': {
            en: `Your order is in transit and on its way to you.`,
            pt: `O seu pedido está em trânsito e a caminho.`
          },
          delivered: {
            en: `Your order has been delivered. Please confirm receipt.`,
            pt: `O seu pedido foi entregue. Por favor confirme o recebimento.`
          }
        };

        const message = statusMessages[status];
        if (message) {
          // Create in-app notification
          await db.insert(notifications).values({
            sellerId,
            type: 'order_status',
            title: `Order ${orderId} Status Update`,
            message: message.en,
            orderId,
            actionUrl: `/track/ORD-${orderId}`,
            priority: 2,
          });

          // Send notification using the notification service
          try {
            await notifyOrderStatusChanged(orderId as any, order.sellerId, order.customerId, data.status || 'shipped');
          } catch (notificationError) {
            console.warn('Failed to send notification:', notificationError);
            // Don't fail the main request if notification fails
          }
        }

      } catch (logError) {
        console.warn('Failed to log status change:', logError);
        // Don't fail the main request if logging fails
      }
    }

    return NextResponse.json({
      success: true,
      message: "Shipping information updated successfully",
      orderId,
      trackingNumber,
      status: status || oldStatus,
    });

  } catch (error) {
    console.error("Error updating shipping info:", error);
    return NextResponse.json(
      { error: "Failed to update shipping information" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const orderId = parseInt(id);
    
    if (isNaN(orderId)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    const session = await auth();
    if (!session?.sellerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();
    const url = new URL(request.url);
    const sellerId = url.searchParams.get('sellerId');

    if (!sellerId) {
      return NextResponse.json({ error: "Seller ID required" }, { status: 400 });
    }

    // Get shipping information for the order
    const result = await db
      .select({
        id: orders.id,
        status: orders.status,
        trackingNumber: orders.trackingNumber,
        estimatedDelivery: orders.estimatedDelivery,
        shippingAddress: orders.shippingAddress,
        statusHistory: orders.statusHistory,
        notes: orders.notes,
        customerName: orders.customerName,
        customerContact: orders.customerContact,
      })
      .from(orders)
      .where(and(
        eq(orders.id, orderId),
        eq(orders.sellerId, parseInt(sellerId))
      ))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json({ error: "Order not found or access denied" }, { status: 404 });
    }

    const order = result[0];

    return NextResponse.json({
      orderId: order.id,
      status: order.status,
      trackingNumber: order.trackingNumber || '',
      estimatedDelivery: order.estimatedDelivery,
      shippingAddress: order.shippingAddress,
      statusHistory: order.statusHistory || [],
      notes: order.notes || '',
      customerInfo: {
        name: order.customerName,
        contact: order.customerContact,
      }
    });

  } catch (error) {
    console.error("Error fetching shipping info:", error);
    return NextResponse.json(
      { error: "Failed to fetch shipping information" },
      { status: 500 }
    );
  }
}