import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { promotions, flashSales, sellers } from "@/lib/schema";
import { eq, and, gte, lte, or, isNull } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    
    const db = getDb();
    
    // First get the seller by slug
    const [seller] = await db.select({ id: sellers.id })
      .from(sellers)
      .where(eq(sellers.slug, slug))
      .limit(1);
    
    if (!seller) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }
    
    const now = new Date();
    
    // Get active promotions
    const activePromotions = await db.select()
      .from(promotions)
      .where(
        and(
          eq(promotions.sellerId, seller.id),
          eq(promotions.active, true),
          or(
            isNull(promotions.validFrom),
            lte(promotions.validFrom, now)
          ),
          or(
            isNull(promotions.validUntil),
            gte(promotions.validUntil, now)
          )
        )
      )
      .orderBy(promotions.priority);
    
    // Get active flash sales
    const activeFlashSales = await db.select()
      .from(flashSales)
      .where(
        and(
          eq(flashSales.sellerId, seller.id),
          eq(flashSales.active, true),
          lte(flashSales.startTime, now),
          gte(flashSales.endTime, now),
          or(
            eq(flashSales.maxUses, -1), // unlimited
            gte(flashSales.maxUses, flashSales.usedCount) // has remaining uses
          )
        )
      )
      .orderBy(flashSales.endTime); // earliest ending first
    
    return NextResponse.json({
      promotions: activePromotions,
      flashSales: activeFlashSales
    });
    
  } catch (error) {
    console.error("Storefront promotions GET error:", error);
    return NextResponse.json({ error: "Failed to load promotions" }, { status: 500 });
  }
}