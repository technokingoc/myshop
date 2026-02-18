import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getDb } from "@/lib/db";
import { catalogItems, sellers } from "@/lib/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const db = getDb();

  const result = await db
    .select({
      id: catalogItems.id,
      name: catalogItems.name,
      type: catalogItems.type,
      price: catalogItems.price,
      status: catalogItems.status,
      category: catalogItems.category,
      imageUrl: catalogItems.imageUrl,
      createdAt: catalogItems.createdAt,
      sellerId: catalogItems.sellerId,
      sellerName: sellers.name,
      sellerSlug: sellers.slug,
    })
    .from(catalogItems)
    .leftJoin(sellers, sql`${catalogItems.sellerId} = ${sellers.id}`)
    .orderBy(sql`${catalogItems.createdAt} DESC`);

  return NextResponse.json({ products: result });
}
