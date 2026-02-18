import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getDb } from "@/lib/db";
import { sellers, catalogItems, orders, comments } from "@/lib/schema";
import { sql, count } from "drizzle-orm";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const db = getDb();

  const [sellerCount] = await db.select({ count: count() }).from(sellers);
  const [productCount] = await db.select({ count: count() }).from(catalogItems);
  const [orderCount] = await db.select({ count: count() }).from(orders);
  const [commentCount] = await db.select({ count: count() }).from(comments);
  const [revenueResult] = await db.select({
    total: sql<string>`COALESCE(SUM(ci.price), 0)`,
  }).from(orders)
    .innerJoin(catalogItems, sql`${orders.itemId} = ${catalogItems.id}`);

  // Recent orders
  const recentOrders = await db
    .select({
      id: orders.id,
      customerName: orders.customerName,
      status: orders.status,
      createdAt: orders.createdAt,
      sellerName: sellers.name,
      itemName: catalogItems.name,
      itemPrice: catalogItems.price,
    })
    .from(orders)
    .leftJoin(sellers, sql`${orders.sellerId} = ${sellers.id}`)
    .leftJoin(catalogItems, sql`${orders.itemId} = ${catalogItems.id}`)
    .orderBy(sql`${orders.createdAt} DESC`)
    .limit(10);

  // Sellers over time (monthly)
  const growth = await db.select({
    month: sql<string>`TO_CHAR(${sellers.createdAt}, 'YYYY-MM')`,
    count: count(),
  }).from(sellers)
    .groupBy(sql`TO_CHAR(${sellers.createdAt}, 'YYYY-MM')`)
    .orderBy(sql`TO_CHAR(${sellers.createdAt}, 'YYYY-MM')`);

  return NextResponse.json({
    stats: {
      sellers: sellerCount.count,
      products: productCount.count,
      orders: orderCount.count,
      reviews: commentCount.count,
      revenue: revenueResult?.total ?? "0",
    },
    recentOrders,
    growth,
  });
}
