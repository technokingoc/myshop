import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { catalogItems, sellers } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { checkDbReadiness, isMissingTableError } from "@/lib/db-readiness";

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
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  const readiness = await checkDbReadiness();
  if (!readiness.ok) {
    return NextResponse.json(readiness, { status: 503 });
  }

  try {
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
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest) {
  const readiness = await checkDbReadiness();
  if (!readiness.ok) {
    return NextResponse.json(readiness, { status: 503 });
  }

  try {
    const db = getDb();
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

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
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest) {
  const readiness = await checkDbReadiness();
  if (!readiness.ok) {
    return NextResponse.json(readiness, { status: 503 });
  }

  try {
    const db = getDb();
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await db.delete(catalogItems).where(eq(catalogItems.id, Number(id)));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
