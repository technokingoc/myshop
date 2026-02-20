import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { catalogItems, productVariants, orders, restockReminders } from "@/lib/schema";
import { eq, and, desc, gte, sql, isNull, or } from "drizzle-orm";
import { getSellerFromSession } from "@/lib/auth";

type RestockSuggestion = {
  id: number;
  productId: number;
  variantId?: number;
  productName: string;
  variantName?: string;
  currentStock: number;
  suggestedQuantity: number;
  salesVelocity: number;
  daysOfStock: number;
  priority: 'high' | 'medium' | 'low';
  estimatedCost?: number;
  supplier?: string;
};

export async function GET(req: NextRequest) {
  try {
    const sellerId = await getSellerFromSession(req);
    if (!sellerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();
    
    // Get products that need restocking based on current stock and sales velocity
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get low stock products with sales data
    const lowStockProducts = await db
      .select({
        id: catalogItems.id,
        name: catalogItems.name,
        stockQuantity: catalogItems.stockQuantity,
        lowStockThreshold: catalogItems.lowStockThreshold,
        hasVariants: catalogItems.hasVariants,
      })
      .from(catalogItems)
      .where(
        and(
          eq(catalogItems.sellerId, sellerId),
          eq(catalogItems.status, "Published"),
          eq(catalogItems.trackInventory, true),
          eq(catalogItems.hasVariants, false), // Only standalone products for now
          sql`${catalogItems.stockQuantity} <= ${catalogItems.lowStockThreshold} * 2` // Products at 2x threshold or below
        )
      )
      .orderBy(catalogItems.stockQuantity);

    // Get low stock variants
    const lowStockVariants = await db
      .select({
        id: productVariants.id,
        productId: productVariants.productId,
        name: productVariants.name,
        productName: catalogItems.name,
        stockQuantity: productVariants.stockQuantity,
        lowStockThreshold: productVariants.lowStockThreshold,
      })
      .from(productVariants)
      .leftJoin(catalogItems, eq(productVariants.productId, catalogItems.id))
      .where(
        and(
          eq(catalogItems.sellerId, sellerId),
          eq(catalogItems.status, "Published"),
          eq(productVariants.active, true),
          sql`${productVariants.stockQuantity} <= ${productVariants.lowStockThreshold} * 2`
        )
      )
      .orderBy(productVariants.stockQuantity);

    // Get existing restock reminders for supplier info
    const existingReminders = await db
      .select({
        productId: restockReminders.productId,
        variantId: restockReminders.variantId,
        supplierName: restockReminders.supplierName,
        targetQuantity: restockReminders.targetQuantity,
        leadTimeDays: restockReminders.leadTimeDays,
      })
      .from(restockReminders)
      .where(eq(restockReminders.sellerId, sellerId));

    const reminderMap = new Map();
    existingReminders.forEach(reminder => {
      const key = reminder.variantId ? `variant_${reminder.variantId}` : `product_${reminder.productId}`;
      reminderMap.set(key, reminder);
    });

    // Calculate suggestions
    const suggestions: RestockSuggestion[] = [];

    // Process standalone products
    for (const product of lowStockProducts) {
      const reminderKey = `product_${product.id}`;
      const reminder = reminderMap.get(reminderKey);
      
      // Calculate sales velocity (simplified - in reality, you'd query actual order data)
      const salesVelocity = Math.max(0.1, Math.random() * 5); // Mock: 0.1-5 units per day
      const currentStock = product.stockQuantity || 0;
      const threshold = product.lowStockThreshold || 5;
      
      // Calculate days of stock remaining
      const daysOfStock = Math.floor(currentStock / salesVelocity);
      
      // Calculate suggested quantity (enough for 30 days + safety stock)
      const suggestedQuantity = reminder?.targetQuantity || 
                               Math.max(threshold * 2, Math.ceil(salesVelocity * 30));
      
      // Determine priority
      let priority: 'high' | 'medium' | 'low' = 'medium';
      if (currentStock === 0) {
        priority = 'high';
      } else if (daysOfStock <= 7) {
        priority = 'high';
      } else if (daysOfStock <= 14) {
        priority = 'medium';
      } else {
        priority = 'low';
      }

      suggestions.push({
        id: product.id,
        productId: product.id,
        productName: product.name,
        currentStock,
        suggestedQuantity,
        salesVelocity: Math.round(salesVelocity * 10) / 10, // Round to 1 decimal
        daysOfStock,
        priority,
        supplier: reminder?.supplierName || undefined,
        estimatedCost: suggestedQuantity * 10 + Math.random() * 20, // Mock cost
      });
    }

    // Process variants
    for (const variant of lowStockVariants) {
      const reminderKey = `variant_${variant.id}`;
      const reminder = reminderMap.get(reminderKey);
      
      const salesVelocity = Math.max(0.1, Math.random() * 3);
      const currentStock = variant.stockQuantity || 0;
      const threshold = variant.lowStockThreshold || 5;
      
      const daysOfStock = Math.floor(currentStock / salesVelocity);
      const suggestedQuantity = reminder?.targetQuantity || 
                               Math.max(threshold * 2, Math.ceil(salesVelocity * 30));
      
      let priority: 'high' | 'medium' | 'low' = 'medium';
      if (currentStock === 0) {
        priority = 'high';
      } else if (daysOfStock <= 7) {
        priority = 'high';
      } else if (daysOfStock <= 14) {
        priority = 'medium';
      } else {
        priority = 'low';
      }

      suggestions.push({
        id: variant.id,
        productId: variant.productId,
        variantId: variant.id,
        productName: variant.productName || 'Product',
        variantName: variant.name,
        currentStock,
        suggestedQuantity,
        salesVelocity: Math.round(salesVelocity * 10) / 10,
        daysOfStock,
        priority,
        supplier: reminder?.supplierName || undefined,
        estimatedCost: suggestedQuantity * 8 + Math.random() * 15,
      });
    }

    // Sort by priority and days of stock
    suggestions.sort((a, b) => {
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      if (priorityWeight[a.priority] !== priorityWeight[b.priority]) {
        return priorityWeight[b.priority] - priorityWeight[a.priority];
      }
      return a.daysOfStock - b.daysOfStock;
    });

    return NextResponse.json({
      success: true,
      data: suggestions.slice(0, 20), // Limit to top 20 suggestions
    });

  } catch (error) {
    console.error("Failed to get restock suggestions:", error);
    return NextResponse.json(
      { error: "Failed to get restock suggestions" },
      { status: 500 }
    );
  }
}