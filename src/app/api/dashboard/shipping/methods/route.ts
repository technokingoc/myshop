import { NextRequest, NextResponse } from "next/server";
import { getSessionFromCookie } from "@/lib/session";
import { getDb } from "@/lib/db";
import { shippingMethods, shippingZones } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const session = await getSessionFromCookie();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getDb();
    const sellerId = session.sellerId;
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

    if (!zoneId || !name || !name.trim() || !type) {
      return NextResponse.json({ error: "Zone ID, name, and type are required" }, { status: 400 });
    }

    // Verify zone belongs to seller
    const [zone] = await db
      .select()
      .from(shippingZones)
      .where(and(eq(shippingZones.id, zoneId), eq(shippingZones.sellerId, sellerId)))
      .limit(1);

    if (!zone) {
      return NextResponse.json({ error: "Zone not found" }, { status: 404 });
    }

    // Insert new method
    const [newMethod] = await db
      .insert(shippingMethods)
      .values({
        sellerId,
        zoneId,
        name: name.trim(),
        type,
        rate: rate ? parseFloat(rate) : 0,
        freeShippingMinOrder: freeShippingMinOrder ? parseFloat(freeShippingMinOrder) : 0,
        estimatedDays: estimatedDays ? parseInt(estimatedDays) : 3,
        maxWeight: maxWeight ? parseFloat(maxWeight) : 0,
        pickupAddress: pickupAddress?.trim() || '',
        pickupInstructions: pickupInstructions?.trim() || '',
        active: active !== undefined ? active : true,
        sortOrder: 0,
      })
      .returning();

    return NextResponse.json({ method: newMethod }, { status: 201 });
  } catch (error) {
    console.error("Failed to create shipping method:", error);
    return NextResponse.json({ error: "Failed to create shipping method" }, { status: 500 });
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

    const { 
      id,
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

    if (!id || !name || !name.trim() || !type) {
      return NextResponse.json({ error: "Method ID, name, and type are required" }, { status: 400 });
    }

    // Update method
    const [updatedMethod] = await db
      .update(shippingMethods)
      .set({
        name: name.trim(),
        type,
        rate: rate ? parseFloat(rate) : 0,
        freeShippingMinOrder: freeShippingMinOrder ? parseFloat(freeShippingMinOrder) : 0,
        estimatedDays: estimatedDays ? parseInt(estimatedDays) : 3,
        maxWeight: maxWeight ? parseFloat(maxWeight) : 0,
        pickupAddress: pickupAddress?.trim() || '',
        pickupInstructions: pickupInstructions?.trim() || '',
        active: active !== undefined ? active : true,
        updatedAt: new Date(),
      })
      .where(and(eq(shippingMethods.id, id), eq(shippingMethods.sellerId, sellerId)))
      .returning();

    if (!updatedMethod) {
      return NextResponse.json({ error: "Method not found" }, { status: 404 });
    }

    return NextResponse.json({ method: updatedMethod });
  } catch (error) {
    console.error("Failed to update shipping method:", error);
    return NextResponse.json({ error: "Failed to update shipping method" }, { status: 500 });
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
      return NextResponse.json({ error: "Method ID is required" }, { status: 400 });
    }

    // Delete method
    const [deletedMethod] = await db
      .delete(shippingMethods)
      .where(and(eq(shippingMethods.id, parseInt(id)), eq(shippingMethods.sellerId, sellerId)))
      .returning();

    if (!deletedMethod) {
      return NextResponse.json({ error: "Method not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Method deleted successfully" });
  } catch (error) {
    console.error("Failed to delete shipping method:", error);
    return NextResponse.json({ error: "Failed to delete shipping method" }, { status: 500 });
  }
}