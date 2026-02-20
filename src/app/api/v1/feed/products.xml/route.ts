import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { catalogItems, stores } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";

const DATABASE_URL = process.env.DATABASE_URL || process.env.MYSHOP_DATABASE_URL!;
const sql = neon(DATABASE_URL);
const db = drizzle(sql);

// Helper function to escape XML characters
function escapeXml(unsafe: string | null | undefined): string {
  if (!unsafe) return "";
  return unsafe.toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// GET /api/v1/feed/products.xml - XML product feed for Google Shopping
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeSlug = searchParams.get("store");
    const apiKey = searchParams.get("key");
    
    // Validate parameters
    if (!storeSlug || !apiKey) {
      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Product Feed Error</title>
    <description>Missing required parameters: store, key</description>
  </channel>
</rss>`,
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/xml' }
        }
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
      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Product Feed Error</title>
    <description>Invalid API key or unauthorized access</description>
  </channel>
</rss>`,
        { 
          status: 401, 
          headers: { 'Content-Type': 'application/xml' }
        }
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

    // Build Google Shopping-compatible XML feed
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `https://myshop-amber.vercel.app`;
    const feedTitle = `${store.name} - Product Feed`;
    const feedDescription = store.description || `Product catalog for ${store.name}`;
    const feedLink = `${baseUrl}/s/${store.slug}`;
    
    const xmlItems = products.map(product => {
      const productUrl = `${baseUrl}/s/${store.slug}/products/${product.id}`;
      const imageUrl = product.imageUrl ? 
        (product.imageUrl.startsWith('http') ? product.imageUrl : `${baseUrl}${product.imageUrl}`) :
        `${baseUrl}/placeholder-product.jpg`;
      
      const availability = product.trackInventory && product.stockQuantity !== null
        ? (product.stockQuantity > 0 ? "in stock" : "out of stock")
        : "in stock";
      
      const price = `${parseFloat(product.price).toFixed(2)} ${store.currency}`;
      const salePrice = product.compareAtPrice && parseFloat(product.compareAtPrice) > parseFloat(product.price)
        ? `${parseFloat(product.price).toFixed(2)} ${store.currency}`
        : null;
        
      // Additional images
      const additionalImages = product.imageUrls && product.imageUrls !== product.imageUrl 
        ? product.imageUrls.split(',').slice(1, 10).map(url => 
            url.trim().startsWith('http') ? url.trim() : `${baseUrl}${url.trim()}`
          )
        : [];

      return `    <item>
      <g:id>${product.id}</g:id>
      <g:title>${escapeXml(product.name)}</g:title>
      <g:description>${escapeXml(product.shortDescription || product.name)}</g:description>
      <g:link>${escapeXml(productUrl)}</g:link>
      <g:image_link>${escapeXml(imageUrl)}</g:image_link>
      ${additionalImages.map(img => `<g:additional_image_link>${escapeXml(img)}</g:additional_image_link>`).join('\n      ')}
      <g:availability>${availability}</g:availability>
      <g:price>${escapeXml(price)}</g:price>
      ${salePrice ? `<g:sale_price>${escapeXml(salePrice)}</g:sale_price>` : ''}
      <g:brand>${escapeXml(store.name)}</g:brand>
      <g:condition>new</g:condition>
      <g:google_product_category>${escapeXml(product.category || "General")}</g:google_product_category>
      <g:product_type>${escapeXml(product.type)}</g:product_type>
      ${product.trackInventory && product.stockQuantity !== null ? 
        `<g:quantity_to_sell_on_facebook>${product.stockQuantity}</g:quantity_to_sell_on_facebook>` : ''}
      <g:custom_label_0>${escapeXml(product.category || "")}</g:custom_label_0>
      <g:custom_label_1>${escapeXml(store.city || "")}</g:custom_label_1>
      <g:custom_label_2>${escapeXml(product.type)}</g:custom_label_2>
      <g:identifier_exists>false</g:identifier_exists>
    </item>`;
    }).join('\n');

    const xmlFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${escapeXml(feedTitle)}</title>
    <link>${escapeXml(feedLink)}</link>
    <description>${escapeXml(feedDescription)}</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <generator>MyShop S55</generator>
    <docs>https://support.google.com/merchants/answer/7052112</docs>
    <managingEditor>${escapeXml(store.name)}</managingEditor>
    <webMaster>${escapeXml(store.name)}</webMaster>
    
${xmlItems}
  </channel>
</rss>`;

    // Update API key usage
    await sql`
      UPDATE api_keys 
      SET last_used_at = NOW(), usage_count = usage_count + 1
      WHERE store_id = ${store.id} AND key_prefix = ${apiKey.substring(0, 16)}
    `;

    return new Response(xmlFeed, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'X-Feed-Type': 'google-shopping',
        'X-Product-Count': products.length.toString()
      }
    });

  } catch (error) {
    console.error("Error generating XML product feed:", error);
    
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Product Feed Error</title>
    <description>Internal server error occurred while generating feed</description>
  </channel>
</rss>`,
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/xml' }
      }
    );
  }
}