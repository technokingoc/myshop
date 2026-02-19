import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { flashSales } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { getSessionFromCookie } from "@/lib/session";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionFromCookie();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const saleId = parseInt(id);
    if (isNaN(saleId)) return NextResponse.json({ error: "Invalid flash sale ID" }, { status: 400 });

    const db = getDb();
    const body = await req.json();
    
    // Validate times if provided
    if (body.startTime && body.endTime) {
      const start = new Date(body.startTime);
      const end = new Date(body.endTime);
      if (start >= end) {
        return NextResponse.json({ 
          error: "End time must be after start time" 
        }, { status: 400 });
      }
    }
    
    const [updated] = await db
      .update(flashSales)
      .set({
        ...body,
        updatedAt: new Date(),
        startTime: body.startTime ? new Date(body.startTime) : undefined,
        endTime: body.endTime ? new Date(body.endTime) : undefined,
        discountValue: body.discountValue ? String(body.discountValue) : undefined,
        maxDiscount: body.maxDiscount !== undefined ? String(body.maxDiscount) : undefined,
        minOrderAmount: body.minOrderAmount !== undefined ? String(body.minOrderAmount) : undefined,
      })
      .where(and(eq(flashSales.id, saleId), eq(flashSales.sellerId, session.sellerId)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Flash sale not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Flash sale PUT error:", error);
    return NextResponse.json({ error: "Failed to update flash sale" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionFromCookie();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const saleId = parseInt(id);
    if (isNaN(saleId)) return NextResponse.json({ error: "Invalid flash sale ID" }, { status: 400 });

    const db = getDb();
    const [deleted] = await db
      .delete(flashSales)
      .where(and(eq(flashSales.id, saleId), eq(flashSales.sellerId, session.sellerId)))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Flash sale not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Flash sale DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete flash sale" }, { status: 500 });
  }
}