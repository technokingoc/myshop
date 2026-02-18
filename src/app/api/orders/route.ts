import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { orders, sellers } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { checkDbReadiness, isMissingTableError } from "@/lib/db-readiness";
import { withRetry } from "@/lib/retry";

function handleApiError(error: unknown) {
  if (isMissingTableError(error)) {
    return NextResponse.json(
      { error: "Database tables are not ready", errorCode: "DB_TABLES_NOT_READY" },
      { status: 503 },
    );
  }

  return NextResponse.json({ error: "Database request failed" }, { status: 500 });
}

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const sellerId = req.nextUrl.searchParams.get("sellerId");
    if (!sellerId) return NextResponse.json({ error: "sellerId required" }, { status: 400 });

    const rows = await withRetry(
      () => db.select().from(orders).where(eq(orders.sellerId, Number(sellerId))).orderBy(desc(orders.createdAt)),
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

    return NextResponse.json(row, { status: 201 });
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

    const [row] = await withRetry(
      () => db.update(orders).set({ status }).where(eq(orders.id, Number(id))).returning(),
      3,
    );

    return NextResponse.json(row);
  } catch (error) {
    return handleApiError(error);
  }
}
