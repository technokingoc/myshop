import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getDb } from "@/lib/db";
import { sellers, stores, users, catalogItems, orders, comments } from "@/lib/schema";
import { sql, count, sum, avg, desc, gte, lt, eq, and } from "drizzle-orm";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const db = getDb();

  try {
    // Calculate current and previous month dates
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // Overview Stats
    const [sellerCount] = await db.select({ count: count() }).from(sellers);
    const [storeCount] = await db.select({ count: count() }).from(stores);
    const [userCount] = await db.select({ count: count() }).from(users);
    const [productCount] = await db.select({ count: count() }).from(catalogItems);
    const [orderCount] = await db.select({ count: count() }).from(orders);
    const [commentCount] = await db.select({ count: count() }).from(comments);

    // Total revenue calculation
    const [revenueResult] = await db.select({
      total: sql<string>`COALESCE(SUM(CAST(ci.price AS NUMERIC)), 0)`,
    }).from(orders)
      .leftJoin(catalogItems, eq(orders.itemId, catalogItems.id))
      .where(eq(orders.status, 'completed'));

    // Current month stats
    const [currentMonthRevenue] = await db.select({
      total: sql<string>`COALESCE(SUM(CAST(ci.price AS NUMERIC)), 0)`,
    }).from(orders)
      .leftJoin(catalogItems, eq(orders.itemId, catalogItems.id))
      .where(
        and(
          eq(orders.status, 'completed'),
          gte(orders.createdAt, currentMonthStart)
        )
      );

    const [currentMonthUsers] = await db.select({ count: count() })
      .from(users)
      .where(gte(users.createdAt, currentMonthStart));

    const [currentMonthStores] = await db.select({ count: count() })
      .from(stores)
      .where(gte(stores.createdAt, currentMonthStart));

    const [currentMonthOrders] = await db.select({ count: count() })
      .from(orders)
      .where(gte(orders.createdAt, currentMonthStart));

    // Previous month stats
    const [previousMonthRevenue] = await db.select({
      total: sql<string>`COALESCE(SUM(CAST(ci.price AS NUMERIC)), 0)`,
    }).from(orders)
      .leftJoin(catalogItems, eq(orders.itemId, catalogItems.id))
      .where(
        and(
          eq(orders.status, 'completed'),
          gte(orders.createdAt, previousMonthStart),
          lt(orders.createdAt, currentMonthStart)
        )
      );

    const [previousMonthUsers] = await db.select({ count: count() })
      .from(users)
      .where(
        and(
          gte(users.createdAt, previousMonthStart),
          lt(users.createdAt, currentMonthStart)
        )
      );

    const [previousMonthStores] = await db.select({ count: count() })
      .from(stores)
      .where(
        and(
          gte(stores.createdAt, previousMonthStart),
          lt(stores.createdAt, currentMonthStart)
        )
      );

    const [previousMonthOrders] = await db.select({ count: count() })
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, previousMonthStart),
          lt(orders.createdAt, currentMonthStart)
        )
      );

    // Average order value
    const [avgOrderValueResult] = await db.select({
      avg: sql<string>`COALESCE(AVG(CAST(ci.price AS NUMERIC)), 0)`,
    }).from(orders)
      .leftJoin(catalogItems, eq(orders.itemId, catalogItems.id))
      .where(eq(orders.status, 'completed'));

    // Monthly revenue trend (last 12 months)
    const monthlyRevenue = await db.select({
      month: sql<string>`TO_CHAR(${orders.createdAt}, 'YYYY-MM')`,
      revenue: sql<number>`COALESCE(SUM(CAST(ci.price AS NUMERIC)), 0)`,
    })
      .from(orders)
      .leftJoin(catalogItems, eq(orders.itemId, catalogItems.id))
      .where(
        and(
          eq(orders.status, 'completed'),
          gte(orders.createdAt, new Date(now.getFullYear() - 1, now.getMonth(), 1))
        )
      )
      .groupBy(sql`TO_CHAR(${orders.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${orders.createdAt}, 'YYYY-MM')`);

    // Top performing stores
    const topStores = await db.select({
      id: sellers.id,
      name: sellers.name,
      slug: sellers.slug,
      orders: sql<number>`COUNT(${orders.id})`,
      revenue: sql<number>`COALESCE(SUM(CAST(ci.price AS NUMERIC)), 0)`,
    })
      .from(sellers)
      .leftJoin(orders, eq(sellers.id, orders.sellerId))
      .leftJoin(catalogItems, eq(orders.itemId, catalogItems.id))
      .where(eq(orders.status, 'completed'))
      .groupBy(sellers.id, sellers.name, sellers.slug)
      .orderBy(desc(sql`COALESCE(SUM(CAST(ci.price AS NUMERIC)), 0)`))
      .limit(10);

    // Also check new stores table for top stores
    const topNewStores = await db.select({
      id: stores.id,
      name: stores.name,
      slug: stores.slug,
      orders: sql<number>`COUNT(${orders.id})`,
      revenue: sql<number>`COALESCE(SUM(CAST(ci.price AS NUMERIC)), 0)`,
    })
      .from(stores)
      .leftJoin(orders, eq(stores.userId, orders.sellerId)) // Assuming orders still reference old seller system
      .leftJoin(catalogItems, eq(orders.itemId, catalogItems.id))
      .where(eq(orders.status, 'completed'))
      .groupBy(stores.id, stores.name, stores.slug)
      .orderBy(desc(sql`COALESCE(SUM(CAST(ci.price AS NUMERIC)), 0)`))
      .limit(10);

    // Combine and sort top stores
    const combinedTopStores = [...topStores, ...topNewStores]
      .sort((a, b) => Number(b.revenue) - Number(a.revenue))
      .slice(0, 10);

    // Calculate order conversion (orders vs product views - approximated as orders vs products)
    const totalProducts = productCount.count;
    const totalOrdersCount = orderCount.count;
    const orderConversion = totalProducts > 0 ? (totalOrdersCount / totalProducts) * 100 : 0;

    return NextResponse.json({
      overview: {
        totalRevenue: parseFloat(revenueResult?.total || "0"),
        totalUsers: userCount.count + sellerCount.count, // Combine legacy sellers with new users
        totalStores: storeCount.count + sellerCount.count,
        totalOrders: orderCount.count,
        totalProducts: productCount.count,
        totalReviews: commentCount.count,
        currency: "USD", // Default currency - could be made configurable
      },
      monthly: {
        currentMonth: {
          revenue: parseFloat(currentMonthRevenue?.total || "0"),
          users: currentMonthUsers.count,
          stores: currentMonthStores.count,
          orders: currentMonthOrders.count,
        },
        previousMonth: {
          revenue: parseFloat(previousMonthRevenue?.total || "0"),
          users: previousMonthUsers.count,
          stores: previousMonthStores.count,
          orders: previousMonthOrders.count,
        },
        avgOrderValue: parseFloat(avgOrderValueResult?.avg || "0"),
        orderConversion: Math.round(orderConversion * 10) / 10,
      },
      topStores: combinedTopStores.map(store => ({
        id: store.id,
        name: store.name,
        slug: store.slug,
        orders: Number(store.orders),
        revenue: Number(store.revenue),
      })),
      monthlyRevenue: monthlyRevenue.map(item => ({
        month: item.month,
        revenue: Number(item.revenue),
      })),
    });

  } catch (error) {
    console.error("Analytics API error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}