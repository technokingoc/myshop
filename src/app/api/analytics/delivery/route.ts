import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { orders, sellers } from "@/lib/schema";
import { eq, sql, and, gte, desc } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sellerId = searchParams.get('sellerId');
  const range = searchParams.get('range') || '30d';
  
  try {
    if (!sellerId) {
      return NextResponse.json({ error: "Seller ID required" }, { status: 400 });
    }

    const db = getDb();
    
    // Calculate date range
    const now = new Date();
    const daysBack = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

    // Get all orders for the seller in the date range
    const ordersData = await db
      .select({
        id: orders.id,
        status: orders.status,
        createdAt: orders.createdAt,
        statusHistory: orders.statusHistory,
        estimatedDelivery: orders.estimatedDelivery,
        notes: orders.notes,
        shippingAddress: orders.shippingAddress,
      })
      .from(orders)
      .where(
        and(
          eq(orders.sellerId, Number(sellerId)),
          gte(orders.createdAt, startDate)
        )
      )
      .orderBy(desc(orders.createdAt));

    // Calculate metrics
    const totalOrders = ordersData.length;
    const ordersShipped = ordersData.filter(o => 
      ['shipped', 'in-transit', 'delivered'].includes(o.status)
    ).length;
    const ordersDelivered = ordersData.filter(o => o.status === 'delivered').length;
    const ordersInTransit = ordersData.filter(o => 
      ['shipped', 'in-transit'].includes(o.status)
    ).length;
    const deliveryIssues = ordersData.filter(o => o.status === 'cancelled').length;

    // Calculate timing metrics (simplified version)
    let totalProcessingTime = 0;
    let totalShippingTime = 0;
    let totalDeliveryTime = 0;
    let timingOrdersCount = 0;
    let onTimeDeliveries = 0;
    let lateDeliveries = 0;
    let deliveryRatingsCount = 0;
    let totalDeliveryRating = 0;
    let confirmationsCount = 0;

    for (const order of ordersData) {
      const statusHistory = order.statusHistory as Array<{ status: string; at: string; note?: string }> || [];
      
      // Find key timestamps
      const confirmed = statusHistory.find(h => h.status === 'confirmed');
      const shipped = statusHistory.find(h => ['shipped', 'preparing'].includes(h.status));
      const delivered = statusHistory.find(h => h.status === 'delivered');
      
      if (confirmed && shipped) {
        const processingTime = (new Date(shipped.at).getTime() - new Date(confirmed.at).getTime()) / (1000 * 60 * 60); // hours
        totalProcessingTime += processingTime;
      }
      
      if (shipped && delivered) {
        const shippingTime = (new Date(delivered.at).getTime() - new Date(shipped.at).getTime()) / (1000 * 60 * 60); // hours
        totalShippingTime += shippingTime;
        timingOrdersCount++;
      }
      
      if (confirmed && delivered) {
        const totalTime = (new Date(delivered.at).getTime() - new Date(confirmed.at).getTime()) / (1000 * 60 * 60); // hours
        totalDeliveryTime += totalTime;
        
        // Check if on-time (using estimated delivery if available)
        if (order.estimatedDelivery) {
          const estimatedTime = new Date(order.estimatedDelivery).getTime();
          const actualTime = new Date(delivered.at).getTime();
          if (actualTime <= estimatedTime) {
            onTimeDeliveries++;
          } else {
            lateDeliveries++;
          }
        } else {
          // Assume 3 days default if no estimated delivery
          if (totalTime <= 72) { // 3 days in hours
            onTimeDeliveries++;
          } else {
            lateDeliveries++;
          }
        }
      }
      
      // Check for delivery confirmation (looking in notes)
      if (order.notes?.includes('DELIVERY CONFIRMATION')) {
        confirmationsCount++;
        
        // Try to extract rating from notes (simplified)
        const ratingMatch = order.notes.match(/Delivery Rating: (\d)/);
        if (ratingMatch) {
          deliveryRatingsCount++;
          totalDeliveryRating += parseInt(ratingMatch[1]);
        }
      }
    }

    const avgProcessingTime = timingOrdersCount > 0 ? totalProcessingTime / timingOrdersCount : 0;
    const avgShippingTime = timingOrdersCount > 0 ? totalShippingTime / timingOrdersCount : 0;
    const avgTotalDeliveryTime = timingOrdersCount > 0 ? totalDeliveryTime / timingOrdersCount : 0;
    const onTimeDeliveryRate = (onTimeDeliveries + lateDeliveries) > 0 
      ? (onTimeDeliveries / (onTimeDeliveries + lateDeliveries)) * 100 
      : 0;
    const avgDeliveryRating = deliveryRatingsCount > 0 ? totalDeliveryRating / deliveryRatingsCount : 0;
    const confirmationRate = ordersDelivered > 0 ? (confirmationsCount / ordersDelivered) * 100 : 0;

    // Calculate top delivery zones (simplified)
    const zoneMap = new Map<string, { count: number; totalTime: number; orders: number }>();
    
    for (const order of ordersData) {
      if (order.shippingAddress) {
        const address = order.shippingAddress as any;
        const city = address.city || 'Unknown';
        
        if (!zoneMap.has(city)) {
          zoneMap.set(city, { count: 0, totalTime: 0, orders: 0 });
        }
        
        const zone = zoneMap.get(city)!;
        zone.count++;
        
        // Calculate delivery time if available
        const statusHistory = order.statusHistory as Array<{ status: string; at: string }> || [];
        const confirmed = statusHistory.find(h => h.status === 'confirmed');
        const delivered = statusHistory.find(h => h.status === 'delivered');
        
        if (confirmed && delivered) {
          const deliveryTime = (new Date(delivered.at).getTime() - new Date(confirmed.at).getTime()) / (1000 * 60 * 60);
          zone.totalTime += deliveryTime;
          zone.orders++;
        }
      }
    }

    const topDeliveryZones = Array.from(zoneMap.entries())
      .map(([zoneName, data]) => ({
        zoneName,
        orderCount: data.count,
        avgDeliveryTime: data.orders > 0 ? data.totalTime / data.orders : 0,
      }))
      .sort((a, b) => b.orderCount - a.orderCount)
      .slice(0, 10);

    // Generate daily metrics (simplified - just last 7 days for now)
    const dailyMetrics = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));
      
      const dayOrders = ordersData.filter(o => {
        const orderDate = new Date(o.createdAt);
        return orderDate >= dayStart && orderDate <= dayEnd;
      });
      
      const dayShipped = dayOrders.filter(o => ['shipped', 'in-transit', 'delivered'].includes(o.status)).length;
      const dayDelivered = dayOrders.filter(o => o.status === 'delivered').length;
      
      dailyMetrics.push({
        date: dayStart.toISOString().split('T')[0],
        ordersShipped: dayShipped,
        ordersDelivered: dayDelivered,
        avgDeliveryTime: avgTotalDeliveryTime, // Simplified
        onTimeRate: onTimeDeliveryRate, // Simplified
      });
    }

    const analytics = {
      totalOrders,
      ordersShipped,
      ordersDelivered,
      ordersInTransit,
      deliveryIssues,
      avgProcessingTime,
      avgShippingTime,
      avgTotalDeliveryTime,
      onTimeDeliveries,
      lateDeliveries,
      onTimeDeliveryRate,
      deliveryRatingsCount,
      avgDeliveryRating,
      confirmationRate,
      topDeliveryZones,
      dailyMetrics,
    };

    return NextResponse.json(analytics);

  } catch (error) {
    console.error('Delivery analytics error:', error);
    return NextResponse.json(
      { error: "Failed to fetch delivery analytics" }, 
      { status: 500 }
    );
  }
}