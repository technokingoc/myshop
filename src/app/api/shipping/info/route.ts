import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { shippingZones, shippingMethods, sellers } from "@/lib/schema";
import { eq, and, min, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const sellerId = searchParams.get('sellerId');

    if (!sellerId) {
      return NextResponse.json({ error: "Seller ID is required" }, { status: 400 });
    }

    // Get seller currency
    const [seller] = await db
      .select({ currency: sellers.currency })
      .from(sellers)
      .where(eq(sellers.id, parseInt(sellerId)))
      .limit(1);

    if (!seller) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    // Get all active shipping zones for the seller
    const zones = await db
      .select({
        id: shippingZones.id,
        name: shippingZones.name,
        regions: shippingZones.regions,
        countries: shippingZones.countries,
      })
      .from(shippingZones)
      .where(and(eq(shippingZones.sellerId, parseInt(sellerId)), eq(shippingZones.active, true)));

    if (zones.length === 0) {
      return NextResponse.json({ 
        error: "No shipping zones configured",
        message: "This seller hasn't set up shipping zones yet."
      });
    }

    // Get shipping methods summary
    const methodsStats = await db
      .select({
        totalMethods: sql<number>`count(*)`.as('total_methods'),
        fastestDelivery: sql<number>`min(${shippingMethods.estimatedDays})`.as('fastest_delivery'),
        minShippingRate: sql<string>`min(${shippingMethods.rate})`.as('min_shipping_rate'),
        hasFreeShipping: sql<boolean>`bool_or(${shippingMethods.type} = 'free' OR ${shippingMethods.freeShippingMinOrder} > 0)`.as('has_free_shipping'),
        hasPickup: sql<boolean>`bool_or(${shippingMethods.type} = 'pickup')`.as('has_pickup'),
        freeShippingMinOrder: sql<string>`min(case when ${shippingMethods.freeShippingMinOrder} > 0 then ${shippingMethods.freeShippingMinOrder} else null end)`.as('free_shipping_min_order'),
      })
      .from(shippingMethods)
      .innerJoin(shippingZones, eq(shippingMethods.zoneId, shippingZones.id))
      .where(
        and(
          eq(shippingZones.sellerId, parseInt(sellerId)),
          eq(shippingZones.active, true),
          eq(shippingMethods.active, true)
        )
      );

    const stats = methodsStats[0];

    if (!stats || stats.totalMethods === 0) {
      return NextResponse.json({ 
        error: "No shipping methods configured",
        message: "This seller hasn't set up any shipping methods yet."
      });
    }

    const summary = {
      fastestDelivery: Number(stats.fastestDelivery) || null,
      minShippingRate: parseFloat(stats.minShippingRate || '0'),
      hasFreeShipping: Boolean(stats.hasFreeShipping),
      freeShippingMinOrder: stats.freeShippingMinOrder ? parseFloat(stats.freeShippingMinOrder) : null,
      hasPickup: Boolean(stats.hasPickup),
      totalMethods: Number(stats.totalMethods),
    };

    const shippingInfo = {
      sellerId: parseInt(sellerId),
      sellerCurrency: seller.currency,
      summary,
      zones: zones.map(zone => ({
        id: zone.id,
        name: zone.name,
        regions: Array.isArray(zone.regions) ? zone.regions : [],
        countries: Array.isArray(zone.countries) ? zone.countries : [],
      })),
    };

    return NextResponse.json({ shippingInfo });
  } catch (error) {
    console.error("Failed to fetch shipping info:", error);
    return NextResponse.json({ error: "Failed to fetch shipping info" }, { status: 500 });
  }
}