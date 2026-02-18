import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { comments } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const itemId = req.nextUrl.searchParams.get("itemId");
    const sellerId = req.nextUrl.searchParams.get("sellerId");

    if (itemId) {
      const rows = await db.select().from(comments).where(eq(comments.catalogItemId, Number(itemId))).orderBy(desc(comments.createdAt));
      return NextResponse.json(rows);
    }

    if (sellerId) {
      const rows = await db.select().from(comments).where(eq(comments.sellerId, Number(sellerId))).orderBy(desc(comments.createdAt));
      return NextResponse.json(rows);
    }

    return NextResponse.json({ error: "itemId or sellerId required" }, { status: 400 });
  } catch (error) {
    console.error("Comments GET error:", error);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();
    const { catalogItemId, sellerId, authorName, authorEmail, content, rating } = body;

    if (!authorName || !content) {
      return NextResponse.json({ error: "authorName and content required" }, { status: 400 });
    }
    if (!catalogItemId && !sellerId) {
      return NextResponse.json({ error: "catalogItemId or sellerId required" }, { status: 400 });
    }

    const [row] = await db.insert(comments).values({
      catalogItemId: catalogItemId ? Number(catalogItemId) : null,
      sellerId: sellerId ? Number(sellerId) : null,
      authorName,
      authorEmail: authorEmail || null,
      content,
      rating: rating ? Number(rating) : null,
    }).returning();

    return NextResponse.json(row, { status: 201 });
  } catch (error) {
    console.error("Comments POST error:", error);
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }
}
