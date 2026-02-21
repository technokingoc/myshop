import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { catalogItems, productVariants } from "@/lib/schema";
import { eq, and, inArray, sql } from "drizzle-orm";
import { getSellerFromSession } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";

interface BulkAction {
  action: string;
  productIds: number[];
  data?: any;
}

export async function POST(request: NextRequest) {
  try {
    const sellerId = await getSellerFromSession(request);
    if (!sellerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: BulkAction = await request.json();
    const { action, productIds, data } = body;

    if (!productIds || productIds.length === 0) {
      return NextResponse.json({ error: "No products selected" }, { status: 400 });
    }

    // Verify all products belong to this seller
    const sellerProducts = await db
      .select({ id: catalogItems.id })
      .from(catalogItems)
      .where(and(
        eq(catalogItems.sellerId, sellerId),
        inArray(catalogItems.id, productIds)
      ));

    const validProductIds = sellerProducts.map(p => p.id);
    
    if (validProductIds.length !== productIds.length) {
      return NextResponse.json({ 
        error: "Some products don't belong to this seller" 
      }, { status: 403 });
    }

    let result;
    
    switch (action) {
      case 'adjust_price':
        result = await adjustPrices(sellerId, validProductIds, data);
        break;
      
      case 'assign_category':
        result = await assignCategory(sellerId, validProductIds, data);
        break;
        
      case 'publish':
        result = await updateStatus(sellerId, validProductIds, 'Published');
        break;
        
      case 'unpublish':
        result = await updateStatus(sellerId, validProductIds, 'Draft');
        break;
        
      case 'archive':
        result = await updateStatus(sellerId, validProductIds, 'Archived');
        break;
        
      case 'delete':
        result = await deleteProducts(sellerId, validProductIds);
        break;
        
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error("Bulk operation error:", error);
    return NextResponse.json(
      { error: "Failed to perform bulk operation" },
      { status: 500 }
    );
  }
}

async function adjustPrices(sellerId: number, productIds: number[], data: any) {
  const { action, type, value } = data;
  const jobId = uuidv4();
  
  if (!value || isNaN(parseFloat(value))) {
    throw new Error("Invalid price value");
  }

  const numValue = parseFloat(value);

  // Get current products with prices
  const products = await db
    .select({
      id: catalogItems.id,
      name: catalogItems.name,
      currentPrice: catalogItems.price
    })
    .from(catalogItems)
    .where(and(
      eq(catalogItems.sellerId, sellerId),
      inArray(catalogItems.id, productIds)
    ));

  const updates: Array<{ id: number; oldPrice: string; newPrice: string }> = [];

  for (const product of products) {
    const currentPrice = parseFloat(product.currentPrice || "0");
    let newPrice: number;

    switch (action) {
      case 'increase':
        if (type === 'percentage') {
          newPrice = currentPrice * (1 + numValue / 100);
        } else {
          newPrice = currentPrice + numValue;
        }
        break;
        
      case 'decrease':
        if (type === 'percentage') {
          newPrice = currentPrice * (1 - numValue / 100);
        } else {
          newPrice = currentPrice - numValue;
        }
        break;
        
      case 'set':
        newPrice = numValue;
        break;
        
      default:
        throw new Error("Invalid price action");
    }

    // Ensure price doesn't go below 0
    newPrice = Math.max(0, Math.round(newPrice * 100) / 100);

    updates.push({
      id: product.id,
      oldPrice: currentPrice.toFixed(2),
      newPrice: newPrice.toFixed(2)
    });
  }

  // Apply updates
  for (const update of updates) {
    await db
      .update(catalogItems)
      .set({ 
        price: update.newPrice
      })
      .where(eq(catalogItems.id, update.id));
  }

  // Store price history for undo functionality
  await storePriceHistory(sellerId, jobId, updates, data);

  return {
    success: true,
    updated: updates.length,
    jobId,
    changes: updates
  };
}

async function assignCategory(sellerId: number, productIds: number[], data: any) {
  const { category } = data;
  
  if (!category) {
    throw new Error("Category is required");
  }

  const result = await db
    .update(catalogItems)
    .set({ category })
    .where(and(
      eq(catalogItems.sellerId, sellerId),
      inArray(catalogItems.id, productIds)
    ));

  return {
    success: true,
    updated: productIds.length,
    category
  };
}

async function updateStatus(sellerId: number, productIds: number[], status: string) {
  await db
    .update(catalogItems)
    .set({ status })
    .where(and(
      eq(catalogItems.sellerId, sellerId),
      inArray(catalogItems.id, productIds)
    ));

  return {
    success: true,
    updated: productIds.length,
    status
  };
}

async function deleteProducts(sellerId: number, productIds: number[]) {
  // Delete variants first (cascade should handle this, but being explicit)
  await db
    .delete(productVariants)
    .where(inArray(productVariants.productId, productIds));

  // Delete products
  await db
    .delete(catalogItems)
    .where(and(
      eq(catalogItems.sellerId, sellerId),
      inArray(catalogItems.id, productIds)
    ));

  return {
    success: true,
    deleted: productIds.length
  };
}

async function storePriceHistory(
  sellerId: number, 
  jobId: string, 
  updates: Array<{ id: number; oldPrice: string; newPrice: string }>,
  changeData: any
) {
  // For now, store in a simple table structure
  // In a real implementation, you'd have a proper price_history table
  
  const historyData = {
    sellerId,
    jobId,
    changeType: changeData.type,
    changeAction: changeData.action,
    changeValue: changeData.value,
    updates,
    createdAt: new Date().toISOString(),
    canUndo: true
  };

  // Store in platform settings for now (would be better in a dedicated table)
  await db.execute(sql`
    INSERT INTO platform_settings (key, value) 
    VALUES (${`price_history_${jobId}`}, ${JSON.stringify(historyData)})
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
  `);
}