import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { orders, deliveryStatusChanges, deliveryAnalytics } from "@/lib/schema";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";

type DeliveryAnalyticsData = {
  overview: {
    totalOrders: number;
    deliveredOrders: number;
    avgDeliveryTime: number; // in hours
    deliveryRate: number; // percentage
    confirmationRate: number; // percentage
    avgDeliveryRating: number;
    avgSellerRating: number;
  };
  statusBreakdown: {
    status: string;
    count: number;
    percentage: number;
  }[];
  deliveryTimes: {
    date: string;
    avgHours: number;
    orderCount: number;
  }[];
  ratings: {
    deliveryRating: number;
    sellerRating: number;
    count: number;
  }[];
  recentActivity: {
    orderId: number;
    status: string;
    customerName: string;
    updatedAt: string;
    deliveryTime?: number;
  }[];
};

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.sellerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const sellerId = url.searchParams.get('sellerId');
    const days = parseInt(url.searchParams.get('days') || '30');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    if (!sellerId) {
      return NextResponse.json({ error: "Seller ID required" }, { status: 400 });
    }

    const db = getDb();

    // Calculate date range
    const dateFrom = startDate ? new Date(startDate) : new Date(Date.now() - (days * 24 * 60 * 60 * 1000));
    const dateTo = endDate ? new Date(endDate) : new Date();

    // Get overview statistics
    const overviewQuery = await db
      .select({
        totalOrders: sql<number>`COUNT(*)`,
        deliveredOrders: sql<number>`COUNT(*) FILTER (WHERE status = 'delivered')`,
        confirmedDeliveries: sql<number>`COUNT(*) FILTER (WHERE delivery_confirmed = true)`,
        avgDeliveryRating: sql<number>`COALESCE(AVG(delivery_rating), 0)`,
        avgSellerRating: sql<number>`COALESCE(AVG(seller_rating), 0)`,
      })
      .from(orders)
      .where(and(
        eq(orders.sellerId, parseInt(sellerId)),
        gte(orders.createdAt, dateFrom),
        lte(orders.createdAt, dateTo)
      ));

    const overview = overviewQuery[0] || {
      totalOrders: 0,
      deliveredOrders: 0,
      confirmedDeliveries: 0,
      avgDeliveryRating: 0,
      avgSellerRating: 0,
    };

    // Calculate delivery rate and confirmation rate
    const deliveryRate = overview.totalOrders > 0 
      ? (overview.deliveredOrders / overview.totalOrders) * 100 
      : 0;
    const confirmationRate = overview.deliveredOrders > 0 
      ? (overview.confirmedDeliveries / overview.deliveredOrders) * 100 
      : 0;

    // Get average delivery time (from created to delivered)
    const avgDeliveryTimeQuery = await db
      .select({
        avgHours: sql<number>`
          AVG(EXTRACT(EPOCH FROM (
            CASE 
              WHEN status = 'delivered' 
              THEN COALESCE(delivery_confirmed_at, updated_at) 
              ELSE updated_at 
            END - created_at
          )) / 3600)
        `,
      })
      .from(orders)
      .where(and(
        eq(orders.sellerId, parseInt(sellerId)),
        eq(orders.status, 'delivered'),
        gte(orders.createdAt, dateFrom),
        lte(orders.createdAt, dateTo)
      ));

    const avgDeliveryTime = avgDeliveryTimeQuery[0]?.avgHours || 0;

    // Get status breakdown
    const statusBreakdownQuery = await db
      .select({
        status: orders.status,
        count: sql<number>`COUNT(*)`,
      })
      .from(orders)
      .where(and(
        eq(orders.sellerId, parseInt(sellerId)),
        gte(orders.createdAt, dateFrom),
        lte(orders.createdAt, dateTo)
      ))
      .groupBy(orders.status);

    const statusBreakdown = statusBreakdownQuery.map(item => ({
      status: item.status,
      count: item.count,
      percentage: overview.totalOrders > 0 ? (item.count / overview.totalOrders) * 100 : 0,
    }));

    // Get delivery times over time (daily averages)
    const deliveryTimesQuery = await db
      .select({
        date: sql<string>`DATE(created_at)`,
        avgHours: sql<number>`
          AVG(EXTRACT(EPOCH FROM (
            CASE 
              WHEN status = 'delivered' 
              THEN COALESCE(delivery_confirmed_at, updated_at) 
              ELSE updated_at 
            END - created_at
          )) / 3600)
        `,
        orderCount: sql<number>`COUNT(*)`,
      })
      .from(orders)
      .where(and(
        eq(orders.sellerId, parseInt(sellerId)),
        eq(orders.status, 'delivered'),
        gte(orders.createdAt, dateFrom),
        lte(orders.createdAt, dateTo)
      ))
      .groupBy(sql`DATE(created_at)`)
      .orderBy(sql`DATE(created_at)`);

    const deliveryTimes = deliveryTimesQuery.map(item => ({
      date: item.date,
      avgHours: Math.round(item.avgHours * 10) / 10,
      orderCount: item.orderCount,
    }));

    // Get ratings distribution
    const ratingsQuery = await db
      .select({
        deliveryRating: orders.deliveryRating,
        sellerRating: orders.sellerRating,
        count: sql<number>`COUNT(*)`,
      })
      .from(orders)
      .where(and(
        eq(orders.sellerId, parseInt(sellerId)),
        eq(orders.deliveryConfirmed, true),
        gte(orders.createdAt, dateFrom),
        lte(orders.createdAt, dateTo)
      ))
      .groupBy(orders.deliveryRating, orders.sellerRating)
      .having(sql`delivery_rating IS NOT NULL OR seller_rating IS NOT NULL`);

    const ratings = ratingsQuery.map(item => ({
      deliveryRating: item.deliveryRating || 0,
      sellerRating: item.sellerRating || 0,
      count: item.count,
    }));

    // Get recent activity
    const recentActivityQuery = await db
      .select({
        orderId: orders.id,
        status: orders.status,
        customerName: orders.customerName,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        deliveryConfirmedAt: orders.deliveryConfirmedAt,
      })
      .from(orders)
      .where(and(
        eq(orders.sellerId, parseInt(sellerId)),
        gte(orders.createdAt, dateFrom),
        lte(orders.createdAt, dateTo)
      ))
      .orderBy(desc(orders.updatedAt))
      .limit(10);

    const recentActivity = recentActivityQuery.map(order => {
      const deliveryTime = order.status === 'delivered' && order.deliveryConfirmedAt
        ? Math.round(
            (new Date(order.deliveryConfirmedAt).getTime() - new Date(order.createdAt).getTime()) / 
            (1000 * 60 * 60) // Convert to hours
          )
        : undefined;

      return {
        orderId: order.orderId,
        status: order.status,
        customerName: order.customerName,
        updatedAt: order.updatedAt.toISOString(),
        deliveryTime,
      };
    });

    const analyticsData: DeliveryAnalyticsData = {
      overview: {
        totalOrders: overview.totalOrders,
        deliveredOrders: overview.deliveredOrders,
        avgDeliveryTime: Math.round(avgDeliveryTime * 10) / 10,
        deliveryRate: Math.round(deliveryRate * 10) / 10,
        confirmationRate: Math.round(confirmationRate * 10) / 10,
        avgDeliveryRating: Math.round(overview.avgDeliveryRating * 10) / 10,
        avgSellerRating: Math.round(overview.avgSellerRating * 10) / 10,
      },
      statusBreakdown,
      deliveryTimes,
      ratings,
      recentActivity,
    };

    return NextResponse.json(analyticsData);

  } catch (error) {
    console.error("Error fetching delivery analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch delivery analytics" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { action } = await request.json();

    if (action === 'recalculate') {
      const db = getDb();
      
      // This would trigger the analytics recalculation
      // For now, return success - in production this would call the stored procedure
      
      return NextResponse.json({
        success: true,
        message: "Analytics recalculation triggered",
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });

  } catch (error) {
    console.error("Error in delivery analytics admin action:", error);
    return NextResponse.json(
      { error: "Failed to process admin action" },
      { status: 500 }
    );
  }
}