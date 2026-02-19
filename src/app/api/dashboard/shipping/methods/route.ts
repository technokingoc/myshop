import { NextRequest, NextResponse } from 'next/server';
import { getSellerSession } from '@/lib/session';
import { db } from '@/lib/db';
import { shippingMethods, shippingZones } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const session = await getSellerSession();
    if (!session?.sellerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      zoneId,
      name,
      type,
      rate,
      freeShippingMinOrder,
      estimatedDays,
      maxWeight,
      pickupAddress,
      pickupInstructions,
      active
    } = body;

    if (!zoneId || !name || !type) {
      return NextResponse.json(
        { error: 'Zone ID, name, and type are required' },
        { status: 400 }
      );
    }

    // Verify zone belongs to seller
    const zone = await db
      .select()
      .from(shippingZones)
      .where(and(
        eq(shippingZones.id, zoneId),
        eq(shippingZones.sellerId, session.sellerId)
      ));

    if (zone.length === 0) {
      return NextResponse.json({ error: 'Zone not found' }, { status: 404 });
    }

    const newMethod = await db
      .insert(shippingMethods)
      .values({
        sellerId: session.sellerId,
        zoneId,
        name,
        type,
        rate: (rate || 0).toString(),
        freeShippingMinOrder: (freeShippingMinOrder || 0).toString(),
        estimatedDays: estimatedDays || 3,
        maxWeight: (maxWeight || 0).toString(),
        pickupAddress: pickupAddress || '',
        pickupInstructions: pickupInstructions || '',
        active: active ?? true,
        sortOrder: 0,
      })
      .returning();

    return NextResponse.json({
      success: true,
      method: {
        ...newMethod[0],
        rate: parseFloat(newMethod[0].rate),
        freeShippingMinOrder: parseFloat(newMethod[0].freeShippingMinOrder),
        maxWeight: parseFloat(newMethod[0].maxWeight)
      }
    });

  } catch (error) {
    console.error('Error creating shipping method:', error);
    return NextResponse.json(
      { error: 'Failed to create shipping method' },
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
    const {
      id,
      name,
      type,
      rate,
      freeShippingMinOrder,
      estimatedDays,
      maxWeight,
      pickupAddress,
      pickupInstructions,
      active
    } = body;

    if (!id || !name || !type) {
      return NextResponse.json(
        { error: 'Method ID, name, and type are required' },
        { status: 400 }
      );
    }

    const updatedMethod = await db
      .update(shippingMethods)
      .set({
        name,
        type,
        rate: (rate || 0).toString(),
        freeShippingMinOrder: (freeShippingMinOrder || 0).toString(),
        estimatedDays: estimatedDays || 3,
        maxWeight: (maxWeight || 0).toString(),
        pickupAddress: pickupAddress || '',
        pickupInstructions: pickupInstructions || '',
        active: active ?? true,
        updatedAt: new Date()
      })
      .where(and(
        eq(shippingMethods.id, id),
        eq(shippingMethods.sellerId, session.sellerId)
      ))
      .returning();

    if (updatedMethod.length === 0) {
      return NextResponse.json({ error: 'Method not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      method: {
        ...updatedMethod[0],
        rate: parseFloat(updatedMethod[0].rate),
        freeShippingMinOrder: parseFloat(updatedMethod[0].freeShippingMinOrder),
        maxWeight: parseFloat(updatedMethod[0].maxWeight)
      }
    });

  } catch (error) {
    console.error('Error updating shipping method:', error);
    return NextResponse.json(
      { error: 'Failed to update shipping method' },
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
      return NextResponse.json({ error: 'Method ID is required' }, { status: 400 });
    }

    const deletedMethod = await db
      .delete(shippingMethods)
      .where(and(
        eq(shippingMethods.id, parseInt(id)),
        eq(shippingMethods.sellerId, session.sellerId)
      ))
      .returning();

    if (deletedMethod.length === 0) {
      return NextResponse.json({ error: 'Method not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Method deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting shipping method:', error);
    return NextResponse.json(
      { error: 'Failed to delete shipping method' },
      { status: 500 }
    );
  }
}