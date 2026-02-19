import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { orders, sellers, notifications } from "@/lib/schema";
import { eq, and, sql } from "drizzle-orm";
import { sendOrderStatusUpdate } from "@/lib/email-service";
import { emitEvent } from "@/lib/events";
import { getSessionFromCookie } from "@/lib/session";

const VALID_STATUSES = ["placed", "confirmed", "processing", "shipped", "delivered", "cancelled"];

const statusLabels: Record<string, { en: string; pt: string }> = {
  new: { en: "Order Received", pt: "Pedido Recebido" },
  contacted: { en: "Seller Contacted", pt: "Vendedor Contactou" },
  processing: { en: "Processing", pt: "Em Processamento" },
  shipped: { en: "Shipped", pt: "Enviado" },
  completed: { en: "Completed", pt: "Concluído" },
  cancelled: { en: "Cancelled", pt: "Cancelado" },
};

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const orderId = Number(id);
  if (!orderId) return NextResponse.json({ error: "Invalid order id" }, { status: 400 });

  try {
    const session = await getSessionFromCookie();
    const sellerId = session?.sellerId;

    const db = getDb();
    const body = await req.json();
    const { status, note, cancelReason, refundReason, refundAmount } = body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Build filter — if seller auth available, scope to their orders
    const filters = [eq(orders.id, orderId)];
    if (sellerId) filters.push(eq(orders.sellerId, Number(sellerId)));

    // Get current order
    const [existing] = await db.select().from(orders).where(and(...filters));
    if (!existing) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    // Build status history entry
    const historyEntry = { status, at: new Date().toISOString(), note: note || undefined };
    const currentHistory = (existing.statusHistory as Array<{ status: string; at: string; note?: string }>) || [];
    const newHistory = [...currentHistory, historyEntry];

    // Prepare update data
    const updateData: any = {
      status,
      statusHistory: newHistory,
    };

    if (note) {
      updateData.notes = sql`CASE WHEN ${orders.notes} = '' THEN ${note} ELSE ${orders.notes} || E'\n' || ${note} END`;
    }

    if (status === "cancelled" && cancelReason) {
      updateData.cancelReason = cancelReason;
    }

    if (refundReason) {
      updateData.refundReason = refundReason;
      if (refundAmount !== undefined) {
        updateData.refundAmount = refundAmount;
      }
    }

    // Update
    const [row] = await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, orderId))
      .returning();

    // Create in-app notification
    if (sellerId) {
      try {
        await db.insert(notifications).values({
          sellerId: Number(sellerId),
          customerId: row.customerId,
          type: "order_status",
          title: `Order #${row.id} ${statusLabels[status]?.en || status}`,
          message: note || `Order status updated to ${statusLabels[status]?.en || status}`,
          orderId: row.id,
          metadata: { 
            previousStatus: existing.status,
            newStatus: status,
            ...(cancelReason && { cancelReason }),
            ...(refundReason && { refundReason, refundAmount }),
          },
        });
      } catch (notifError) {
        console.error("Failed to create notification:", notifError);
      }
    }

    emitEvent({
      type: "order:status",
      sellerId: row.sellerId,
      message: `Order #${row.id} moved to ${status}`,
      payload: { orderId: row.id, status, cancelReason, refundReason, refundAmount },
    });

    // Send email if customer contact looks like email
    const contact = row.customerContact;
    if (contact && contact.includes("@")) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin;
      const trackUrl = `${baseUrl}/track/ORD-${row.id}`;
      await sendOrderStatusUpdate(contact, `ORD-${row.id}`, status, "en", trackUrl);
    }

    return NextResponse.json(row);
  } catch (error) {
    console.error("Order status update error:", error);
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}
