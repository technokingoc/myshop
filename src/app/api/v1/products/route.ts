import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { catalogItems, sellers, stores, productVariants } from "@/lib/schema";
import { eq, and, desc, asc, gte, lte, ilike, sql } from "drizzle-orm";
import { authenticateApiRequest, API_PERMISSIONS } from "@/lib/api-keys";

// GET /api/v1/products - List products
export async function GET(request: NextRequest) {
  const auth = await authenticateApiRequest(request, API_PERMISSIONS.PRODUCTS_READ);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
    const offset = (page - 1) * limit;
    
    const status = searchParams.get("status") || "Published";
    const category = searchParams.get("category");
    const name = searchParams.get("name");
    const minPrice = searchParams.get("min_price");
    const maxPrice = searchParams.get("max_price");
    const sortBy = searchParams.get("sort_by") || "created_at";
    const sortOrder = searchParams.get("sort_order") || "desc";
    const includeVariants = searchParams.get("include_variants") === "true";

    const db = getDb();
    
    // Build conditions
    const conditions: any[] = [eq(catalogItems.status, status)];
    
    // Filter by seller/user
    if (auth.sellerId) {
      conditions.push(eq(catalogItems.sellerId, auth.sellerId));
    }
    
    if (category) {
      conditions.push(eq(catalogItems.category, category));
    }
    
    if (name) {
      conditions.push(ilike(catalogItems.name, `%${name}%`));
    }
    
    if (minPrice) {
      conditions.push(gte(catalogItems.price, minPrice));
    }
    
    if (maxPrice) {
      conditions.push(lte(catalogItems.price, maxPrice));
    }

    // Determine sort order
    const orderBy = sortOrder === "asc" ? asc : desc;
    let sortColumn;
    switch (sortBy) {
      case "name":
        sortColumn = orderBy(catalogItems.name);
        break;
      case "price":
        sortColumn = orderBy(catalogItems.price);
        break;
      case "updated_at":
        sortColumn = orderBy(catalogItems.createdAt); // catalogItems doesn't have updatedAt
        break;
      default:
        sortColumn = orderBy(catalogItems.createdAt);
    }

    // Get products
    const productsQuery = db
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
        createdAt: catalogItems.createdAt,
        sellerId: catalogItems.sellerId,
        sellerName: sellers.name,
        sellerSlug: sellers.slug,
      })
      .from(catalogItems)
      .leftJoin(sellers, eq(catalogItems.sellerId, sellers.id))
      .where(and(...conditions))
      .orderBy(sortColumn)
      .limit(limit)
      .offset(offset);

    const products = await productsQuery;

    // Get variants if requested
    let productsWithVariants = products;
    if (includeVariants) {
      const productIds = products.map(p => p.id);
      const variants = productIds.length > 0 
        ? await db
            .select()
            .from(productVariants)
            .where(sql`${productVariants.productId} = ANY(${productIds})`)
        : [];

      productsWithVariants = products.map(product => ({
        ...product,
        variants: variants.filter(v => v.productId === product.id)
      }));
    }

    // Get total count for pagination
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(catalogItems)
      .leftJoin(sellers, eq(catalogItems.sellerId, sellers.id))
      .where(and(...conditions));

    const total = countResult[0]?.count || 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      data: productsWithVariants,
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
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// POST /api/v1/products - Create product
export async function POST(request: NextRequest) {
  const auth = await authenticateApiRequest(request, API_PERMISSIONS.PRODUCTS_WRITE);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  if (!auth.sellerId) {
    return NextResponse.json({ error: "Seller ID required" }, { status: 400 });
  }

  try {
    const body = await request.json();
    
    const {
      name,
      type = "Product",
      price,
      compareAtPrice = "0",
      status = "Draft",
      imageUrl = "",
      imageUrls = "",
      shortDescription = "",
      category = "",
      stockQuantity = -1,
      trackInventory = false,
      lowStockThreshold = 5,
      hasVariants = false,
      variants = []
    } = body;

    // Validate required fields
    if (!name || !price) {
      return NextResponse.json(
        { error: "Name and price are required" },
        { status: 400 }
      );
    }

    const db = getDb();
    
    // Create product
    const productResult = await db.insert(catalogItems).values({
      sellerId: auth.sellerId,
      name,
      type,
      price: price.toString(),
      compareAtPrice: compareAtPrice.toString(),
      status,
      imageUrl,
      imageUrls,
      shortDescription,
      category,
      stockQuantity,
      trackInventory,
      lowStockThreshold,
      hasVariants,
    }).returning({
      id: catalogItems.id,
      name: catalogItems.name,
      price: catalogItems.price,
      status: catalogItems.status,
      createdAt: catalogItems.createdAt,
    });

    const product = productResult[0];

    // Create variants if provided
    if (hasVariants && variants && variants.length > 0) {
      const variantData = variants.map((variant: any, index: number) => ({
        productId: product.id,
        name: variant.name || `Variant ${index + 1}`,
        sku: variant.sku || "",
        price: variant.price?.toString() || price.toString(),
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

    return NextResponse.json({
      data: product,
      message: "Product created successfully"
    }, { status: 201 });
    
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}