import { MetadataRoute } from "next";
import { getDb } from "@/lib/db";
import { sellers, catalogItems, stores, users } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://myshop.co.mz";

  const staticPages: MetadataRoute.Sitemap = [
    { 
      url: baseUrl, 
      lastModified: new Date(), 
      changeFrequency: "daily", 
      priority: 1.0 
    },
    { 
      url: `${baseUrl}/stores`, 
      lastModified: new Date(), 
      changeFrequency: "daily", 
      priority: 0.9 
    },
    { 
      url: `${baseUrl}/pricing`, 
      lastModified: new Date(), 
      changeFrequency: "weekly", 
      priority: 0.7 
    },
    { 
      url: `${baseUrl}/register`, 
      lastModified: new Date(), 
      changeFrequency: "monthly", 
      priority: 0.6 
    },
    { 
      url: `${baseUrl}/login`, 
      lastModified: new Date(), 
      changeFrequency: "monthly", 
      priority: 0.4 
    },
    { 
      url: `${baseUrl}/customer/register`, 
      lastModified: new Date(), 
      changeFrequency: "monthly", 
      priority: 0.5 
    },
    { 
      url: `${baseUrl}/open-store`, 
      lastModified: new Date(), 
      changeFrequency: "weekly", 
      priority: 0.8 
    },
  ];

  try {
    const db = getDb();
    
    // Get all sellers (legacy support)
    const allSellers = await db.select({ 
      slug: sellers.slug, 
      updatedAt: sellers.updatedAt 
    }).from(sellers);

    // Get all new stores
    const allStores = await db.select({ 
      slug: stores.slug, 
      updatedAt: stores.updatedAt 
    }).from(stores);

    // Get all published products with store/seller info and better metadata
    const allProducts = await db.select({
      id: catalogItems.id,
      name: catalogItems.name,
      createdAt: catalogItems.createdAt,
      updatedAt: catalogItems.updatedAt,
      sellerId: catalogItems.sellerId,
      sellerSlug: sellers.slug,
      storeSlug: stores.slug,
      category: catalogItems.category,
    })
    .from(catalogItems)
    .leftJoin(sellers, eq(catalogItems.sellerId, sellers.id))
    .leftJoin(stores, eq(catalogItems.sellerId, stores.userId))
    .where(eq(catalogItems.status, "Published"))
    .orderBy(catalogItems.updatedAt)
    .limit(10000); // Limit to prevent memory issues

    const storePages: MetadataRoute.Sitemap = [
      // Legacy seller pages
      ...allSellers.map((s) => ({
        url: `${baseUrl}/s/${s.slug}`,
        lastModified: s.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
      // New store pages
      ...allStores.map((s) => ({
        url: `${baseUrl}/s/${s.slug}`,
        lastModified: s.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }))
    ];

    // Individual product pages - use the store slug as base
    const productPages: MetadataRoute.Sitemap = allProducts.map((p) => {
      const storeSlug = p.storeSlug || p.sellerSlug;
      // Use updatedAt if available, fallback to createdAt
      const lastModified = p.updatedAt || p.createdAt;
      // Higher priority for recently updated products
      const isRecent = lastModified && (Date.now() - new Date(lastModified).getTime()) < 7 * 24 * 60 * 60 * 1000;
      
      return {
        url: `${baseUrl}/s/${storeSlug}/product/${p.id}`,
        lastModified: lastModified || new Date(),
        changeFrequency: "weekly" as const,
        priority: isRecent ? 0.8 : 0.6,
      };
    });

    return [...staticPages, ...storePages, ...productPages];
  } catch (error) {
    console.error("Error generating sitemap:", error);
    return staticPages;
  }
}
