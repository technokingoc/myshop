import { MetadataRoute } from "next";
import { getDb } from "@/lib/db";
import { sellers, catalogItems, stores, users } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://myshop.co.mz";

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/stores`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/pricing`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/register`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/login`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
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

    // Get all published products with store/seller info
    const allProducts = await db.select({
      id: catalogItems.id,
      name: catalogItems.name,
      createdAt: catalogItems.createdAt,
      sellerId: catalogItems.sellerId,
      sellerSlug: sellers.slug,
      storeSlug: stores.slug,
    })
    .from(catalogItems)
    .leftJoin(sellers, eq(catalogItems.sellerId, sellers.id))
    .leftJoin(stores, eq(catalogItems.sellerId, stores.userId))
    .where(eq(catalogItems.status, "Published"));

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
      return {
        url: `${baseUrl}/s/${storeSlug}/product/${p.id}`,
        lastModified: p.createdAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      };
    });

    return [...staticPages, ...storePages, ...productPages];
  } catch (error) {
    console.error("Error generating sitemap:", error);
    return staticPages;
  }
}
