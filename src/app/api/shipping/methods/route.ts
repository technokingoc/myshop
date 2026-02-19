import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { shippingZones, shippingMethods, sellers } from '@/lib/schema';
import { eq, and, inArray } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sellerId, customerLocation, cartTotal } = body;

    if (!sellerId) {
      return NextResponse.json({ error: 'Seller ID is required' }, { status: 400 });
    }

    // Get all active shipping zones for the seller
    const zones = await db
      .select()
      .from(shippingZones)
      .where(and(
        eq(shippingZones.sellerId, sellerId),
        eq(shippingZones.active, true)
      ));

    if (zones.length === 0) {
      return NextResponse.json({
        success: true,
        methods: []
      });
    }

    // Filter zones by customer location if provided
    let applicableZones = zones;
    if (customerLocation) {
      const { city, country } = customerLocation;
      applicableZones = zones.filter(zone => {
        // Check if customer's location matches any region or country in the zone
        const matchesRegion = zone.regions.some((region: string) => 
          city && region.toLowerCase().includes(city.toLowerCase())
        );
        const matchesCountry = zone.countries.some((zoneCountry: string) => 
          country && zoneCountry.toLowerCase().includes(country.toLowerCase())
        );
        
        // If zone has no specific regions/countries defined, it applies to all
        const hasNoRestrictions = zone.regions.length === 0 && zone.countries.length === 0;
        
        return hasNoRestrictions || matchesRegion || matchesCountry;
      });
    }

    if (applicableZones.length === 0) {
      return NextResponse.json({
        success: true,
        methods: []
      });
    }

    // Get all active shipping methods for applicable zones
    const zoneIds = applicableZones.map(zone => zone.id);
    const methods = await db
      .select()
      .from(shippingMethods)
      .where(and(
        inArray(shippingMethods.zoneId, zoneIds),
        eq(shippingMethods.active, true)
      ));

    // Process methods and calculate shipping costs
    const processedMethods = methods.map(method => {
      const rate = parseFloat(method.rate);
      const freeShippingMin = parseFloat(method.freeShippingMinOrder);
      let shippingCost = rate;

      // Apply free shipping if minimum order amount is met
      if (freeShippingMin > 0 && cartTotal >= freeShippingMin) {
        shippingCost = 0;
      }

      // For free shipping methods, cost is always 0
      if (method.type === 'free') {
        shippingCost = 0;
      }

      return {
        id: method.id,
        name: method.name,
        type: method.type,
        cost: shippingCost,
        originalRate: rate,
        freeShippingMinOrder: freeShippingMin,
        estimatedDays: method.estimatedDays,
        maxWeight: parseFloat(method.maxWeight),
        pickupAddress: method.pickupAddress,
        pickupInstructions: method.pickupInstructions,
        description: getMethodDescription(method, shippingCost, freeShippingMin, cartTotal)
      };
    });

    // Sort methods: free shipping first, then by cost
    processedMethods.sort((a, b) => {
      if (a.cost === 0 && b.cost > 0) return -1;
      if (b.cost === 0 && a.cost > 0) return 1;
      return a.cost - b.cost;
    });

    return NextResponse.json({
      success: true,
      methods: processedMethods
    });

  } catch (error) {
    console.error('Error fetching shipping methods:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shipping methods' },
      { status: 500 }
    );
  }
}

function getMethodDescription(method: any, shippingCost: number, freeShippingMin: number, cartTotal: number): string {
  const estimatedDays = method.estimatedDays;
  const dayText = estimatedDays === 1 ? 'day' : 'days';
  
  if (method.type === 'pickup') {
    return `Pickup available • Ready in ${estimatedDays} ${dayText}`;
  }
  
  if (shippingCost === 0) {
    if (freeShippingMin > 0 && cartTotal >= freeShippingMin) {
      return `Free shipping (min. order $${freeShippingMin.toFixed(2)}) • ${estimatedDays} ${dayText}`;
    }
    return `Free shipping • ${estimatedDays} ${dayText}`;
  }
  
  let description = `$${shippingCost.toFixed(2)} • ${estimatedDays} ${dayText}`;
  
  if (freeShippingMin > 0 && cartTotal < freeShippingMin) {
    const remaining = freeShippingMin - cartTotal;
    description += ` • Add $${remaining.toFixed(2)} for free shipping`;
  }
  
  return description;
}