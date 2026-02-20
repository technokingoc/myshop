import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { catalogItems, sellers, stores } from "@/lib/schema";
import { desc, gte, and, eq, isNotNull, sql, or } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "12"), 50);
    const offset = Math.max(parseInt(searchParams.get("offset") || "0"), 0);
    const category = searchParams.get("category");
    const days = Math.min(parseInt(searchParams.get("days") || "14"), 30); // Max 30 days

    // Calculate date threshold (7-14 days ago)
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    let whereConditions = and(
      eq(catalogItems.status, "Active"),
      eq(catalogItems.moderationStatus, "approved"),
      gte(catalogItems.createdAt, dateThreshold),
      isNotNull(catalogItems.imageUrl)
    );

    // Add category filter if provided
    if (category && category.trim()) {
      whereConditions = and(
        whereConditions,
        eq(catalogItems.category, category.trim())
      );
    }

    // Query new arrival products with store information
    const results = await db
      .select({
        // Product fields
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
        
        // Store fields (try both legacy and new tables)
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
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const totalQuery = await db
      .select({ count: sql<number>`count(*)` })
      .from(catalogItems)
      .leftJoin(sellers, eq(catalogItems.sellerId, sellers.id))
      .leftJoin(stores, eq(catalogItems.sellerId, stores.userId))
      .where(whereConditions);

    const total = totalQuery[0]?.count || 0;

    // Format results
    const products = results.map(item => ({
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
      daysAgo: Math.floor((Date.now() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
      
      // Store information
      store: {
        slug: item.sellerSlug,
        name: item.sellerName,
        city: item.sellerCity,
        logoUrl: item.sellerLogoUrl,
      },
    }));

    return NextResponse.json({
      products,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
      meta: {
        daysThreshold: days,
        dateThreshold: dateThreshold.toISOString(),
        category: category || null,
      },
    });
  } catch (error) {
    console.error("New arrivals API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch new arrivals" },
      { status: 500 }
    );
  }
}