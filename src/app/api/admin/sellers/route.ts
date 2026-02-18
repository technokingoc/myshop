import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getDb } from "@/lib/db";
import { sellers, catalogItems, orders } from "@/lib/schema";
import { sql, count, eq } from "drizzle-orm";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const db = getDb();

  const result = await db
    .select({
      id: sellers.id,
      name: sellers.name,
      email: sellers.email,
      slug: sellers.slug,
      role: sellers.role,
      createdAt: sellers.createdAt,
      productCount: sql<number>`(SELECT COUNT(*) FROM catalog_items WHERE seller_id = ${sellers.id})`,
      orderCount: sql<number>`(SELECT COUNT(*) FROM orders WHERE seller_id = ${sellers.id})`,
    })
    .from(sellers)
    .orderBy(sql`${sellers.createdAt} DESC`);

  return NextResponse.json({ sellers: result });
}
