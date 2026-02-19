import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { flashSales } from "@/lib/schema";
import { eq, and, gte, lte, or } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const { sellerId, orderTotal, productIds = [] } = await request.json();
    
    if (!sellerId || orderTotal === undefined) {
      return NextResponse.json({ 
        valid: false, 
        error: "Missing required fields" 
      }, { status: 400 });
    }
    
    const db = getDb();
    const now = new Date();
    
    // Find active flash sales for this seller
    const activeFlashSales = await db.select()
      .from(flashSales)
      .where(
        and(
          eq(flashSales.sellerId, sellerId),
          eq(flashSales.active, true),
          lte(flashSales.startTime, now),
          gte(flashSales.endTime, now),
          or(
            eq(flashSales.maxUses, -1), // unlimited
            gte(flashSales.maxUses, flashSales.usedCount) // has remaining uses
          )
        )
      )
      .orderBy(flashSales.endTime); // prioritize sales ending sooner
    
    if (activeFlashSales.length === 0) {
      return NextResponse.json({ 
        valid: false, 
        error: "No active flash sales" 
      });
    }
    
    // Find the best applicable flash sale
    let bestSale = null;
    let bestDiscount = 0;
    
    for (const sale of activeFlashSales) {
      // Check minimum order amount
      if (sale.minOrderAmount && orderTotal < Number(sale.minOrderAmount)) {
        continue;
      }
      
      // Check if sale applies to specific products
      if (sale.products) {
        const saleProductIds = sale.products.split(',').map(id => parseInt(id.trim())).filter(Boolean);
        if (saleProductIds.length > 0) {
          const hasValidProduct = saleProductIds.some(id => productIds.includes(id));
          if (!hasValidProduct) {
            continue;
          }
        }
      }
      
      // Calculate discount for this sale
      let discount = 0;
      if (sale.discountType === 'percentage') {
        discount = orderTotal * (Number(sale.discountValue) / 100);
        // Apply max discount limit if set
        if (sale.maxDiscount && Number(sale.maxDiscount) > 0) {
          discount = Math.min(discount, Number(sale.maxDiscount));
        }
      } else {
        discount = Number(sale.discountValue);
      }
      
      // Don't allow discount to exceed order total
      discount = Math.min(discount, orderTotal);
      
      // Keep track of the best discount
      if (discount > bestDiscount) {
        bestDiscount = discount;
        bestSale = sale;
      }
    }
    
    if (!bestSale || bestDiscount === 0) {
      return NextResponse.json({ 
        valid: false, 
        error: "No applicable flash sales found" 
      });
    }
    
    return NextResponse.json({
      valid: true,
      flashSale: {
        id: bestSale.id,
        name: bestSale.name,
        discountType: bestSale.discountType,
        discountValue: bestSale.discountValue,
        endTime: bestSale.endTime
      },
      discount: bestDiscount,
      appliedAutomatically: true
    });
    
  } catch (error) {
    console.error('Flash sale validation error:', error);
    return NextResponse.json(
      { valid: false, error: "Failed to validate flash sale" },
      { status: 500 }
    );
  }
}