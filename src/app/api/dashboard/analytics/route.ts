import { NextRequest, NextResponse } from "next/server";
import { getSessionFromCookie } from "@/lib/session";
import { getDb } from "@/lib/db";
import { orders, catalogItems } from "@/lib/schema";
import { eq, sql, and, gte, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await getSessionFromCookie();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const period = req.nextUrl.searchParams.get("period") || "30d";
  const sellerId = session.sellerId;

  try {
    const db = getDb();

    // Calculate date range
    let daysBack = 30;
    if (period === "7d") daysBack = 7;
    else if (period === "90d") daysBack = 90;
    else if (period === "all") daysBack = 3650;

    const since = new Date();
    since.setDate(since.getDate() - daysBack);

    const prevSince = new Date();
    prevSince.setDate(prevSince.getDate() - daysBack * 2);

    // Current period metrics
    const [currentMetrics] = await db
      .select({
        orderCount: sql<number>`count(*)`,
        revenue: sql<string>`coalesce(sum(${catalogItems.price}), 0)`,
      })
      .from(orders)
      .leftJoin(catalogItems, eq(orders.itemId, catalogItems.id))
      .where(and(eq(orders.sellerId, sellerId), gte(orders.createdAt, since)));

    // Previous period metrics (for trend)
    const [prevMetrics] = await db
      .select({
        orderCount: sql<number>`count(*)`,
        revenue: sql<string>`coalesce(sum(${catalogItems.price}), 0)`,
      })
      .from(orders)
      .leftJoin(catalogItems, eq(orders.itemId, catalogItems.id))
      .where(
        and(
          eq(orders.sellerId, sellerId),
          gte(orders.createdAt, prevSince),
          sql`${orders.createdAt} < ${since}`,
        ),
      );

    // Daily order counts
    const dailyOrders = await db
      .select({
        date: sql<string>`to_char(${orders.createdAt}, 'YYYY-MM-DD')`,
        count: sql<number>`count(*)`,
        revenue: sql<string>`coalesce(sum(${catalogItems.price}), 0)`,
      })
      .from(orders)
      .leftJoin(catalogItems, eq(orders.itemId, catalogItems.id))
      .where(and(eq(orders.sellerId, sellerId), gte(orders.createdAt, since)))
      .groupBy(sql`to_char(${orders.createdAt}, 'YYYY-MM-DD')`)
      .orderBy(sql`to_char(${orders.createdAt}, 'YYYY-MM-DD')`);

    // Top products
    const topProducts = await db
      .select({
        itemId: orders.itemId,
        name: catalogItems.name,
        price: catalogItems.price,
        orderCount: sql<number>`count(*)`,
        revenue: sql<string>`coalesce(sum(${catalogItems.price}), 0)`,
      })
      .from(orders)
      .leftJoin(catalogItems, eq(orders.itemId, catalogItems.id))
      .where(and(eq(orders.sellerId, sellerId), gte(orders.createdAt, since)))
      .groupBy(orders.itemId, catalogItems.name, catalogItems.price)
      .orderBy(sql`count(*) DESC`)
      .limit(5);

    // Customer breakdown: repeat vs new
    const customerBreakdown = await db
      .select({
        contact: orders.customerContact,
        orderCount: sql<number>`count(*)`,
      })
      .from(orders)
      .where(and(eq(orders.sellerId, sellerId), gte(orders.createdAt, since)))
      .groupBy(orders.customerContact);

    const totalCustomers = customerBreakdown.length;
    const repeatCustomers = customerBreakdown.filter((c) => Number(c.orderCount) > 1).length;
    const newCustomers = totalCustomers - repeatCustomers;

    // Revenue by status
    const revenueByStatus = await db
      .select({
        status: orders.status,
        count: sql<number>`count(*)`,
        revenue: sql<string>`coalesce(sum(${catalogItems.price}), 0)`,
      })
      .from(orders)
      .leftJoin(catalogItems, eq(orders.itemId, catalogItems.id))
      .where(and(eq(orders.sellerId, sellerId), gte(orders.createdAt, since)))
      .groupBy(orders.status);

    const curOrders = Number(currentMetrics?.orderCount ?? 0);
    const prevOrders = Number(prevMetrics?.orderCount ?? 0);
    const curRevenue = parseFloat(String(currentMetrics?.revenue ?? "0"));
    const prevRevenue = parseFloat(String(prevMetrics?.revenue ?? "0"));

    const orderTrend = prevOrders > 0 ? Math.round(((curOrders - prevOrders) / prevOrders) * 100) : curOrders > 0 ? 100 : 0;
    const revenueTrend = prevRevenue > 0 ? Math.round(((curRevenue - prevRevenue) / prevRevenue) * 100) : curRevenue > 0 ? 100 : 0;
    const avgOrderValue = curOrders > 0 ? curRevenue / curOrders : 0;

    return NextResponse.json({
      period,
      metrics: {
        orders: curOrders,
        orderTrend,
        revenue: curRevenue,
        revenueTrend,
        avgOrderValue: Math.round(avgOrderValue * 100) / 100,
        storeViews: 0, // placeholder
        conversionRate: 0, // placeholder
      },
      dailyOrders: dailyOrders.map((d) => ({
        date: d.date,
        count: Number(d.count),
        revenue: parseFloat(String(d.revenue)),
      })),
      topProducts: topProducts.map((p) => ({
        itemId: p.itemId,
        name: p.name || "Unknown",
        price: p.price,
        orderCount: Number(p.orderCount),
        revenue: parseFloat(String(p.revenue)),
      })),
      customers: { total: totalCustomers, new: newCustomers, repeat: repeatCustomers },
      revenueByStatus: revenueByStatus.map((r) => ({
        status: r.status,
        count: Number(r.count),
        revenue: parseFloat(String(r.revenue)),
      })),
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
