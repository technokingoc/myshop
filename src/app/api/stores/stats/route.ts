import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { sellers, catalogItems, orders } from "@/lib/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    const db = getDb();

    const [[sellerCount], [productCount], [orderCount]] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(sellers).where(sql`${sellers.role} != 'admin'`),
      db.select({ count: sql<number>`count(*)` }).from(catalogItems),
      db.select({ count: sql<number>`count(*)` }).from(orders),
    ]);

    return NextResponse.json({
      sellers: Number(sellerCount.count),
      products: Number(productCount.count),
      orders: Number(orderCount.count),
    });
  } catch (error) {
    console.error("Stats API error:", error);
    return NextResponse.json({ sellers: 0, products: 0, orders: 0 });
  }
}
