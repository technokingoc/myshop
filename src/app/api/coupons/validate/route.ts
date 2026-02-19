import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { coupons } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const { code, sellerId, orderTotal } = await request.json();
    
    if (!code || !sellerId || orderTotal === undefined) {
      return NextResponse.json({ 
        valid: false, 
        error: "Missing required fields" 
      }, { status: 400 });
    }
    
    const db = getDb();
    
    // Find the coupon
    const couponQuery = await db.select()
      .from(coupons)
      .where(
        and(
          eq(coupons.code, code.trim().toUpperCase()),
          eq(coupons.sellerId, sellerId),
          eq(coupons.active, true)
        )
      )
      .limit(1);
    
    if (couponQuery.length === 0) {
      return NextResponse.json({ 
        valid: false, 
        error: "Invalid coupon code" 
      });
    }
    
    const coupon = couponQuery[0];
    
    // Check validity period
    const now = new Date();
    
    if (coupon.validFrom && new Date(coupon.validFrom) > now) {
      return NextResponse.json({ 
        valid: false, 
        error: "Coupon is not yet valid" 
      });
    }
    
    if (coupon.validUntil && new Date(coupon.validUntil) < now) {
      return NextResponse.json({ 
        valid: false, 
        error: "Coupon has expired" 
      });
    }
    
    // Check minimum order amount
    if (coupon.minOrderAmount && orderTotal < Number(coupon.minOrderAmount)) {
      return NextResponse.json({ 
        valid: false, 
        error: `Minimum order amount of ${coupon.minOrderAmount} required` 
      });
    }
    
    // Check usage limits
    const usedCount = coupon.usedCount || 0;
    const maxUses = coupon.maxUses || -1;
    if (maxUses !== -1 && usedCount >= maxUses) {
      return NextResponse.json({ 
        valid: false, 
        error: "Coupon usage limit reached" 
      });
    }
    
    // Calculate discount
    let discount = 0;
    if (coupon.type === 'percentage') {
      discount = orderTotal * (Number(coupon.value) / 100);
    } else {
      discount = Number(coupon.value);
    }
    
    // Don't allow discount to exceed order total
    discount = Math.min(discount, orderTotal);
    
    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value
      },
      discount: discount
    });
    
  } catch (error) {
    console.error('Coupon validation error:', error);
    return NextResponse.json(
      { valid: false, error: "Failed to validate coupon" },
      { status: 500 }
    );
  }
}