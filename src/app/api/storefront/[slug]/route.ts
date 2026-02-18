import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { sellers, catalogItems } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    const db = getDb();
    const [seller] = await db
      .select()
      .from(sellers)
      .where(eq(sellers.slug, slug));

    if (!seller) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const products = await db
      .select()
      .from(catalogItems)
      .where(eq(catalogItems.sellerId, seller.id));

    return NextResponse.json({
      seller: {
        id: seller.id,
        slug: seller.slug,
        name: seller.name,
        description: seller.description,
        ownerName: seller.ownerName,
        businessType: seller.businessType,
        currency: seller.currency,
        city: seller.city,
        logoUrl: seller.logoUrl,
        bannerUrl: seller.bannerUrl,
        socialLinks: seller.socialLinks,
      },
      products,
    });
  } catch (error) {
    console.error("Storefront API error:", error);
    return NextResponse.json({ error: "Failed to load store" }, { status: 500 });
  }
}
