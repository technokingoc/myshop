import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { orders, sellers } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const db = getDb();
  const sellerId = req.nextUrl.searchParams.get("sellerId");
  if (!sellerId) return NextResponse.json({ error: "sellerId required" }, { status: 400 });
  const rows = await db
    .select()
    .from(orders)
    .where(eq(orders.sellerId, Number(sellerId)))
    .orderBy(desc(orders.createdAt));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const { sellerId, sellerSlug, itemId, customerName, customerContact, message } = body;

  let resolvedSellerId = sellerId;
  if (!resolvedSellerId && sellerSlug) {
    const [seller] = await db.select().from(sellers).where(eq(sellers.slug, sellerSlug));
    if (seller) resolvedSellerId = seller.id;
  }

  if (!resolvedSellerId || !customerName || !customerContact) {
    return NextResponse.json({ error: "sellerId/sellerSlug, customerName, customerContact required" }, { status: 400 });
  }

  const [row] = await db
    .insert(orders)
    .values({
      sellerId: Number(resolvedSellerId),
      itemId: itemId ? Number(itemId) : null,
      customerName,
      customerContact,
      message: message || "",
      status: "new",
    })
    .returning();

  return NextResponse.json(row, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const { id, status } = body;
  if (!id || !status) return NextResponse.json({ error: "id and status required" }, { status: 400 });

  const [row] = await db
    .update(orders)
    .set({ status })
    .where(eq(orders.id, Number(id)))
    .returning();

  return NextResponse.json(row);
}
