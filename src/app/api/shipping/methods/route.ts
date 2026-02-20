import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { shippingZones, shippingMethods, sellers } from "@/lib/schema";
import { eq, and, or, sql } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();

    const { sellerId, customerLocation, cartTotal } = body;

    if (!sellerId || !customerLocation) {
      return NextResponse.json({ error: "Seller ID and customer location are required" }, { status: 400 });
    }

    const { city, country } = customerLocation;

    if (!city && !country) {
      return NextResponse.json({ error: "Customer city or country is required" }, { status: 400 });
    }

    // Get seller currency
    const [seller] = await db
      .select({ currency: sellers.currency })
      .from(sellers)
      .where(eq(sellers.id, sellerId))
      .limit(1);

    const currency = seller?.currency || 'USD';

    // Find zones that match the customer location
    const matchingZones = await db
      .select({
        zoneId: shippingZones.id,
        zoneName: shippingZones.name,
      })
      .from(shippingZones)
      .where(
        and(
          eq(shippingZones.sellerId, sellerId),
          eq(shippingZones.active, true),
          or(
            // Match by country
            country ? sql`${shippingZones.countries} ? ${country}` : sql`false`,
            // Match by city/region
            city ? sql`${shippingZones.regions} ? ${city}` : sql`false`,
            // If no specific regions/countries, it's a "global" zone
            sql`jsonb_array_length(${shippingZones.regions}) = 0 AND jsonb_array_length(${shippingZones.countries}) = 0`
          )
        )
      );

    if (matchingZones.length === 0) {
      return NextResponse.json({ 
        methods: [], 
        message: "No shipping methods available for your location" 
      });
    }

    const zoneIds = matchingZones.map(z => z.zoneId);

    // Get shipping methods for matching zones
    const availableMethods = await db
      .select({
        id: shippingMethods.id,
        zoneId: shippingMethods.zoneId,
        zoneName: sql<string>`(SELECT name FROM shipping_zones WHERE id = ${shippingMethods.zoneId})`.as('zone_name'),
        name: shippingMethods.name,
        type: shippingMethods.type,
        rate: shippingMethods.rate,
        freeShippingMinOrder: shippingMethods.freeShippingMinOrder,
        estimatedDays: shippingMethods.estimatedDays,
        maxWeight: shippingMethods.maxWeight,
        pickupAddress: shippingMethods.pickupAddress,
        pickupInstructions: shippingMethods.pickupInstructions,
        active: shippingMethods.active,
        sortOrder: shippingMethods.sortOrder,
      })
      .from(shippingMethods)
      .where(
        and(
          eq(shippingMethods.sellerId, sellerId),
          eq(shippingMethods.active, true),
          sql`${shippingMethods.zoneId} = ANY(${zoneIds})`
        )
      )
      .orderBy(shippingMethods.sortOrder, shippingMethods.name);

    // Calculate shipping costs and format methods
    const methods = availableMethods.map(method => {
      let cost = 0;
      let description = '';

      switch (method.type) {
        case 'flat_rate':
          cost = parseFloat(method.rate || '0');
          description = `Flat rate shipping`;
          
          // Check for free shipping threshold
          if (method.freeShippingMinOrder > 0 && cartTotal >= method.freeShippingMinOrder) {
            cost = 0;
            description = `Free shipping (order over ${currency} ${method.freeShippingMinOrder})`;
          }
          break;

        case 'weight_based':
          // For now, assume 1kg per item (this could be enhanced with actual product weights)
          // TODO: Calculate actual weight from cart items
          const estimatedWeight = 1; // kg
          cost = parseFloat(method.rate || '0') * estimatedWeight;
          description = `${currency} ${method.rate}/kg`;
          
          // Check for free shipping threshold
          if (method.freeShippingMinOrder > 0 && cartTotal >= method.freeShippingMinOrder) {
            cost = 0;
            description = `Free shipping (order over ${currency} ${method.freeShippingMinOrder})`;
          }
          break;

        case 'free':
          cost = 0;
          description = 'Free shipping';
          break;

        case 'pickup':
          cost = 0;
          description = 'Pickup from store';
          break;

        default:
          cost = parseFloat(method.rate || '0');
          description = method.name;
      }

      return {
        id: method.id,
        zoneId: method.zoneId,
        zoneName: method.zoneName,
        name: method.name,
        type: method.type,
        cost,
        estimatedDays: method.estimatedDays || 3,
        description,
        pickupAddress: method.pickupAddress,
        pickupInstructions: method.pickupInstructions,
      };
    });

    return NextResponse.json({ methods, currency });
  } catch (error) {
    console.error("Failed to fetch shipping methods:", error);
    return NextResponse.json({ error: "Failed to fetch shipping methods" }, { status: 500 });
  }
}