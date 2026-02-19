import { NextRequest, NextResponse } from 'next/server';
import { getSellerSession } from '@/lib/session';
import { getDb } from '@/lib/db';
import { shippingZones, shippingMethods } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await getSellerSession();
    if (!session?.sellerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();

    // Get all zones for the seller with their methods
    const zones = await db
      .select()
      .from(shippingZones)
      .where(eq(shippingZones.sellerId, session.sellerId));

    // Get methods for each zone
    const zonesWithMethods = await Promise.all(
      zones.map(async (zone) => {
        const methods = await db
          .select()
          .from(shippingMethods)
          .where(eq(shippingMethods.zoneId, zone.id));

        return {
          ...zone,
          methods: methods.map(method => ({
            ...method,
            rate: parseFloat(method.rate),
            freeShippingMinOrder: parseFloat(method.freeShippingMinOrder),
            maxWeight: parseFloat(method.maxWeight)
          }))
        };
      })
    );

    return NextResponse.json({
      success: true,
      zones: zonesWithMethods
    });

  } catch (error) {
    console.error('Error fetching shipping zones:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shipping zones' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSellerSession();
    if (!session?.sellerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, regions, countries, active } = body;

    if (!name) {
      return NextResponse.json({ error: 'Zone name is required' }, { status: 400 });
    }

    const db = getDb();
    const newZone = await db
      .insert(shippingZones)
      .values({
        sellerId: session.sellerId,
        name,
        regions: regions || [],
        countries: countries || [],
        active: active ?? true,
        sortOrder: 0,
      })
      .returning();

    return NextResponse.json({
      success: true,
      zone: newZone[0]
    });

  } catch (error) {
    console.error('Error creating shipping zone:', error);
    return NextResponse.json(
      { error: 'Failed to create shipping zone' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSellerSession();
    if (!session?.sellerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, regions, countries, active } = body;

    if (!id || !name) {
      return NextResponse.json({ error: 'Zone ID and name are required' }, { status: 400 });
    }

    const db = getDb();
    const updatedZone = await db
      .update(shippingZones)
      .set({
        name,
        regions: regions || [],
        countries: countries || [],
        active: active ?? true,
        updatedAt: new Date()
      })
      .where(and(
        eq(shippingZones.id, id),
        eq(shippingZones.sellerId, session.sellerId)
      ))
      .returning();

    if (updatedZone.length === 0) {
      return NextResponse.json({ error: 'Zone not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      zone: updatedZone[0]
    });

  } catch (error) {
    console.error('Error updating shipping zone:', error);
    return NextResponse.json(
      { error: 'Failed to update shipping zone' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSellerSession();
    if (!session?.sellerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Zone ID is required' }, { status: 400 });
    }

    const db = getDb();
    const deletedZone = await db
      .delete(shippingZones)
      .where(and(
        eq(shippingZones.id, parseInt(id)),
        eq(shippingZones.sellerId, session.sellerId)
      ))
      .returning();

    if (deletedZone.length === 0) {
      return NextResponse.json({ error: 'Zone not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Zone deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting shipping zone:', error);
    return NextResponse.json(
      { error: 'Failed to delete shipping zone' },
      { status: 500 }
    );
  }
}