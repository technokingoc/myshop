import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { catalogItems, stores } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";

const DATABASE_URL = process.env.DATABASE_URL || process.env.MYSHOP_DATABASE_URL!;
const sql = neon(DATABASE_URL);
const db = drizzle(sql);

// Helper function to escape CSV fields
function escapeCSV(field: string | null | undefined): string {
  if (!field) return "";
  const str = field.toString();
  // If field contains comma, newline, or quote, wrap in quotes and escape quotes
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

// GET /api/v1/feed/products.csv - CSV product feed for marketplace integrations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeSlug = searchParams.get("store");
    const apiKey = searchParams.get("key");
    const format = searchParams.get("format") || "standard"; // standard, google, facebook
    
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
        AND ('feeds:read' = ANY(ak.permissions) OR 'products:read' = ANY(ak.permissions) OR '*' = ANY(ak.permissions))
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

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `https://myshop-amber.vercel.app`;
    
    let csvContent = "";
    let filename = `${store.slug}-products-${format}.csv`;

    // Build CSV based on format
    if (format === "google") {
      // Google Shopping format
      csvContent = [
        "id,title,description,link,image_link,availability,price,brand,condition,google_product_category,product_type,custom_label_0,custom_label_1,identifier_exists"
      ].concat(
        products.map(product => {
          const productUrl = `${baseUrl}/s/${store.slug}/products/${product.id}`;
          const imageUrl = product.imageUrl ? 
            (product.imageUrl.startsWith('http') ? product.imageUrl : `${baseUrl}${product.imageUrl}`) :
            `${baseUrl}/placeholder-product.jpg`;
          
          const availability = product.trackInventory && product.stockQuantity !== null
            ? (product.stockQuantity > 0 ? "in stock" : "out of stock")
            : "in stock";
          
          const price = `${parseFloat(product.price).toFixed(2)} ${store.currency}`;
          
          return [
            escapeCSV(product.id.toString()),
            escapeCSV(product.name),
            escapeCSV(product.shortDescription || product.name),
            escapeCSV(productUrl),
            escapeCSV(imageUrl),
            escapeCSV(availability),
            escapeCSV(price),
            escapeCSV(store.name),
            escapeCSV("new"),
            escapeCSV(product.category || "General"),
            escapeCSV(product.type),
            escapeCSV(product.category || ""),
            escapeCSV(store.city || ""),
            escapeCSV("false")
          ].join(",");
        })
      ).join("\n");
    } else if (format === "facebook") {
      // Facebook Catalog format
      csvContent = [
        "id,title,description,availability,condition,price,link,image_link,brand,google_product_category,product_type,custom_label_0"
      ].concat(
        products.map(product => {
          const productUrl = `${baseUrl}/s/${store.slug}/products/${product.id}`;
          const imageUrl = product.imageUrl ? 
            (product.imageUrl.startsWith('http') ? product.imageUrl : `${baseUrl}${product.imageUrl}`) :
            `${baseUrl}/placeholder-product.jpg`;
          
          const availability = product.trackInventory && product.stockQuantity !== null
            ? (product.stockQuantity > 0 ? "in stock" : "out of stock")
            : "in stock";
          
          const price = `${parseFloat(product.price).toFixed(2)} ${store.currency}`;
          
          return [
            escapeCSV(product.id.toString()),
            escapeCSV(product.name),
            escapeCSV(product.shortDescription || product.name),
            escapeCSV(availability),
            escapeCSV("new"),
            escapeCSV(price),
            escapeCSV(productUrl),
            escapeCSV(imageUrl),
            escapeCSV(store.name),
            escapeCSV(product.category || "General"),
            escapeCSV(product.type),
            escapeCSV(product.category || "")
          ].join(",");
        })
      ).join("\n");
    } else {
      // Standard format - comprehensive product data
      csvContent = [
        "id,name,type,price,compare_at_price,status,category,stock_quantity,track_inventory,low_stock_threshold,has_variants,description,image_url,image_urls,product_url,seller_name,created_at"
      ].concat(
        products.map(product => {
          const productUrl = `${baseUrl}/s/${store.slug}/products/${product.id}`;
          
          return [
            escapeCSV(product.id.toString()),
            escapeCSV(product.name),
            escapeCSV(product.type),
            escapeCSV(product.price),
            escapeCSV(product.compareAtPrice || ""),
            escapeCSV(product.status),
            escapeCSV(product.category || ""),
            escapeCSV(product.stockQuantity?.toString() || ""),
            escapeCSV(product.trackInventory ? "true" : "false"),
            escapeCSV(product.lowStockThreshold?.toString() || ""),
            escapeCSV(product.hasVariants ? "true" : "false"),
            escapeCSV(product.shortDescription || ""),
            escapeCSV(product.imageUrl || ""),
            escapeCSV(product.imageUrls || ""),
            escapeCSV(productUrl),
            escapeCSV(store.name),
            escapeCSV(product.createdAt.toISOString())
          ].join(",");
        })
      ).join("\n");
    }

    // Update API key usage
    await sql`
      UPDATE api_keys 
      SET last_used_at = NOW(), usage_count = usage_count + 1
      WHERE store_id = ${store.id} AND key_prefix = ${apiKey.substring(0, 16)}
    `;

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'X-Feed-Type': `csv-${format}`,
        'X-Product-Count': products.length.toString()
      }
    });

  } catch (error) {
    console.error("Error generating CSV product feed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}