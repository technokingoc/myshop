import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { promotions } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { getSessionFromCookie } from "@/lib/session";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionFromCookie();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const promotionId = parseInt(id);
    if (isNaN(promotionId)) return NextResponse.json({ error: "Invalid promotion ID" }, { status: 400 });

    const db = getDb();
    const body = await req.json();
    
    const [updated] = await db
      .update(promotions)
      .set({
        ...body,
        updatedAt: new Date(),
        validFrom: body.validFrom ? new Date(body.validFrom) : undefined,
        validUntil: body.validUntil ? new Date(body.validUntil) : null,
      })
      .where(and(eq(promotions.id, promotionId), eq(promotions.sellerId, session.sellerId)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Promotion not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Promotion PUT error:", error);
    return NextResponse.json({ error: "Failed to update promotion" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionFromCookie();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const promotionId = parseInt(id);
    if (isNaN(promotionId)) return NextResponse.json({ error: "Invalid promotion ID" }, { status: 400 });

    const db = getDb();
    const [deleted] = await db
      .delete(promotions)
      .where(and(eq(promotions.id, promotionId), eq(promotions.sellerId, session.sellerId)))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Promotion not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Promotion DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete promotion" }, { status: 500 });
  }
}