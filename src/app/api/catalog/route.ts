import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { catalogItems, sellers } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const db = getDb();
  const sellerId = req.nextUrl.searchParams.get("sellerId");
  const sellerSlug = req.nextUrl.searchParams.get("sellerSlug");

  if (sellerSlug) {
    const [seller] = await db.select().from(sellers).where(eq(sellers.slug, sellerSlug));
    if (!seller) return NextResponse.json([]);
    const rows = await db.select().from(catalogItems).where(eq(catalogItems.sellerId, seller.id));
    return NextResponse.json(rows);
  }

  if (sellerId) {
    const rows = await db.select().from(catalogItems).where(eq(catalogItems.sellerId, Number(sellerId)));
    return NextResponse.json(rows);
  }

  return NextResponse.json({ error: "sellerId or sellerSlug required" }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const { sellerId, name, type, price, status, imageUrl, shortDescription, category } = body;

  if (!sellerId || !name) {
    return NextResponse.json({ error: "sellerId and name required" }, { status: 400 });
  }

  const [row] = await db
    .insert(catalogItems)
    .values({
      sellerId: Number(sellerId),
      name,
      type: type || "Product",
      price: String(price || "0"),
      status: status || "Draft",
      imageUrl: imageUrl || "",
      shortDescription: shortDescription || "",
      category: category || "",
    })
    .returning();

  return NextResponse.json(row, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const { id, ...updates } = body;

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  // Map camelCase fields to schema
  const setObj: Record<string, unknown> = {};
  if (updates.name !== undefined) setObj.name = updates.name;
  if (updates.type !== undefined) setObj.type = updates.type;
  if (updates.price !== undefined) setObj.price = String(updates.price);
  if (updates.status !== undefined) setObj.status = updates.status;
  if (updates.imageUrl !== undefined) setObj.imageUrl = updates.imageUrl;
  if (updates.shortDescription !== undefined) setObj.shortDescription = updates.shortDescription;
  if (updates.category !== undefined) setObj.category = updates.category;

  const [row] = await db
    .update(catalogItems)
    .set(setObj)
    .where(eq(catalogItems.id, Number(id)))
    .returning();

  return NextResponse.json(row);
}

export async function DELETE(req: NextRequest) {
  const db = getDb();
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await db.delete(catalogItems).where(eq(catalogItems.id, Number(id)));
  return NextResponse.json({ ok: true });
}
