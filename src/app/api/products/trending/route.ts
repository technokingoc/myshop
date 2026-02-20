import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { catalogItems, sellers, stores, orders, wishlists } from "@/lib/schema";
import { desc, gte, and, eq, isNotNull, sql, count, gt } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "12"), 50);
    const offset = Math.max(parseInt(searchParams.get("offset") || "0"), 0);
    const category = searchParams.get("category");
    const timeframe = searchParams.get("timeframe") || "7d"; // 7d, 14d, 30d

    // Calculate time threshold for trending calculation
    const daysMap = { "7d": 7, "14d": 14, "30d": 30 };
    const days = daysMap[timeframe as keyof typeof daysMap] || 7;
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    // Build trending score calculation using time-decay algorithm
    // Score = (orders * 3 + wishlists * 1) * time_decay_factor
    // Time decay: newer activity gets higher weight
    const trendingQuery = db
      .select({
        productId: catalogItems.id,
        name: catalogItems.name,
        price: catalogItems.price,
        compareAtPrice: catalogItems.compareAtPrice,
        imageUrl: catalogItems.imageUrl,
        imageUrls: catalogItems.imageUrls,
        shortDescription: catalogItems.shortDescription,
        category: catalogItems.category,
        stockQuantity: catalogItems.stockQuantity,
        trackInventory: catalogItems.trackInventory,
        createdAt: catalogItems.createdAt,
        
        // Store fields
        sellerSlug: sql<string>`COALESCE(${stores.slug}, ${sellers.slug})`,
        sellerName: sql<string>`COALESCE(${stores.name}, ${sellers.name})`,
        sellerCity: sql<string>`COALESCE(${stores.city}, ${sellers.city})`,
        sellerLogoUrl: sql<string>`COALESCE(${stores.logoUrl}, ${sellers.logoUrl})`,
        
        // Trending metrics with time decay
        trendingScore: sql<number>`
          COALESCE((
            SELECT 
              (COUNT(DISTINCT o.id) * 3.0 + COUNT(DISTINCT w.id) * 1.0) *
              EXP(-0.1 * EXTRACT(DAY FROM NOW() - GREATEST(MAX(o.created_at), MAX(w.created_at))))
            FROM (
              SELECT id, created_at FROM ${orders} 
              WHERE item_id = ${catalogItems.id} 
              AND created_at >= ${sql.raw(`'${dateThreshold.toISOString()}'`)}
            ) o
            FULL OUTER JOIN (
              SELECT id, created_at FROM ${wishlists} 
              WHERE catalog_item_id = ${catalogItems.id} 
              AND created_at >= ${sql.raw(`'${dateThreshold.toISOString()}'`)}
            ) w ON FALSE
          ), 0)
        `,
        
        // Raw metrics for debugging
        orderCount: sql<number>`
          COALESCE((
            SELECT COUNT(*) FROM ${orders} 
            WHERE item_id = ${catalogItems.id} 
            AND created_at >= ${sql.raw(`'${dateThreshold.toISOString()}'`)}
          ), 0)
        `,
        wishlistCount: sql<number>`
          COALESCE((
            SELECT COUNT(*) FROM ${wishlists} 
            WHERE catalog_item_id = ${catalogItems.id} 
            AND created_at >= ${sql.raw(`'${dateThreshold.toISOString()}'`)}
          ), 0)
        `,
      })
      .from(catalogItems)
      .leftJoin(sellers, eq(catalogItems.sellerId, sellers.id))
      .leftJoin(stores, eq(catalogItems.sellerId, stores.userId));

    // Add conditions
    let whereConditions = and(
      eq(catalogItems.status, "Active"),
      eq(catalogItems.moderationStatus, "approved"),
      isNotNull(catalogItems.imageUrl)
    );

    if (category && category.trim()) {
      whereConditions = and(whereConditions, eq(catalogItems.category, category.trim()));
    }

    // Execute query with conditions and ordering
    const results = await trendingQuery
      .where(whereConditions)
      .orderBy(sql`trending_score DESC`)
      .limit(limit)
      .offset(offset);

    // Filter out products with zero trending score and format results
    const products = results
      .filter(item => (item.trendingScore || 0) > 0)
      .map(item => ({
        id: item.productId,
        name: item.name,
        price: parseFloat(item.price || "0"),
        compareAtPrice: item.compareAtPrice ? parseFloat(item.compareAtPrice) : null,
        imageUrl: item.imageUrl || "",
        imageUrls: item.imageUrls || "",
        shortDescription: item.shortDescription || "",
        category: item.category || "",
        stockQuantity: item.stockQuantity || 0,
        trackInventory: item.trackInventory || false,
        createdAt: item.createdAt,
        
        // Store information
        store: {
          slug: item.sellerSlug,
          name: item.sellerName,
          city: item.sellerCity,
          logoUrl: item.sellerLogoUrl,
        },
        
        // Trending metrics
        trending: {
          score: Math.round((item.trendingScore || 0) * 100) / 100,
          orderCount: item.orderCount || 0,
          wishlistCount: item.wishlistCount || 0,
          timeframe,
        },
      }));

    // Fallback: if no trending products found, get recent popular products
    let fallbackProducts: any[] = [];
    if (products.length === 0) {
      const fallbackQuery = await db
        .select({
          id: catalogItems.id,
          name: catalogItems.name,
          price: catalogItems.price,
          compareAtPrice: catalogItems.compareAtPrice,
          imageUrl: catalogItems.imageUrl,
          imageUrls: catalogItems.imageUrls,
          shortDescription: catalogItems.shortDescription,
          category: catalogItems.category,
          stockQuantity: catalogItems.stockQuantity,
          trackInventory: catalogItems.trackInventory,
          createdAt: catalogItems.createdAt,
          
          sellerSlug: sql<string>`COALESCE(${stores.slug}, ${sellers.slug})`,
          sellerName: sql<string>`COALESCE(${stores.name}, ${sellers.name})`,
          sellerCity: sql<string>`COALESCE(${stores.city}, ${sellers.city})`,
          sellerLogoUrl: sql<string>`COALESCE(${stores.logoUrl}, ${sellers.logoUrl})`,
        })
        .from(catalogItems)
        .leftJoin(sellers, eq(catalogItems.sellerId, sellers.id))
        .leftJoin(stores, eq(catalogItems.sellerId, stores.userId))
        .where(whereConditions)
        .orderBy(desc(catalogItems.createdAt))
        .limit(limit);

      fallbackProducts = fallbackQuery.map(item => ({
        id: item.id,
        name: item.name,
        price: parseFloat(item.price || "0"),
        compareAtPrice: item.compareAtPrice ? parseFloat(item.compareAtPrice) : null,
        imageUrl: item.imageUrl || "",
        imageUrls: item.imageUrls || "",
        shortDescription: item.shortDescription || "",
        category: item.category || "",
        stockQuantity: item.stockQuantity || 0,
        trackInventory: item.trackInventory || false,
        createdAt: item.createdAt,
        
        store: {
          slug: item.sellerSlug,
          name: item.sellerName,
          city: item.sellerCity,
          logoUrl: item.sellerLogoUrl,
        },
        
        trending: {
          score: 0,
          orderCount: 0,
          wishlistCount: 0,
          timeframe,
          fallback: true,
        },
      }));
    }

    const finalProducts = products.length > 0 ? products : fallbackProducts;

    return NextResponse.json({
      products: finalProducts,
      pagination: {
        total: finalProducts.length,
        limit,
        offset,
        hasMore: false, // For trending, we show what's available
      },
      meta: {
        timeframe,
        daysThreshold: days,
        dateThreshold: dateThreshold.toISOString(),
        category: category || null,
        algorithm: "time_decay_orders_wishlists",
        fallbackUsed: products.length === 0 && fallbackProducts.length > 0,
      },
    });
  } catch (error) {
    console.error("Trending products API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch trending products" },
      { status: 500 }
    );
  }
}