import { NextRequest, NextResponse } from "next/server";
import { recordStockChange } from "@/lib/inventory-service";
import { getSessionFromCookie } from "@/lib/session";
import { getDb } from "@/lib/db";
import { catalogItems, productVariants } from "@/lib/schema";
import { eq, inArray, and, sql } from "drizzle-orm";

type BulkUpdateItem = {
  id: number;
  type: 'product' | 'variant';
  newStock: number;
  reason?: string;
  notes?: string;
};

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sellerId = session.sellerId;
    if (!sellerId) {
      return NextResponse.json({ error: "No seller ID found" }, { status: 400 });
    }

    const body = await request.json();
    const { updates, reason = "Bulk update", notes = "" }: { 
      updates: BulkUpdateItem[], 
      reason?: string, 
      notes?: string 
    } = body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: "Updates array is required and must not be empty" },
        { status: 400 }
      );
    }

    const db = getDb();
    const results: Array<{ id: number; type: string; success: boolean; error?: string; newStock?: number }> = [];

    // Process updates in batches to avoid overwhelming the database
    const batchSize = 50;
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (update) => {
        try {
          // Validate update data
          if (typeof update.newStock !== 'number' || update.newStock < 0) {
            results.push({
              id: update.id,
              type: update.type,
              success: false,
              error: "Invalid stock quantity"
            });
            return;
          }

          // Get current stock
          let currentStock = 0;
          let itemExists = false;

          if (update.type === 'variant') {
            const [variant] = await db
              .select({ stockQuantity: productVariants.stockQuantity })
              .from(productVariants)
              .leftJoin(catalogItems, eq(productVariants.productId, catalogItems.id))
              .where(
                and(
                  eq(productVariants.id, update.id),
                  eq(catalogItems.sellerId, sellerId)
                )
              )
              .limit(1);

            if (variant) {
              currentStock = variant.stockQuantity || 0;
              itemExists = true;
            }
          } else {
            const [product] = await db
              .select({ stockQuantity: catalogItems.stockQuantity })
              .from(catalogItems)
              .where(
                and(
                  eq(catalogItems.id, update.id),
                  eq(catalogItems.sellerId, sellerId)
                )
              )
              .limit(1);

            if (product) {
              currentStock = product.stockQuantity || 0;
              itemExists = true;
            }
          }

          if (!itemExists) {
            results.push({
              id: update.id,
              type: update.type,
              success: false,
              error: `${update.type} not found or access denied`
            });
            return;
          }

          // Calculate the change needed
          const quantityChange = update.newStock - currentStock;

          // Only record a change if there's actually a difference
          if (quantityChange !== 0) {
            const result = await recordStockChange({
              sellerId,
              productId: update.type === 'product' ? update.id : undefined,
              variantId: update.type === 'variant' ? update.id : undefined,
              changeType: 'adjustment',
              quantityChange,
              reason: update.reason || reason,
              notes: update.notes || notes,
              createdBy: sellerId,
            });

            results.push({
              id: update.id,
              type: update.type,
              success: result.success,
              error: result.error,
              newStock: result.newStock
            });
          } else {
            // No change needed
            results.push({
              id: update.id,
              type: update.type,
              success: true,
              newStock: currentStock
            });
          }
        } catch (error) {
          console.error(`Error updating ${update.type} ${update.id}:`, error);
          results.push({
            id: update.id,
            type: update.type,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }));
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `Bulk update completed: ${successful} successful, ${failed} failed`,
      results,
      summary: {
        total: results.length,
        successful,
        failed
      }
    });
  } catch (error) {
    console.error("Bulk update API error:", error);
    return NextResponse.json(
      { error: "Failed to perform bulk update" },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch products/variants for bulk update interface
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sellerId = session.sellerId;
    if (!sellerId) {
      return NextResponse.json({ error: "No seller ID found" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    const db = getDb();

    // Get products
    const products = await db
      .select({
        id: catalogItems.id,
        name: catalogItems.name,
        stockQuantity: catalogItems.stockQuantity,
        lowStockThreshold: catalogItems.lowStockThreshold,
        // catalogItems doesn't have sku field
        price: catalogItems.price,
        trackInventory: catalogItems.trackInventory,
        hasVariants: catalogItems.hasVariants,
      })
      .from(catalogItems)
      .where(
        and(
          eq(catalogItems.sellerId, sellerId),
          eq(catalogItems.status, 'Published'),
          eq(catalogItems.trackInventory, true),
          search ? sql`LOWER(${catalogItems.name}) LIKE ${'%' + search.toLowerCase() + '%'}` : undefined
        )
      )
      .limit(limit)
      .offset(offset);

    // Get variants for products that have them
    const productIds = products
      .filter(p => p.hasVariants)
      .map(p => p.id);

    let variants: any[] = [];
    if (productIds.length > 0) {
      variants = await db
        .select({
          id: productVariants.id,
          productId: productVariants.productId,
          name: productVariants.name,
          stockQuantity: productVariants.stockQuantity,
          lowStockThreshold: productVariants.lowStockThreshold,
          sku: productVariants.sku,
          price: productVariants.price,
          productName: catalogItems.name,
        })
        .from(productVariants)
        .leftJoin(catalogItems, eq(productVariants.productId, catalogItems.id))
        .where(
          and(
            inArray(productVariants.productId, productIds),
            eq(productVariants.active, true)
          )
        );
    }

    // Combine and format results
    const items = [
      // Products without variants
      ...products
        .filter(p => !p.hasVariants)
        .map(p => ({
          id: p.id,
          type: 'product' as const,
          name: p.name,
          sku: '',
          currentStock: p.stockQuantity || 0,
          threshold: p.lowStockThreshold || 5,
          price: p.price ? parseFloat(p.price) : 0,
        })),
      
      // Variants
      ...variants.map(v => ({
        id: v.id,
        type: 'variant' as const,
        name: v.productName || 'Product',
        variantName: v.name,
        sku: v.sku || '',
        currentStock: v.stockQuantity || 0,
        threshold: v.lowStockThreshold || 5,
        price: v.price ? parseFloat(v.price) : 0,
      }))
    ];

    return NextResponse.json(items);
  } catch (error) {
    console.error("Get bulk update items API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch items for bulk update" },
      { status: 500 }
    );
  }
}