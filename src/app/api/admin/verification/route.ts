import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getDb } from "@/lib/db";
import { sellers, stores, users } from "@/lib/schema";
import { sql, or, eq } from "drizzle-orm";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const db = getDb();

  try {
    // Get sellers from legacy table
    const legacySellers = await db
      .select({
        id: sellers.id,
        name: sellers.name,
        email: sellers.email,
        slug: sellers.slug,
        businessType: sellers.businessType,
        city: sellers.city,
        country: sellers.country,
        address: sellers.address,
        description: sellers.description,
        logoUrl: sellers.logoUrl,
        bannerUrl: sellers.bannerUrl,
        socialLinks: sellers.socialLinks,
        createdAt: sellers.createdAt,
        // Add mock verification fields since they may not exist yet
        verificationStatus: sql<string>`COALESCE(${sellers.verificationStatus}, 'pending')`,
        verificationRequestedAt: sql<string>`COALESCE(${sellers.verificationRequestedAt}, ${sellers.createdAt})`,
        verificationReviewedAt: sellers.verificationReviewedAt,
        verificationReviewedBy: sellers.verificationReviewedBy,
        verificationNotes: sql<string>`COALESCE(${sellers.verificationNotes}, '')`,
        businessDocuments: sql<any>`COALESCE(${sellers.businessDocuments}, '[]'::jsonb)`,
        flaggedReason: sql<string>`COALESCE(${sellers.flaggedReason}, '')`,
        type: sql<string>`'seller'`,
      })
      .from(sellers);

    // Get stores from new table
    const newStores = await db
      .select({
        id: stores.id,
        name: stores.name,
        email: sql<string>`u.email`,
        slug: stores.slug,
        businessType: stores.businessType,
        city: stores.city,
        country: stores.country,
        address: stores.address,
        description: stores.description,
        logoUrl: stores.logoUrl,
        bannerUrl: stores.bannerUrl,
        socialLinks: stores.socialLinks,
        createdAt: stores.createdAt,
        // Add mock verification fields since they may not exist yet
        verificationStatus: sql<string>`COALESCE(${stores.verificationStatus}, 'pending')`,
        verificationRequestedAt: sql<string>`COALESCE(${stores.verificationRequestedAt}, ${stores.createdAt})`,
        verificationReviewedAt: stores.verificationReviewedAt,
        verificationReviewedBy: stores.verificationReviewedBy,
        verificationNotes: sql<string>`COALESCE(${stores.verificationNotes}, '')`,
        businessDocuments: sql<any>`COALESCE(${stores.businessDocuments}, '[]'::jsonb)`,
        flaggedReason: sql<string>`COALESCE(${stores.flaggedReason}, '')`,
        type: sql<string>`'store'`,
      })
      .from(stores)
      .leftJoin(users, eq(stores.userId, users.id));

    // Combine results
    const allSellers = [
      ...legacySellers.map(s => ({
        ...s,
        phone: '', // Legacy sellers don't have phone in the current schema
        businessDocuments: Array.isArray(s.businessDocuments) ? s.businessDocuments : [],
      })),
      ...newStores.map(s => ({
        ...s,
        phone: '', // New stores don't have phone in the current schema
        businessDocuments: Array.isArray(s.businessDocuments) ? s.businessDocuments : [],
      }))
    ];

    return NextResponse.json({ sellers: allSellers });
  } catch (error) {
    console.error("Verification API error:", error);
    
    // Fallback to basic seller data if verification columns don't exist yet
    try {
      const basicSellers = await db
        .select({
          id: sellers.id,
          name: sellers.name,
          email: sellers.email,
          slug: sellers.slug,
          businessType: sellers.businessType,
          city: sellers.city,
          country: sellers.country,
          address: sellers.address,
          description: sellers.description,
          logoUrl: sellers.logoUrl,
          bannerUrl: sellers.bannerUrl,
          socialLinks: sellers.socialLinks,
          createdAt: sellers.createdAt,
        })
        .from(sellers);

      const basicData = basicSellers.map(s => ({
        ...s,
        phone: '',
        verificationStatus: 'pending' as const,
        verificationRequestedAt: s.createdAt?.toISOString() || new Date().toISOString(),
        verificationReviewedAt: null,
        verificationReviewedBy: null,
        verificationNotes: '',
        businessDocuments: [],
        flaggedReason: '',
        type: 'seller',
      }));

      return NextResponse.json({ sellers: basicData });
    } catch (fallbackError) {
      console.error("Fallback query also failed:", fallbackError);
      return NextResponse.json({ error: "Failed to fetch verification data" }, { status: 500 });
    }
  }
}