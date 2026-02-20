import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { catalogItems, sellers, stores, categories, wishlists, orders } from "@/lib/schema";
import { desc, eq, and, isNotNull, sql, count, gte, or, asc } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug: categorySlug } = await params;
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get("lang") || "en";

    // Get category information
    const categoryInfo = await db
      .select({
        id: categories.id,
        nameEn: categories.nameEn,
        namePt: categories.namePt,
        slug: categories.slug,
        icon: categories.icon,
        parentId: categories.parentId,
      })
      .from(categories)
      .where(and(
        eq(categories.slug, categorySlug),
        eq(categories.active, true)
      ))
      .limit(1);

    if (categoryInfo.length === 0) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    const category = categoryInfo[0];
    const categoryName = lang === "pt" ? category.namePt : category.nameEn;

    // Get subcategories if this is a parent category
    const subcategories = await db
      .select({
        id: categories.id,
        nameEn: categories.nameEn,
        namePt: categories.namePt,
        slug: categories.slug,
        icon: categories.icon,
        productCount: sql<number>`
          (SELECT COUNT(*) FROM ${catalogItems} 
           WHERE category = ${categories.slug} 
           AND status = 'Active' 
           AND moderation_status = 'approved')
        `,
      })
      .from(categories)
      .where(and(
        eq(categories.parentId, category.id),
        eq(categories.active, true)
      ))
      .orderBy(asc(categories.sortOrder), asc(categories.nameEn));

    // Get featured products for this category (highest rated or most wishlisted)
    const featuredProducts = await db
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
        
        // Store information
        sellerSlug: sql<string>`COALESCE(${stores.slug}, ${sellers.slug})`,
        sellerName: sql<string>`COALESCE(${stores.name}, ${sellers.name})`,
        sellerCity: sql<string>`COALESCE(${stores.city}, ${sellers.city})`,
        sellerLogoUrl: sql<string>`COALESCE(${stores.logoUrl}, ${sellers.logoUrl})`,
        
        // Wishlist count for popularity
        wishlistCount: sql<number>`
          COALESCE((
            SELECT COUNT(*) FROM ${wishlists} 
            WHERE catalog_item_id = ${catalogItems.id}
          ), 0)
        `,
      })
      .from(catalogItems)
      .leftJoin(sellers, eq(catalogItems.sellerId, sellers.id))
      .leftJoin(stores, eq(catalogItems.sellerId, stores.userId))
      .where(and(
        eq(catalogItems.category, categorySlug),
        eq(catalogItems.status, "Active"),
        eq(catalogItems.moderationStatus, "approved"),
        isNotNull(catalogItems.imageUrl)
      ))
      .orderBy(sql`wishlist_count DESC`)
      .limit(8);

    // Get top sellers (products with most orders in this category)
    const topSellers = await db
      .select({
        id: catalogItems.id,
        name: catalogItems.name,
        price: catalogItems.price,
        compareAtPrice: catalogItems.compareAtPrice,
        imageUrl: catalogItems.imageUrl,
        shortDescription: catalogItems.shortDescription,
        category: catalogItems.category,
        stockQuantity: catalogItems.stockQuantity,
        trackInventory: catalogItems.trackInventory,
        
        // Store information
        sellerSlug: sql<string>`COALESCE(${stores.slug}, ${sellers.slug})`,
        sellerName: sql<string>`COALESCE(${stores.name}, ${sellers.name})`,
        sellerCity: sql<string>`COALESCE(${stores.city}, ${sellers.city})`,
        sellerLogoUrl: sql<string>`COALESCE(${stores.logoUrl}, ${sellers.logoUrl})`,
        
        // Order count for top seller status
        orderCount: sql<number>`
          COALESCE((
            SELECT COUNT(*) FROM ${orders} 
            WHERE item_id = ${catalogItems.id}
            AND status IN ('completed', 'delivered')
          ), 0)
        `,
      })
      .from(catalogItems)
      .leftJoin(sellers, eq(catalogItems.sellerId, sellers.id))
      .leftJoin(stores, eq(catalogItems.sellerId, stores.userId))
      .where(and(
        eq(catalogItems.category, categorySlug),
        eq(catalogItems.status, "Active"),
        eq(catalogItems.moderationStatus, "approved"),
        isNotNull(catalogItems.imageUrl)
      ))
      .orderBy(sql`order_count DESC`)
      .limit(8);

    // Get category statistics
    const stats = await db
      .select({
        totalProducts: count(),
        totalStores: sql<number>`COUNT(DISTINCT ${catalogItems.sellerId})`,
      })
      .from(catalogItems)
      .where(and(
        eq(catalogItems.category, categorySlug),
        eq(catalogItems.status, "Active"),
        eq(catalogItems.moderationStatus, "approved")
      ));

    // Get recent products in this category (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentProducts = await db
      .select({
        id: catalogItems.id,
        name: catalogItems.name,
        price: catalogItems.price,
        compareAtPrice: catalogItems.compareAtPrice,
        imageUrl: catalogItems.imageUrl,
        shortDescription: catalogItems.shortDescription,
        category: catalogItems.category,
        stockQuantity: catalogItems.stockQuantity,
        trackInventory: catalogItems.trackInventory,
        createdAt: catalogItems.createdAt,
        
        // Store information
        sellerSlug: sql<string>`COALESCE(${stores.slug}, ${sellers.slug})`,
        sellerName: sql<string>`COALESCE(${stores.name}, ${sellers.name})`,
        sellerCity: sql<string>`COALESCE(${stores.city}, ${sellers.city})`,
        sellerLogoUrl: sql<string>`COALESCE(${stores.logoUrl}, ${sellers.logoUrl})`,
      })
      .from(catalogItems)
      .leftJoin(sellers, eq(catalogItems.sellerId, sellers.id))
      .leftJoin(stores, eq(catalogItems.sellerId, stores.userId))
      .where(and(
        eq(catalogItems.category, categorySlug),
        eq(catalogItems.status, "Active"),
        eq(catalogItems.moderationStatus, "approved"),
        gte(catalogItems.createdAt, thirtyDaysAgo),
        isNotNull(catalogItems.imageUrl)
      ))
      .orderBy(desc(catalogItems.createdAt))
      .limit(8);

    // Format products
    const formatProduct = (item: any) => ({
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
      
      // Include additional metrics if available
      ...(item.wishlistCount !== undefined ? { wishlistCount: item.wishlistCount } : {}),
      ...(item.orderCount !== undefined ? { orderCount: item.orderCount } : {}),
    });

    return NextResponse.json({
      category: {
        id: category.id,
        name: categoryName,
        nameEn: category.nameEn,
        namePt: category.namePt,
        slug: category.slug,
        icon: category.icon,
        parentId: category.parentId,
      },
      subcategories: subcategories.map(sub => ({
        id: sub.id,
        name: lang === "pt" ? sub.namePt : sub.nameEn,
        nameEn: sub.nameEn,
        namePt: sub.namePt,
        slug: sub.slug,
        icon: sub.icon,
        productCount: sub.productCount,
      })),
      sections: {
        featured: featuredProducts.map(formatProduct),
        topSellers: topSellers.map(formatProduct),
        recent: recentProducts.map(formatProduct),
      },
      stats: {
        totalProducts: stats[0]?.totalProducts || 0,
        totalStores: stats[0]?.totalStores || 0,
      },
      meta: {
        language: lang,
        generated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Category API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch category data" },
      { status: 500 }
    );
  }
}