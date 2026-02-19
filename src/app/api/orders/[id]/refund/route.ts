import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { orders } from "@/lib/schema";
import { eq, and, sql } from "drizzle-orm";
import { sendOrderStatusUpdate } from "@/lib/email-service";
import { emitEvent } from "@/lib/events";
import { getSessionFromCookie } from "@/lib/session";

export async function POST(
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
    const { amount, reason, note, type = "refund" } = body;

    if (!amount && type === "refund") {
      return NextResponse.json({ error: "Refund amount is required" }, { status: 400 });
    }

    if (!note) {
      return NextResponse.json({ error: "Note is required" }, { status: 400 });
    }

    // Build filter — if seller auth available, scope to their orders
    const filters = [eq(orders.id, orderId)];
    if (sellerId) filters.push(eq(orders.sellerId, Number(sellerId)));

    // Get current order
    const [existing] = await db.select().from(orders).where(and(...filters));
    if (!existing) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    // Prevent refunding already cancelled/refunded orders
    if (existing.status === "cancelled") {
      return NextResponse.json({ error: "Cannot refund cancelled order" }, { status: 400 });
    }

    // Build status history entry
    const historyEntry = { 
      status: type === "refund" ? "refunded" : "cancelled", 
      at: new Date().toISOString(), 
      note: type === "refund" ? `Refunded ${amount}. Reason: ${reason}. ${note}` : `Cancelled. Reason: ${reason}. ${note}`
    };
    const currentHistory = (existing.statusHistory as Array<{ status: string; at: string; note?: string }>) || [];
    const newHistory = [...currentHistory, historyEntry];

    // Update order
    const [row] = await db
      .update(orders)
      .set({
        status: "cancelled", // Both refund and cancel set status to cancelled
        statusHistory: newHistory,
        notes: sql`CASE WHEN ${orders.notes} = '' THEN ${historyEntry.note} ELSE ${orders.notes} || E'\n' || ${historyEntry.note} END`,
      })
      .where(eq(orders.id, orderId))
      .returning();

    // Emit event
    emitEvent({
      type: type === "refund" ? "order:refunded" : "order:cancelled",
      sellerId: row.sellerId,
      message: `Order #${row.id} ${type === "refund" ? "refunded" : "cancelled"}`,
      payload: { 
        orderId: row.id, 
        type, 
        ...(type === "refund" && { amount, reason })
      },
    });

    // Send email notification if customer contact looks like email
    const contact = row.customerContact;
    if (contact && contact.includes("@")) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin;
      const trackUrl = `${baseUrl}/track/ORD-${row.id}`;
      await sendOrderStatusUpdate(contact, `ORD-${row.id}`, "cancelled", "en", trackUrl);
    }

    return NextResponse.json({
      ...row,
      refund: type === "refund" ? { amount, reason, processedAt: new Date().toISOString() } : null
    });
  } catch (error) {
    console.error("Order refund/cancel error:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}