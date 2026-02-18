import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { coupons } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const { code, sellerId, orderTotal } = await req.json();

    if (!code || !sellerId) {
      return NextResponse.json({ valid: false, error: "code and sellerId required" }, { status: 400 });
    }

    const [coupon] = await db.select().from(coupons)
      .where(and(
        eq(coupons.sellerId, Number(sellerId)),
        eq(coupons.code, code.toUpperCase().trim()),
        eq(coupons.active, true),
      ));

    if (!coupon) {
      return NextResponse.json({ valid: false, error: "Invalid coupon code" });
    }

    // Check expiry
    const now = new Date();
    if (coupon.validFrom && new Date(coupon.validFrom) > now) {
      return NextResponse.json({ valid: false, error: "Coupon not yet active" });
    }
    if (coupon.validUntil && new Date(coupon.validUntil) < now) {
      return NextResponse.json({ valid: false, error: "Coupon expired" });
    }

    // Check max uses
    if (coupon.maxUses !== null && coupon.maxUses !== -1 && (coupon.usedCount ?? 0) >= coupon.maxUses) {
      return NextResponse.json({ valid: false, error: "Coupon usage limit reached" });
    }

    // Check min order amount
    const total = Number(orderTotal || 0);
    const minAmount = Number(coupon.minOrderAmount || 0);
    if (minAmount > 0 && total < minAmount) {
      return NextResponse.json({ valid: false, error: `Minimum order amount: ${minAmount}` });
    }

    // Calculate discount
    let discount = 0;
    if (coupon.type === "percentage") {
      discount = total * (Number(coupon.value) / 100);
    } else {
      discount = Math.min(Number(coupon.value), total);
    }
    discount = Math.round(discount * 100) / 100;

    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
      },
      discount,
    });
  } catch (error) {
    console.error("Coupon validate error:", error);
    return NextResponse.json({ valid: false, error: "Validation failed" }, { status: 500 });
  }
}
