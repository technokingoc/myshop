import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { catalogItems, stores } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";

const DATABASE_URL = process.env.DATABASE_URL || process.env.MYSHOP_DATABASE_URL!;
const sql = neon(DATABASE_URL);
const db = drizzle(sql);

// GET /api/v1/feed/products.json - JSON product feed for Facebook Catalog
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeSlug = searchParams.get("store");
    const apiKey = searchParams.get("key");
    
    // Validate parameters
    if (!storeSlug || !apiKey) {
      return NextResponse.json(
        { error: "Missing required parameters: store, key" },
        { status: 400 }
      );
    }

    // Verify API key for the store
    const authResult = await sql`
      SELECT s.id, s.name, s.slug, s.currency, s.city, s.country, s.description
      FROM stores s
      JOIN api_keys ak ON s.id = ak.store_id
      WHERE s.slug = ${storeSlug} 
        AND ak.key_prefix = ${apiKey.substring(0, 16)}
        AND ak.is_active = true
        AND (ak.expires_at IS NULL OR ak.expires_at > NOW())
        AND ('products:read' = ANY(ak.permissions) OR '*' = ANY(ak.permissions))
    `;

    if (!authResult.length) {
      return NextResponse.json(
        { error: "Invalid API key or unauthorized access" },
        { status: 401 }
      );
    }

    const store = authResult[0];
    
    // Fetch published products
    const products = await db
      .select()
      .from(catalogItems)
      .where(and(
        eq(catalogItems.sellerId, store.id),
        eq(catalogItems.status, "Published"),
        eq(catalogItems.moderationStatus, "approved")
      ))
      .orderBy(catalogItems.createdAt);

    // Build Facebook Catalog-compatible JSON feed
    const feedItems = products.map(product => {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `https://myshop-amber.vercel.app`;
      const productUrl = `${baseUrl}/s/${store.slug}/products/${product.id}`;
      const imageUrl = product.imageUrl ? 
        (product.imageUrl.startsWith('http') ? product.imageUrl : `${baseUrl}${product.imageUrl}`) :
        `${baseUrl}/placeholder-product.jpg`;
      
      return {
        // Required fields for Facebook Catalog
        id: product.id.toString(),
        title: product.name,
        description: product.shortDescription || product.name,
        availability: product.trackInventory && product.stockQuantity !== null
          ? (product.stockQuantity > 0 ? "in stock" : "out of stock")
          : "in stock",
        condition: "new",
        price: `${parseFloat(product.price).toFixed(2)} ${store.currency}`,
        link: productUrl,
        image_link: imageUrl,
        brand: store.name,
        
        // Optional fields
        google_product_category: product.category || "General",
        product_type: product.type,
        
        // Additional images if available
        ...(product.imageUrls && product.imageUrls !== product.imageUrl ? {
          additional_image_link: product.imageUrls.split(',').slice(1, 10).map(url => 
            url.trim().startsWith('http') ? url.trim() : `${baseUrl}${url.trim()}`
          ).join(',')
        } : {}),
        
        // Sale price if available
        ...(product.compareAtPrice && parseFloat(product.compareAtPrice) > parseFloat(product.price) ? {
          sale_price: `${parseFloat(product.price).toFixed(2)} ${store.currency}`,
          sale_price_effective_date: new Date().toISOString().split('T')[0] + "/" + 
                                      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        } : {}),
        
        // Inventory
        ...(product.trackInventory && product.stockQuantity !== null ? {
          quantity_to_sell_on_facebook: product.stockQuantity
        } : {}),
        
        // GTIN (if you have product barcodes, add them here)
        // gtin: product.barcode,
        
        // Custom labels for tracking
        custom_label_0: product.category,
        custom_label_1: store.city,
        custom_label_2: product.type
      };
    });

    // Update API key usage
    await sql`
      UPDATE api_keys 
      SET last_used_at = NOW(), usage_count = usage_count + 1
      WHERE store_id = ${store.id} AND key_prefix = ${apiKey.substring(0, 16)}
    `;

    // Return JSON feed with metadata
    return NextResponse.json({
      version: "1.0",
      store: {
        name: store.name,
        slug: store.slug,
        currency: store.currency,
        location: [store.city, store.country].filter(Boolean).join(", ")
      },
      generated_at: new Date().toISOString(),
      product_count: feedItems.length,
      data: feedItems
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'X-Feed-Type': 'facebook-catalog'
      }
    });

  } catch (error) {
    console.error("Error generating JSON product feed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}