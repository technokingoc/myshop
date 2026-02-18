import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getDb } from "@/lib/db";
import { comments, catalogItems, sellers } from "@/lib/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const db = getDb();

  const result = await db
    .select({
      id: comments.id,
      authorName: comments.authorName,
      authorEmail: comments.authorEmail,
      content: comments.content,
      rating: comments.rating,
      createdAt: comments.createdAt,
      catalogItemId: comments.catalogItemId,
      sellerId: comments.sellerId,
      itemName: catalogItems.name,
      sellerName: sellers.name,
    })
    .from(comments)
    .leftJoin(catalogItems, sql`${comments.catalogItemId} = ${catalogItems.id}`)
    .leftJoin(sellers, sql`${comments.sellerId} = ${sellers.id}`)
    .orderBy(sql`${comments.createdAt} DESC`);

  return NextResponse.json({ reviews: result });
}
