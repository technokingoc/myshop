import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { catalogItems, productVariants, stockHistory } from "@/lib/schema";
import { eq, and, sql, desc, gte } from "drizzle-orm";
import { getSellerFromSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const sellerId = await getSellerFromSession(req);
    if (!sellerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();
    
    // Get current period (last 30 days for trend calculation)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Get products with their stock status
    const products = await db
      .select({
        id: catalogItems.id,
        stockQuantity: catalogItems.stockQuantity,
        lowStockThreshold: catalogItems.lowStockThreshold,
        trackInventory: catalogItems.trackInventory,
        hasVariants: catalogItems.hasVariants,
        status: catalogItems.status,
      })
      .from(catalogItems)
      .where(
        and(
          eq(catalogItems.sellerId, sellerId),
          eq(catalogItems.status, "Published"),
          eq(catalogItems.trackInventory, true)
        )
      );

    // Get variants with their stock status
    const variants = await db
      .select({
        id: productVariants.id,
        productId: productVariants.productId,
        stockQuantity: productVariants.stockQuantity,
        lowStockThreshold: productVariants.lowStockThreshold,
        active: productVariants.active,
      })
      .from(productVariants)
      .leftJoin(catalogItems, eq(productVariants.productId, catalogItems.id))
      .where(
        and(
          eq(catalogItems.sellerId, sellerId),
          eq(catalogItems.status, "Published"),
          eq(productVariants.active, true)
        )
      );

    // Calculate current statistics
    let total = 0;
    let healthy = 0;
    let atRisk = 0;
    let outOfStock = 0;

    // Process standalone products (no variants)
    for (const product of products) {
      if (!product.hasVariants) {
        total++;
        const stock = product.stockQuantity || 0;
        const threshold = product.lowStockThreshold || 5;
        
        if (stock === 0) {
          outOfStock++;
        } else if (stock <= threshold) {
          atRisk++;
        } else {
          healthy++;
        }
      }
    }

    // Process variants
    for (const variant of variants) {
      total++;
      const stock = variant.stockQuantity || 0;
      const threshold = variant.lowStockThreshold || 5;
      
      if (stock === 0) {
        outOfStock++;
      } else if (stock <= threshold) {
        atRisk++;
      } else {
        healthy++;
      }
    }

    // Calculate trends (simplified - compare with 30 days ago)
    // For now, we'll use mock trend data - in a real implementation, 
    // you'd query historical data or maintain trend metrics
    const trends = {
      healthyTrend: Math.floor(Math.random() * 20 - 10), // -10 to +10
      atRiskTrend: Math.floor(Math.random() * 10 - 5),   // -5 to +5
      outOfStockTrend: Math.floor(Math.random() * 6 - 3), // -3 to +3
    };

    const overview = {
      total,
      healthy,
      atRisk,
      outOfStock,
      trends,
    };

    return NextResponse.json({
      success: true,
      data: overview,
    });

  } catch (error) {
    console.error("Failed to get stock overview:", error);
    return NextResponse.json(
      { error: "Failed to get stock overview" },
      { status: 500 }
    );
  }
}