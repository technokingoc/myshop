import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { orders, sellers } from "@/lib/schema";
import { eq, and, sql } from "drizzle-orm";
import { sendOrderStatusUpdate } from "@/lib/email-service";
import { emitEvent } from "@/lib/events";
import { getSessionFromCookie } from "@/lib/session";

const VALID_STATUSES = ["new", "contacted", "processing", "shipped", "completed", "cancelled"];

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
    const { status, note } = body;

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

    // Update
    const [row] = await db
      .update(orders)
      .set({
        status,
        statusHistory: newHistory,
        ...(note ? { notes: sql`CASE WHEN ${orders.notes} = '' THEN ${note} ELSE ${orders.notes} || E'\n' || ${note} END` } : {}),
      })
      .where(eq(orders.id, orderId))
      .returning();

    emitEvent({
      type: "order:status",
      sellerId: row.sellerId,
      message: `Order #${row.id} moved to ${status}`,
      payload: { orderId: row.id, status },
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
