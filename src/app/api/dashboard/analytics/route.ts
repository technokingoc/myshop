import { NextRequest, NextResponse } from "next/server";
import { getSessionFromCookie } from "@/lib/session";
import { getDb } from "@/lib/db";
import { orders, catalogItems, users, customers } from "@/lib/schema";
import { eq, sql, and, gte, desc, lt } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await getSessionFromCookie();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const period = req.nextUrl.searchParams.get("period") || "30d";
  const groupBy = req.nextUrl.searchParams.get("groupBy") || "day"; // day, week, month
  const export_ = req.nextUrl.searchParams.get("export") === "true";
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
        uniqueCustomers: sql<number>`count(distinct ${orders.customerContact})`,
      })
      .from(orders)
      .leftJoin(catalogItems, eq(orders.itemId, catalogItems.id))
      .where(and(eq(orders.sellerId, sellerId), gte(orders.createdAt, since)));

    // Previous period metrics (for trend)
    const [prevMetrics] = await db
      .select({
        orderCount: sql<number>`count(*)`,
        revenue: sql<string>`coalesce(sum(${catalogItems.price}), 0)`,
        uniqueCustomers: sql<number>`count(distinct ${orders.customerContact})`,
      })
      .from(orders)
      .leftJoin(catalogItems, eq(orders.itemId, catalogItems.id))
      .where(
        and(
          eq(orders.sellerId, sellerId),
          gte(orders.createdAt, prevSince),
          lt(orders.createdAt, since),
        ),
      );

    // Time-series data based on groupBy parameter
    let dateFormat = 'YYYY-MM-DD';
    let orderByFormat = 'YYYY-MM-DD';
    if (groupBy === 'week') {
      dateFormat = 'YYYY-"W"WW';
      orderByFormat = 'YYYY-WW';
    } else if (groupBy === 'month') {
      dateFormat = 'YYYY-MM';
      orderByFormat = 'YYYY-MM';
    }

    const timeSeriesData = await db
      .select({
        date: sql<string>`to_char(${orders.createdAt}, '${sql.raw(dateFormat)}')`,
        count: sql<number>`count(*)`,
        revenue: sql<string>`coalesce(sum(${catalogItems.price}), 0)`,
        uniqueCustomers: sql<number>`count(distinct ${orders.customerContact})`,
      })
      .from(orders)
      .leftJoin(catalogItems, eq(orders.itemId, catalogItems.id))
      .where(and(eq(orders.sellerId, sellerId), gte(orders.createdAt, since)))
      .groupBy(sql`to_char(${orders.createdAt}, '${sql.raw(dateFormat)}')`)
      .orderBy(sql`to_char(${orders.createdAt}, '${sql.raw(orderByFormat)}')`);

    // Enhanced top products with more metrics
    const topProducts = await db
      .select({
        itemId: orders.itemId,
        name: catalogItems.name,
        price: catalogItems.price,
        orderCount: sql<number>`count(*)`,
        revenue: sql<string>`coalesce(sum(${catalogItems.price}), 0)`,
        uniqueCustomers: sql<number>`count(distinct ${orders.customerContact})`,
        avgOrderValue: sql<string>`coalesce(avg(${catalogItems.price}), 0)`,
      })
      .from(orders)
      .leftJoin(catalogItems, eq(orders.itemId, catalogItems.id))
      .where(and(eq(orders.sellerId, sellerId), gte(orders.createdAt, since)))
      .groupBy(orders.itemId, catalogItems.name, catalogItems.price)
      .orderBy(desc(sql`count(*)`))
      .limit(10);

    // Enhanced customer demographics with city/country data
    const customerDemographics = await db
      .select({
        city: orders.customerContact,
        orderCount: sql<number>`count(*)`,
        revenue: sql<string>`coalesce(sum(${catalogItems.price}), 0)`,
        firstOrder: sql<string>`min(${orders.createdAt})`,
        lastOrder: sql<string>`max(${orders.createdAt})`,
      })
      .from(orders)
      .leftJoin(catalogItems, eq(orders.itemId, catalogItems.id))
      .where(and(eq(orders.sellerId, sellerId), gte(orders.createdAt, since)))
      .groupBy(orders.customerContact)
      .orderBy(desc(sql`count(*)`));

    // Customer lifetime value and segmentation
    const customerSegmentation = customerDemographics.map(c => {
      const revenue = parseFloat(String(c.revenue));
      const orderCount = Number(c.orderCount);
      let segment = 'New';
      
      if (orderCount > 5) segment = 'Champion';
      else if (orderCount > 3) segment = 'Loyal';
      else if (orderCount > 1) segment = 'Repeat';
      
      return {
        contact: c.city,
        orderCount,
        revenue,
        segment,
        avgOrderValue: orderCount > 0 ? revenue / orderCount : 0,
      };
    });

    // Conversion funnel analysis
    const funnelData = await db
      .select({
        status: orders.status,
        count: sql<number>`count(*)`,
        revenue: sql<string>`coalesce(sum(${catalogItems.price}), 0)`,
      })
      .from(orders)
      .leftJoin(catalogItems, eq(orders.itemId, catalogItems.id))
      .where(and(eq(orders.sellerId, sellerId), gte(orders.createdAt, since)))
      .groupBy(orders.status)
      .orderBy(sql`case 
        when ${orders.status} = 'placed' then 1
        when ${orders.status} = 'contacted' then 2
        when ${orders.status} = 'confirmed' then 3
        when ${orders.status} = 'shipped' then 4
        when ${orders.status} = 'delivered' then 5
        when ${orders.status} = 'completed' then 6
        else 99
      end`);

    // Calculate totals for funnel conversion rates
    const totalFunnelOrders = funnelData.reduce((sum, stage) => sum + Number(stage.count), 0);
    const conversionFunnel = funnelData.map((stage, index) => {
      const count = Number(stage.count);
      const conversionRate = totalFunnelOrders > 0 ? (count / totalFunnelOrders) * 100 : 0;
      const dropOffRate = index > 0 ? 
        ((Number(funnelData[index - 1].count) - count) / Number(funnelData[index - 1].count)) * 100 : 0;
      
      return {
        status: stage.status,
        count,
        revenue: parseFloat(String(stage.revenue)),
        conversionRate: Math.round(conversionRate * 100) / 100,
        dropOffRate: Math.round(dropOffRate * 100) / 100,
      };
    });

    // Calculate key metrics
    const curOrders = Number(currentMetrics?.orderCount ?? 0);
    const prevOrders = Number(prevMetrics?.orderCount ?? 0);
    const curRevenue = parseFloat(String(currentMetrics?.revenue ?? "0"));
    const prevRevenue = parseFloat(String(prevMetrics?.revenue ?? "0"));
    const curCustomers = Number(currentMetrics?.uniqueCustomers ?? 0);
    const prevCustomers = Number(prevMetrics?.uniqueCustomers ?? 0);

    const orderTrend = prevOrders > 0 ? Math.round(((curOrders - prevOrders) / prevOrders) * 100) : curOrders > 0 ? 100 : 0;
    const revenueTrend = prevRevenue > 0 ? Math.round(((curRevenue - prevRevenue) / prevRevenue) * 100) : curRevenue > 0 ? 100 : 0;
    const customerTrend = prevCustomers > 0 ? Math.round(((curCustomers - prevCustomers) / prevCustomers) * 100) : curCustomers > 0 ? 100 : 0;
    const avgOrderValue = curOrders > 0 ? curRevenue / curOrders : 0;

    // Customer breakdown
    const totalCustomers = customerDemographics.length;
    const repeatCustomers = customerDemographics.filter((c) => Number(c.orderCount) > 1).length;
    const newCustomers = totalCustomers - repeatCustomers;

    // Calculate conversion rate (completed orders / total orders)
    const completedOrders = funnelData.find(f => f.status === 'completed')?.count || 0;
    const conversionRate = curOrders > 0 ? (Number(completedOrders) / curOrders) * 100 : 0;

    const responseData = {
      period,
      groupBy,
      metrics: {
        orders: curOrders,
        orderTrend,
        revenue: curRevenue,
        revenueTrend,
        avgOrderValue: Math.round(avgOrderValue * 100) / 100,
        customers: curCustomers,
        customerTrend,
        conversionRate: Math.round(conversionRate * 100) / 100,
        storeViews: 0, // placeholder for future implementation
      },
      timeSeriesData: timeSeriesData.map((d) => ({
        date: d.date,
        count: Number(d.count),
        revenue: parseFloat(String(d.revenue)),
        uniqueCustomers: Number(d.uniqueCustomers),
      })),
      topProducts: topProducts.map((p) => ({
        itemId: p.itemId,
        name: p.name || "Unknown",
        price: p.price,
        orderCount: Number(p.orderCount),
        revenue: parseFloat(String(p.revenue)),
        uniqueCustomers: Number(p.uniqueCustomers),
        avgOrderValue: parseFloat(String(p.avgOrderValue)),
      })),
      customerSegmentation: {
        total: totalCustomers,
        new: newCustomers,
        repeat: repeatCustomers,
        segments: customerSegmentation.slice(0, 10), // Top 10 customers
        demographics: {
          champion: customerSegmentation.filter(c => c.segment === 'Champion').length,
          loyal: customerSegmentation.filter(c => c.segment === 'Loyal').length,
          repeat_: customerSegmentation.filter(c => c.segment === 'Repeat').length,
          new_: customerSegmentation.filter(c => c.segment === 'New').length,
        }
      },
      conversionFunnel,
      previousPeriodComparison: {
        orders: { current: curOrders, previous: prevOrders, trend: orderTrend },
        revenue: { current: curRevenue, previous: prevRevenue, trend: revenueTrend },
        customers: { current: curCustomers, previous: prevCustomers, trend: customerTrend },
        avgOrderValue: { 
          current: avgOrderValue, 
          previous: prevOrders > 0 ? prevRevenue / prevOrders : 0,
          trend: avgOrderValue > 0 && prevOrders > 0 ? 
            Math.round(((avgOrderValue - (prevRevenue / prevOrders)) / (prevRevenue / prevOrders)) * 100) : 0
        }
      }
    };

    // If export is requested, return CSV data
    if (export_) {
      return new NextResponse(generateCSVReport(responseData), {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename=analytics-report-${period}-${new Date().toISOString().split('T')[0]}.csv`,
        },
      });
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}

function generateCSVReport(data: any): string {
  const lines = [];
  
  // Header
  lines.push("MyShop Analytics Report");
  lines.push(`Period: ${data.period}, Group By: ${data.groupBy}`);
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push("");

  // Key Metrics
  lines.push("Key Metrics");
  lines.push("Metric,Current Period,Previous Period,Trend (%)");
  lines.push(`Orders,${data.metrics.orders},${data.previousPeriodComparison.orders.previous},${data.previousPeriodComparison.orders.trend}%`);
  lines.push(`Revenue,${data.metrics.revenue.toFixed(2)},${data.previousPeriodComparison.revenue.previous.toFixed(2)},${data.previousPeriodComparison.revenue.trend}%`);
  lines.push(`Average Order Value,${data.metrics.avgOrderValue},${data.previousPeriodComparison.avgOrderValue.previous.toFixed(2)},${data.previousPeriodComparison.avgOrderValue.trend}%`);
  lines.push(`Customers,${data.metrics.customers},${data.previousPeriodComparison.customers.previous},${data.previousPeriodComparison.customers.trend}%`);
  lines.push(`Conversion Rate,${data.metrics.conversionRate}%,,,`);
  lines.push("");

  // Time Series Data
  lines.push("Time Series Data");
  lines.push("Date,Orders,Revenue,Unique Customers");
  data.timeSeriesData.forEach((item: any) => {
    lines.push(`${item.date},${item.count},${item.revenue.toFixed(2)},${item.uniqueCustomers}`);
  });
  lines.push("");

  // Top Products
  lines.push("Top Products");
  lines.push("Product Name,Orders,Revenue,Unique Customers,Avg Order Value");
  data.topProducts.forEach((product: any) => {
    lines.push(`"${product.name}",${product.orderCount},${product.revenue.toFixed(2)},${product.uniqueCustomers},${product.avgOrderValue.toFixed(2)}`);
  });
  lines.push("");

  // Conversion Funnel
  lines.push("Conversion Funnel");
  lines.push("Status,Orders,Revenue,Conversion Rate (%),Drop-off Rate (%)");
  data.conversionFunnel.forEach((stage: any) => {
    lines.push(`${stage.status},${stage.count},${stage.revenue.toFixed(2)},${stage.conversionRate},${stage.dropOffRate}`);
  });

  return lines.join("\n");
}
