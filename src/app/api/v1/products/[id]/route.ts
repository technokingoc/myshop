import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { catalogItems, sellers, productVariants } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { authenticateApiRequest, API_PERMISSIONS } from "@/lib/api-keys";

// GET /api/v1/products/[id] - Get single product
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await authenticateApiRequest(request, API_PERMISSIONS.PRODUCTS_READ);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const productId = parseInt(params.id, 10);
    if (isNaN(productId)) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const includeVariants = searchParams.get("include_variants") === "true";

    const db = getDb();
    
    // Build conditions
    const conditions = [eq(catalogItems.id, productId)];
    if (auth.sellerId) {
      conditions.push(eq(catalogItems.sellerId, auth.sellerId));
    }

    // Get product
    const productResult = await db
      .select({
        id: catalogItems.id,
        name: catalogItems.name,
        type: catalogItems.type,
        price: catalogItems.price,
        compareAtPrice: catalogItems.compareAtPrice,
        status: catalogItems.status,
        imageUrl: catalogItems.imageUrl,
        imageUrls: catalogItems.imageUrls,
        shortDescription: catalogItems.shortDescription,
        category: catalogItems.category,
        stockQuantity: catalogItems.stockQuantity,
        trackInventory: catalogItems.trackInventory,
        lowStockThreshold: catalogItems.lowStockThreshold,
        hasVariants: catalogItems.hasVariants,
        moderationStatus: catalogItems.moderationStatus,
        flaggedReason: catalogItems.flaggedReason,
        createdAt: catalogItems.createdAt,
        sellerId: catalogItems.sellerId,
        sellerName: sellers.name,
        sellerSlug: sellers.slug,
      })
      .from(catalogItems)
      .leftJoin(sellers, eq(catalogItems.sellerId, sellers.id))
      .where(and(...conditions))
      .limit(1);

    if (!productResult.length) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    let product = productResult[0];

    // Get variants if requested
    if (includeVariants && product.hasVariants) {
      const variants = await db
        .select()
        .from(productVariants)
        .where(eq(productVariants.productId, productId))
        .orderBy(productVariants.sortOrder);

      product = { ...product, variants };
    }

    return NextResponse.json({ data: product });
    
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

// PUT /api/v1/products/[id] - Update product
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await authenticateApiRequest(request, API_PERMISSIONS.PRODUCTS_WRITE);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  if (!auth.sellerId) {
    return NextResponse.json({ error: "Seller ID required" }, { status: 400 });
  }

  try {
    const productId = parseInt(params.id, 10);
    if (isNaN(productId)) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
    }

    const body = await request.json();
    const db = getDb();

    // Check if product exists and belongs to seller
    const existingProduct = await db
      .select({ id: catalogItems.id })
      .from(catalogItems)
      .where(and(
        eq(catalogItems.id, productId),
        eq(catalogItems.sellerId, auth.sellerId)
      ))
      .limit(1);

    if (!existingProduct.length) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {};
    const allowedFields = [
      'name', 'type', 'price', 'compareAtPrice', 'status', 'imageUrl', 
      'imageUrls', 'shortDescription', 'category', 'stockQuantity', 
      'trackInventory', 'lowStockThreshold', 'hasVariants'
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Convert numeric fields to strings for database
    if (updateData.price !== undefined) {
      updateData.price = updateData.price.toString();
    }
    if (updateData.compareAtPrice !== undefined) {
      updateData.compareAtPrice = updateData.compareAtPrice.toString();
    }

    // Update product
    const updatedProduct = await db
      .update(catalogItems)
      .set(updateData)
      .where(eq(catalogItems.id, productId))
      .returning({
        id: catalogItems.id,
        name: catalogItems.name,
        price: catalogItems.price,
        status: catalogItems.status,
        createdAt: catalogItems.createdAt,
      });

    // Handle variants if provided
    if (body.variants && Array.isArray(body.variants)) {
      // Delete existing variants
      await db
        .delete(productVariants)
        .where(eq(productVariants.productId, productId));

      // Create new variants
      if (body.variants.length > 0) {
        const variantData = body.variants.map((variant: any, index: number) => ({
          productId,
          name: variant.name || `Variant ${index + 1}`,
          sku: variant.sku || "",
          price: variant.price?.toString() || updateData.price || "0",
          compareAtPrice: variant.compareAtPrice?.toString() || "0",
          stockQuantity: variant.stockQuantity || 0,
          lowStockThreshold: variant.lowStockThreshold || 5,
          imageUrl: variant.imageUrl || "",
          attributes: variant.attributes || {},
          sortOrder: variant.sortOrder || index,
          active: variant.active !== false,
        }));

        await db.insert(productVariants).values(variantData);
      }
    }

    return NextResponse.json({
      data: updatedProduct[0],
      message: "Product updated successfully"
    });
    
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/products/[id] - Delete product
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await authenticateApiRequest(request, API_PERMISSIONS.PRODUCTS_WRITE);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  if (!auth.sellerId) {
    return NextResponse.json({ error: "Seller ID required" }, { status: 400 });
  }

  try {
    const productId = parseInt(params.id, 10);
    if (isNaN(productId)) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
    }

    const db = getDb();

    // Check if product exists and belongs to seller
    const existingProduct = await db
      .select({ id: catalogItems.id })
      .from(catalogItems)
      .where(and(
        eq(catalogItems.id, productId),
        eq(catalogItems.sellerId, auth.sellerId)
      ))
      .limit(1);

    if (!existingProduct.length) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Delete product (variants will be deleted due to CASCADE)
    await db
      .delete(catalogItems)
      .where(eq(catalogItems.id, productId));

    return NextResponse.json({
      message: "Product deleted successfully"
    });
    
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}