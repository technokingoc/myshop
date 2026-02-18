import { MetadataRoute } from "next";
import { getDb } from "@/lib/db";
import { sellers } from "@/lib/schema";

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
    const allSellers = await db.select({ slug: sellers.slug, updatedAt: sellers.updatedAt }).from(sellers);

    const storePages: MetadataRoute.Sitemap = allSellers.map((s) => ({
      url: `${baseUrl}/s/${s.slug}`,
      lastModified: s.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    return [...staticPages, ...storePages];
  } catch {
    return staticPages;
  }
}
