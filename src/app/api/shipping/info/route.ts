import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { shippingZones, shippingMethods, sellers } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sellerId = searchParams.get('sellerId');

    if (!sellerId) {
      return NextResponse.json({ error: 'Seller ID is required' }, { status: 400 });
    }

    // Get seller info
    const seller = await db
      .select()
      .from(sellers)
      .where(eq(sellers.id, parseInt(sellerId)))
      .limit(1);

    if (seller.length === 0) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
    }

    // Get active shipping zones for the seller
    const zones = await db
      .select()
      .from(shippingZones)
      .where(and(
        eq(shippingZones.sellerId, parseInt(sellerId)),
        eq(shippingZones.active, true)
      ));

    if (zones.length === 0) {
      return NextResponse.json({
        success: true,
        shippingInfo: null,
        message: 'No shipping zones configured'
      });
    }

    // Get active shipping methods for all zones
    const zoneIds = zones.map(zone => zone.id);
    const allMethods = [];
    
    for (const zoneId of zoneIds) {
      const methods = await db
        .select()
        .from(shippingMethods)
        .where(and(
          eq(shippingMethods.zoneId, zoneId),
          eq(shippingMethods.active, true)
        ));
      allMethods.push(...methods);
    }

    if (allMethods.length === 0) {
      return NextResponse.json({
        success: true,
        shippingInfo: null,
        message: 'No shipping methods available'
      });
    }

    // Find the fastest delivery time
    const fastestDelivery = Math.min(...allMethods.map(m => m.estimatedDays));
    
    // Check if free shipping is available
    const freeShippingMethod = allMethods.find(m => 
      m.type === 'free' || parseFloat(m.freeShippingMinOrder) > 0
    );
    
    // Check if pickup is available
    const pickupMethod = allMethods.find(m => m.type === 'pickup');
    
    // Get minimum shipping rate (excluding free shipping)
    const paidMethods = allMethods.filter(m => m.type !== 'free' && parseFloat(m.rate) > 0);
    const minShippingRate = paidMethods.length > 0 ? 
      Math.min(...paidMethods.map(m => parseFloat(m.rate))) : 0;

    return NextResponse.json({
      success: true,
      shippingInfo: {
        sellerId: parseInt(sellerId),
        sellerCurrency: seller[0].currency || 'USD',
        zones: zones.map(zone => ({
          id: zone.id,
          name: zone.name,
          regions: zone.regions,
          countries: zone.countries
        })),
        summary: {
          fastestDelivery: fastestDelivery,
          minShippingRate: minShippingRate,
          hasFreeShipping: !!freeShippingMethod,
          freeShippingMinOrder: freeShippingMethod ? 
            parseFloat(freeShippingMethod.freeShippingMinOrder) : null,
          hasPickup: !!pickupMethod,
          totalMethods: allMethods.length
        },
        methods: allMethods.map(method => ({
          id: method.id,
          name: method.name,
          type: method.type,
          rate: parseFloat(method.rate),
          freeShippingMinOrder: parseFloat(method.freeShippingMinOrder),
          estimatedDays: method.estimatedDays,
          pickupAddress: method.pickupAddress
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching shipping info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shipping information' },
      { status: 500 }
    );
  }
}