import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { orders, sellers, catalogItems } from "@/lib/schema";
import { and, desc, eq, gte, ilike, lte, or } from "drizzle-orm";
import { checkDbReadiness, isMissingTableError } from "@/lib/db-readiness";
import { withRetry } from "@/lib/retry";
import { emitEvent } from "@/lib/events";
import { sendEmail } from "@/lib/email";

function isDbUnavailable(error: unknown) {
  const text = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return text.includes("connect") || text.includes("timeout") || text.includes("econn") || text.includes("database");
}

function handleApiError(error: unknown) {
  if (isMissingTableError(error)) {
    return NextResponse.json(
      { error: "Database tables are not ready", errorCode: "DB_TABLES_NOT_READY" },
      { status: 503 },
    );
  }

  if (isDbUnavailable(error)) {
    return NextResponse.json({ error: "Database is unavailable", errorCode: "DB_UNAVAILABLE" }, { status: 503 });
  }

  return NextResponse.json({ error: "Database request failed", errorCode: "REQUEST_FAILED" }, { status: 500 });
}

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const sellerId = req.nextUrl.searchParams.get("sellerId");
    const status = req.nextUrl.searchParams.get("status");
    const q = req.nextUrl.searchParams.get("q");
    const from = req.nextUrl.searchParams.get("from");
    const to = req.nextUrl.searchParams.get("to");
    if (!sellerId) return NextResponse.json({ error: "sellerId required" }, { status: 400 });

    const filters = [eq(orders.sellerId, Number(sellerId))];
    if (status && ["new", "contacted", "processing", "shipped", "completed", "cancelled"].includes(status)) filters.push(eq(orders.status, status));
    if (q) {
      filters.push(or(ilike(orders.customerName, `%${q}%`), ilike(orders.customerContact, `%${q}%`), ilike(orders.message, `%${q}%`))!);
    }
    if (from) filters.push(gte(orders.createdAt, new Date(`${from}T00:00:00`)));
    if (to) filters.push(lte(orders.createdAt, new Date(`${to}T23:59:59`)));

    const rows = await withRetry(
      () =>
        db
          .select({
            id: orders.id,
            customerName: orders.customerName,
            customerContact: orders.customerContact,
            message: orders.message,
            itemId: orders.itemId,
            status: orders.status,
            notes: orders.notes,
            statusHistory: orders.statusHistory,
            createdAt: orders.createdAt,
            itemName: catalogItems.name,
            itemType: catalogItems.type,
            itemPrice: catalogItems.price,
          })
          .from(orders)
          .leftJoin(catalogItems, eq(orders.itemId, catalogItems.id))
          .where(and(...filters))
          .orderBy(desc(orders.createdAt)),
      3,
    );

    return NextResponse.json(rows);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  const readiness = await checkDbReadiness();
  if (!readiness.ok) return NextResponse.json(readiness, { status: 503 });

  try {
    const db = getDb();
    const body = await req.json();
    const { sellerId, sellerSlug, itemId, customerName, customerContact, message } = body;

    let resolvedSellerId = sellerId;
    if (!resolvedSellerId && sellerSlug) {
      const [seller] = await withRetry(() => db.select().from(sellers).where(eq(sellers.slug, sellerSlug)), 3);
      if (seller) resolvedSellerId = seller.id;
    }

    if (!resolvedSellerId || !customerName || !customerContact) {
      return NextResponse.json({ error: "sellerId/sellerSlug, customerName, customerContact required" }, { status: 400 });
    }

    const [row] = await withRetry(
      () =>
        db
          .insert(orders)
          .values({
            sellerId: Number(resolvedSellerId),
            itemId: itemId ? Number(itemId) : null,
            customerName,
            customerContact,
            message: message || "",
            status: "new",
          })
          .returning(),
      3,
    );

    emitEvent({
      type: "order:new",
      sellerId: Number(resolvedSellerId),
      message: `New order #${row.id} from ${customerName}`,
      payload: { orderId: row.id, customerName },
    });

    await sendEmail({
      to: process.env.MYSHOP_SELLER_EMAIL || "seller@myshop.local",
      subject: `New order #${row.id}`,
      body: `Customer: ${customerName}\nContact: ${customerContact}\nMessage: ${message || "-"}`,
    });

    return NextResponse.json({ ...row, referenceToken: `ORD-${row.id}` }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest) {
  const readiness = await checkDbReadiness();
  if (!readiness.ok) return NextResponse.json(readiness, { status: 503 });

  try {
    const db = getDb();
    const body = await req.json();
    const { id, status } = body;
    if (!id || !status) return NextResponse.json({ error: "id and status required" }, { status: 400 });

    // Get existing to build history
    const [existing] = await withRetry(
      () => db.select().from(orders).where(eq(orders.id, Number(id))),
      3,
    );
    const currentHistory = (existing?.statusHistory as Array<{ status: string; at: string }>) || [];
    const newHistory = [...currentHistory, { status, at: new Date().toISOString() }];

    const [row] = await withRetry(
      () => db.update(orders).set({ status, statusHistory: newHistory }).where(eq(orders.id, Number(id))).returning(),
      3,
    );

    emitEvent({
      type: "order:status",
      sellerId: row.sellerId,
      message: `Order #${row.id} moved to ${status}`,
      payload: { orderId: row.id, status },
    });

    await sendEmail({
      to: process.env.MYSHOP_SELLER_EMAIL || "seller@myshop.local",
      subject: `Order #${row.id} status updated`,
      body: `Order #${row.id} status is now: ${status}`,
    });

    return NextResponse.json(row);
  } catch (error) {
    return handleApiError(error);
  }
}
