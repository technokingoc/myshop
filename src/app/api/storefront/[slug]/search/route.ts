import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { catalogItems, sellers, comments } from "@/lib/schema";
import { eq, sql, ilike, and, gte, lte, desc, asc } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const category = searchParams.get("category") || "";
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const minRating = searchParams.get("minRating");
    const sort = searchParams.get("sort") || "recent";
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 50);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const db = getDb();

    // First, find the seller by slug
    const [seller] = await db
      .select({ id: sellers.id })
      .from(sellers)
      .where(eq(sellers.slug, slug));

    if (!seller) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const conditions = [
      eq(catalogItems.sellerId, seller.id),
      eq(catalogItems.status, "Published"),
    ];

    // Full-text search on name and description
    if (q) {
      conditions.push(
        sql`(${ilike(catalogItems.name, `%${q}%`)} OR ${ilike(catalogItems.shortDescription, `%${q}%`)})`
      );
    }

    // Category filter
    if (category && category !== "all") {
      conditions.push(eq(catalogItems.category, category));
    }

    // Price range filters
    if (minPrice) {
      conditions.push(gte(sql`CAST(${catalogItems.price} AS DECIMAL)`, minPrice));
    }
    if (maxPrice) {
      conditions.push(lte(sql`CAST(${catalogItems.price} AS DECIMAL)`, maxPrice));
    }

    // Subquery for product ratings (from comments)
    const productRatingSq = db
      .select({
        catalogItemId: comments.catalogItemId,
        avgRating: sql<number>`ROUND(AVG(${comments.rating})::numeric, 1)`.as("avg_rating"),
        ratingCount: sql<number>`COUNT(${comments.rating})`.as("rating_count"),
      })
      .from(comments)
      .where(sql`${comments.rating} IS NOT NULL AND ${comments.catalogItemId} IS NOT NULL`)
      .groupBy(comments.catalogItemId)
      .as("pr");

    // Add rating filter to conditions if specified
    if (minRating) {
      conditions.push(
        sql`COALESCE(${productRatingSq.avgRating}, 0) >= ${minRating}`
      );
    }

    const where = sql.join(conditions, sql` AND `);

    // Determine sort order
    let orderBy;
    switch (sort) {
      case "price_asc":
        orderBy = asc(sql`CAST(${catalogItems.price} AS DECIMAL)`);
        break;
      case "price_desc":
        orderBy = desc(sql`CAST(${catalogItems.price} AS DECIMAL)`);
        break;
      case "rating":
        orderBy = desc(sql`COALESCE(${productRatingSq.avgRating}, 0)`);
        break;
      case "popular":
        orderBy = desc(catalogItems.id); // Simple popularity by ID for now
        break;
      default: // recent
        orderBy = desc(catalogItems.createdAt);
    }

    const products = await db
      .select({
        id: catalogItems.id,
        name: catalogItems.name,
        price: catalogItems.price,
        compareAtPrice: catalogItems.compareAtPrice,
        imageUrl: catalogItems.imageUrl,
        imageUrls: catalogItems.imageUrls,
        shortDescription: catalogItems.shortDescription,
        category: catalogItems.category,
        type: catalogItems.type,
        status: catalogItems.status,
        createdAt: catalogItems.createdAt,
        avgRating: sql<number>`COALESCE(${productRatingSq.avgRating}, 0)`,
        ratingCount: sql<number>`COALESCE(${productRatingSq.ratingCount}, 0)`,
      })
      .from(catalogItems)
      .leftJoin(productRatingSq, eq(catalogItems.id, productRatingSq.catalogItemId))
      .where(where)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    // Get available categories for this store
    const categories = await db
      .selectDistinct({ category: catalogItems.category })
      .from(catalogItems)
      .where(
        and(
          eq(catalogItems.sellerId, seller.id),
          eq(catalogItems.status, "Published"),
          sql`${catalogItems.category} IS NOT NULL AND ${catalogItems.category} != ''`
        )
      );

    // Get price range for this store
    const priceRange = await db
      .select({
        minPrice: sql<number>`MIN(CAST(${catalogItems.price} AS DECIMAL))`,
        maxPrice: sql<number>`MAX(CAST(${catalogItems.price} AS DECIMAL))`,
      })
      .from(catalogItems)
      .where(
        and(
          eq(catalogItems.sellerId, seller.id),
          eq(catalogItems.status, "Published")
        )
      );

    // Get count for pagination
    const countQuery = await db
      .select({ count: sql<number>`count(*)` })
      .from(catalogItems)
      .leftJoin(productRatingSq, eq(catalogItems.id, productRatingSq.catalogItemId))
      .where(where);
    
    const total = countQuery[0]?.count || 0;

    return NextResponse.json({
      products,
      categories: categories.map((c) => c.category).filter(Boolean),
      priceRange: priceRange[0] || { minPrice: 0, maxPrice: 1000 },
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + products.length < total,
      },
    });
  } catch (error) {
    console.error("Storefront search API error:", error);
    return NextResponse.json(
      { error: "Failed to search products" },
      { status: 500 }
    );
  }
}