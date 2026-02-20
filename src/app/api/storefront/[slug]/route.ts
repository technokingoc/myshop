import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const sellerRows = await sql`SELECT * FROM sellers WHERE slug = ${slug} LIMIT 1`;

    if (!sellerRows.length) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const seller = sellerRows[0];
    const products = await sql`SELECT * FROM catalog_items WHERE seller_id = ${seller.id}`;

    return NextResponse.json({
      seller: {
        id: seller.id,
        slug: seller.slug,
        name: seller.name,
        description: seller.description,
        ownerName: seller.owner_name,
        businessType: seller.business_type,
        currency: seller.currency,
        city: seller.city,
        logoUrl: seller.logo_url,
        bannerUrl: seller.banner_url,
        socialLinks: seller.social_links,
        plan: seller.plan || "free",
        themeColor: seller.theme_color || "green",
        businessHours: seller.business_hours || {},
        address: seller.address || "",
        country: seller.country || "",
        storeTemplate: seller.store_template || "classic",
        headerTemplate: seller.header_template || "compact",
      },
      products,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Storefront API error:", msg);
    return NextResponse.json({ error: "Failed to load store", detail: msg }, { status: 500 });
  }
}
