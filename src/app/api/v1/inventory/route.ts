import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { catalogItems, productVariants, stockHistory, sellers } from "@/lib/schema";
import { eq, and, desc, asc, lte, sql } from "drizzle-orm";
import { authenticateApiRequest, API_PERMISSIONS } from "@/lib/api-keys";

// GET /api/v1/inventory - Get inventory levels
export async function GET(request: NextRequest) {
  const auth = await authenticateApiRequest(request, API_PERMISSIONS.INVENTORY_READ);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
    const offset = (page - 1) * limit;
    
    const lowStock = searchParams.get("low_stock") === "true";
    const outOfStock = searchParams.get("out_of_stock") === "true";
    const category = searchParams.get("category");
    const trackingOnly = searchParams.get("tracking_only") === "true";
    const sortBy = searchParams.get("sort_by") || "name";
    const sortOrder = searchParams.get("sort_order") || "asc";

    const db = getDb();
    
    // Build conditions
    const conditions: any[] = [];
    
    // Filter by seller
    if (auth.sellerId) {
      conditions.push(eq(catalogItems.sellerId, auth.sellerId));
    }
    
    if (category) {
      conditions.push(eq(catalogItems.category, category));
    }
    
    if (trackingOnly) {
      conditions.push(eq(catalogItems.trackInventory, true));
    }

    // Low stock condition
    if (lowStock) {
      conditions.push(
        sql`${catalogItems.stockQuantity} > 0 AND ${catalogItems.stockQuantity} <= ${catalogItems.lowStockThreshold}`
      );
    }

    // Out of stock condition
    if (outOfStock) {
      conditions.push(eq(catalogItems.stockQuantity, 0));
    }

    // Determine sort order
    const orderBy = sortOrder === "asc" ? asc : desc;
    let sortColumn;
    switch (sortBy) {
      case "stock_quantity":
        sortColumn = orderBy(catalogItems.stockQuantity);
        break;
      case "category":
        sortColumn = orderBy(catalogItems.category);
        break;
      case "created_at":
        sortColumn = orderBy(catalogItems.createdAt);
        break;
      default:
        sortColumn = orderBy(catalogItems.name);
    }

    // Get products with inventory info
    const inventoryQuery = db
      .select({
        id: catalogItems.id,
        name: catalogItems.name,
        category: catalogItems.category,
        price: catalogItems.price,
        stockQuantity: catalogItems.stockQuantity,
        lowStockThreshold: catalogItems.lowStockThreshold,
        trackInventory: catalogItems.trackInventory,
        hasVariants: catalogItems.hasVariants,
        status: catalogItems.status,
        imageUrl: catalogItems.imageUrl,
        createdAt: catalogItems.createdAt,
        sellerId: catalogItems.sellerId,
        sellerName: sellers.name,
      })
      .from(catalogItems)
      .leftJoin(sellers, eq(catalogItems.sellerId, sellers.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(sortColumn)
      .limit(limit)
      .offset(offset);

    const inventory = await inventoryQuery;

    // Get variants for products that have them
    const productIds = inventory.filter(item => item.hasVariants).map(item => item.id);
    let variants: any[] = [];
    
    if (productIds.length > 0) {
      variants = await db
        .select({
          id: productVariants.id,
          productId: productVariants.productId,
          name: productVariants.name,
          sku: productVariants.sku,
          stockQuantity: productVariants.stockQuantity,
          lowStockThreshold: productVariants.lowStockThreshold,
          active: productVariants.active,
          attributes: productVariants.attributes,
        })
        .from(productVariants)
        .where(sql`${productVariants.productId} = ANY(${productIds})`)
        .orderBy(productVariants.sortOrder);
    }

    // Combine inventory data with variants
    const inventoryWithVariants = inventory.map(item => {
      const itemVariants = variants.filter(v => v.productId === item.id);
      
      return {
        ...item,
        variants: item.hasVariants ? itemVariants : null,
        totalStock: item.hasVariants 
          ? itemVariants.reduce((sum, v) => sum + (v.stockQuantity || 0), 0)
          : item.stockQuantity,
        lowStock: item.hasVariants
          ? itemVariants.some(v => v.stockQuantity <= v.lowStockThreshold)
          : item.stockQuantity <= item.lowStockThreshold && item.stockQuantity > 0,
        outOfStock: item.hasVariants
          ? itemVariants.every(v => v.stockQuantity === 0)
          : item.stockQuantity === 0,
      };
    });

    // Get total count for pagination
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(catalogItems)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const total = countResult[0]?.count || 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      data: inventoryWithVariants,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
    
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory" },
      { status: 500 }
    );
  }
}

// POST /api/v1/inventory/bulk-update - Bulk update stock levels
export async function POST(request: NextRequest) {
  const auth = await authenticateApiRequest(request, API_PERMISSIONS.INVENTORY_WRITE);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  if (!auth.sellerId) {
    return NextResponse.json({ error: "Seller ID required" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { updates, reason = "Bulk update via API" } = body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: "Updates array is required" },
        { status: 400 }
      );
    }

    const db = getDb();
    const results = [];
    const errors = [];

    // Process each update
    for (const update of updates) {
      try {
        const { productId, variantId, stockQuantity, lowStockThreshold } = update;

        if (!productId) {
          errors.push({ update, error: "Product ID is required" });
          continue;
        }

        // Validate ownership
        const product = await db
          .select({ id: catalogItems.id, name: catalogItems.name, currentStock: catalogItems.stockQuantity })
          .from(catalogItems)
          .where(and(
            eq(catalogItems.id, productId),
            eq(catalogItems.sellerId, auth.sellerId)
          ))
          .limit(1);

        if (!product.length) {
          errors.push({ update, error: "Product not found or not owned by seller" });
          continue;
        }

        if (variantId) {
          // Update variant stock
          const variant = await db
            .select({ id: productVariants.id, stockQuantity: productVariants.stockQuantity })
            .from(productVariants)
            .where(and(
              eq(productVariants.id, variantId),
              eq(productVariants.productId, productId)
            ))
            .limit(1);

          if (!variant.length) {
            errors.push({ update, error: "Variant not found" });
            continue;
          }

          const updateData: any = {};
          if (stockQuantity !== undefined) updateData.stockQuantity = stockQuantity;
          if (lowStockThreshold !== undefined) updateData.lowStockThreshold = lowStockThreshold;

          await db
            .update(productVariants)
            .set(updateData)
            .where(eq(productVariants.id, variantId));

          // Record stock history for variant
          if (stockQuantity !== undefined) {
            await db.insert(stockHistory).values({
              sellerId: auth.sellerId,
              productId,
              variantId,
              changeType: 'adjustment',
              quantityBefore: variant[0].stockQuantity,
              quantityChange: stockQuantity - variant[0].stockQuantity,
              quantityAfter: stockQuantity,
              reason,
              createdBy: auth.userId,
            });
          }

          results.push({ productId, variantId, success: true });
        } else {
          // Update product stock
          const updateData: any = {};
          if (stockQuantity !== undefined) updateData.stockQuantity = stockQuantity;
          if (lowStockThreshold !== undefined) updateData.lowStockThreshold = lowStockThreshold;

          await db
            .update(catalogItems)
            .set(updateData)
            .where(eq(catalogItems.id, productId));

          // Record stock history for product
          if (stockQuantity !== undefined) {
            await db.insert(stockHistory).values({
              sellerId: auth.sellerId,
              productId,
              changeType: 'adjustment',
              quantityBefore: product[0].currentStock,
              quantityChange: stockQuantity - product[0].currentStock,
              quantityAfter: stockQuantity,
              reason,
              createdBy: auth.userId,
            });
          }

          results.push({ productId, success: true });
        }
      } catch (updateError) {
        console.error("Update error:", updateError);
        errors.push({ 
          update, 
          error: updateError instanceof Error ? updateError.message : "Unknown error" 
        });
      }
    }

    return NextResponse.json({
      message: "Bulk update completed",
      results,
      errors,
      summary: {
        total: updates.length,
        successful: results.length,
        failed: errors.length,
      }
    });
    
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Failed to perform bulk update" },
      { status: 500 }
    );
  }
}