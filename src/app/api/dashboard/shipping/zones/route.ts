import { NextRequest, NextResponse } from "next/server";
import { getSessionFromCookie } from "@/lib/session";
import { getDb } from "@/lib/db";
import { shippingZones, shippingMethods } from "@/lib/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET() {
  const session = await getSessionFromCookie();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getDb();
    const sellerId = session.sellerId;

    // Get zones with their methods
    const zonesData = await db
      .select({
        id: shippingZones.id,
        name: shippingZones.name,
        regions: shippingZones.regions,
        countries: shippingZones.countries,
        active: shippingZones.active,
        sortOrder: shippingZones.sortOrder,
        createdAt: shippingZones.createdAt,
      })
      .from(shippingZones)
      .where(eq(shippingZones.sellerId, sellerId))
      .orderBy(shippingZones.sortOrder, shippingZones.name);

    // Get methods for each zone
    const zones = await Promise.all(
      zonesData.map(async (zone) => {
        const methods = await db
          .select({
            id: shippingMethods.id,
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
          .where(eq(shippingMethods.zoneId, zone.id))
          .orderBy(shippingMethods.sortOrder, shippingMethods.name);

        return {
          ...zone,
          methods: methods.map(method => ({
            ...method,
            rate: parseFloat(method.rate || '0'),
            freeShippingMinOrder: parseFloat(method.freeShippingMinOrder || '0'),
            maxWeight: parseFloat(method.maxWeight || '0'),
          })),
        };
      })
    );

    return NextResponse.json({ zones });
  } catch (error) {
    console.error("Failed to fetch shipping zones:", error);
    return NextResponse.json({ error: "Failed to fetch shipping zones" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromCookie();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getDb();
    const sellerId = session.sellerId;
    const body = await request.json();

    const { name, regions, countries, active } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Zone name is required" }, { status: 400 });
    }

    // Insert new zone
    const [newZone] = await db
      .insert(shippingZones)
      .values({
        sellerId,
        name: name.trim(),
        regions: regions || [],
        countries: countries || [],
        active: active !== undefined ? active : true,
        sortOrder: 0,
      })
      .returning();

    return NextResponse.json({ zone: newZone }, { status: 201 });
  } catch (error) {
    console.error("Failed to create shipping zone:", error);
    return NextResponse.json({ error: "Failed to create shipping zone" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await getSessionFromCookie();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getDb();
    const sellerId = session.sellerId;
    const body = await request.json();

    const { id, name, regions, countries, active } = body;

    if (!id || !name || !name.trim()) {
      return NextResponse.json({ error: "Zone ID and name are required" }, { status: 400 });
    }

    // Update zone
    const [updatedZone] = await db
      .update(shippingZones)
      .set({
        name: name.trim(),
        regions: regions || [],
        countries: countries || [],
        active: active !== undefined ? active : true,
        updatedAt: new Date(),
      })
      .where(and(eq(shippingZones.id, id), eq(shippingZones.sellerId, sellerId)))
      .returning();

    if (!updatedZone) {
      return NextResponse.json({ error: "Zone not found" }, { status: 404 });
    }

    return NextResponse.json({ zone: updatedZone });
  } catch (error) {
    console.error("Failed to update shipping zone:", error);
    return NextResponse.json({ error: "Failed to update shipping zone" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getSessionFromCookie();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getDb();
    const sellerId = session.sellerId;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "Zone ID is required" }, { status: 400 });
    }

    // Delete zone (cascade will delete methods)
    const [deletedZone] = await db
      .delete(shippingZones)
      .where(and(eq(shippingZones.id, parseInt(id)), eq(shippingZones.sellerId, sellerId)))
      .returning();

    if (!deletedZone) {
      return NextResponse.json({ error: "Zone not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Zone deleted successfully" });
  } catch (error) {
    console.error("Failed to delete shipping zone:", error);
    return NextResponse.json({ error: "Failed to delete shipping zone" }, { status: 500 });
  }
}