import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { coupons } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { getSessionFromCookie } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = getDb();
    const rows = await db.select().from(coupons).where(eq(coupons.sellerId, session.sellerId));
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Coupons GET error:", error);
    return NextResponse.json({ error: "Failed to load coupons" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = getDb();
    const body = await req.json();
    const { code, type, value, minOrderAmount, maxUses, validFrom, validUntil } = body;

    if (!code || !value) {
      return NextResponse.json({ error: "code and value are required" }, { status: 400 });
    }

    const [row] = await db.insert(coupons).values({
      sellerId: session.sellerId,
      code: code.toUpperCase().trim(),
      type: type || "percentage",
      value: String(value),
      minOrderAmount: String(minOrderAmount || 0),
      maxUses: maxUses ?? -1,
      validFrom: validFrom ? new Date(validFrom) : new Date(),
      validUntil: validUntil ? new Date(validUntil) : null,
      active: true,
    }).returning();

    return NextResponse.json(row, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "";
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return NextResponse.json({ error: "Coupon code already exists" }, { status: 409 });
    }
    console.error("Coupons POST error:", error);
    return NextResponse.json({ error: "Failed to create coupon" }, { status: 500 });
  }
}
