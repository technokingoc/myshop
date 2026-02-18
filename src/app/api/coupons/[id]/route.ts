import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { coupons } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { getSessionFromCookie } from "@/lib/session";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromCookie();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const db = getDb();
    const body = await req.json();

    const setObj: Record<string, unknown> = {};
    if (body.code !== undefined) setObj.code = body.code.toUpperCase().trim();
    if (body.type !== undefined) setObj.type = body.type;
    if (body.value !== undefined) setObj.value = String(body.value);
    if (body.minOrderAmount !== undefined) setObj.minOrderAmount = String(body.minOrderAmount);
    if (body.maxUses !== undefined) setObj.maxUses = body.maxUses;
    if (body.validFrom !== undefined) setObj.validFrom = body.validFrom ? new Date(body.validFrom) : null;
    if (body.validUntil !== undefined) setObj.validUntil = body.validUntil ? new Date(body.validUntil) : null;
    if (body.active !== undefined) setObj.active = body.active;

    const [row] = await db.update(coupons).set(setObj)
      .where(and(eq(coupons.id, Number(id)), eq(coupons.sellerId, session.sellerId)))
      .returning();

    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(row);
  } catch (error) {
    console.error("Coupon PUT error:", error);
    return NextResponse.json({ error: "Failed to update coupon" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromCookie();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const db = getDb();
    await db.delete(coupons)
      .where(and(eq(coupons.id, Number(id)), eq(coupons.sellerId, session.sellerId)));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Coupon DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete coupon" }, { status: 500 });
  }
}
