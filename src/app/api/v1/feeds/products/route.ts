import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { catalogItems, sellers, productVariants } from "@/lib/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { authenticateApiRequest, API_PERMISSIONS } from "@/lib/api-keys";

// Helper function to generate XML feed
function generateXMLFeed(products: any[], baseUrl: string): string {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Product Feed</title>
    <description>MyShop Product Feed</description>
    <link>${baseUrl}</link>
${products.map(product => `    <item>
      <g:id>${product.id}</g:id>
      <g:title><![CDATA[${product.name}]]></g:title>
      <g:description><![CDATA[${product.shortDescription || product.name}]]></g:description>
      <g:link>${baseUrl}/s/${product.sellerSlug}/product/${product.id}</g:link>
      <g:image_link>${product.imageUrl || ''}</g:image_link>
      <g:availability>${product.stockQuantity > 0 ? 'in stock' : 'out of stock'}</g:availability>
      <g:price>${product.price} ${product.sellerCurrency}</g:price>
      ${product.compareAtPrice && parseFloat(product.compareAtPrice) > 0 ? `<g:sale_price>${product.compareAtPrice} ${product.sellerCurrency}</g:sale_price>` : ''}
      <g:condition>new</g:condition>
      <g:brand><![CDATA[${product.sellerName}]]></g:brand>
      <g:product_category><![CDATA[${product.category || 'General'}]]></g:product_category>
      <g:seller_name><![CDATA[${product.sellerName}]]></g:seller_name>
      <g:seller_slug>${product.sellerSlug}</g:slug>
    </item>`).join('\n')}
  </channel>
</rss>`;
  return xml;
}

// Helper function to generate CSV feed
function generateCSVFeed(products: any[]): string {
  const headers = [
    'id', 'name', 'description', 'price', 'compare_at_price', 'currency',
    'category', 'stock_quantity', 'availability', 'image_url', 'product_url',
    'seller_name', 'seller_slug', 'created_at'
  ];
  
  const rows = products.map(product => [
    product.id,
    `"${product.name.replace(/"/g, '""')}"`,
    `"${(product.shortDescription || '').replace(/"/g, '""')}"`,
    product.price,
    product.compareAtPrice || '',
    product.sellerCurrency,
    `"${product.category || ''}"`,
    product.stockQuantity,
    product.stockQuantity > 0 ? 'in_stock' : 'out_of_stock',
    product.imageUrl || '',
    `/s/${product.sellerSlug}/product/${product.id}`,
    `"${product.sellerName.replace(/"/g, '""')}"`,
    product.sellerSlug,
    product.createdAt
  ]);
  
  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

// GET /api/v1/feeds/products - Export product feed
export async function GET(request: NextRequest) {
  const auth = await authenticateApiRequest(request, API_PERMISSIONS.FEEDS_READ);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "json"; // json, csv, xml
    const category = searchParams.get("category");
    const status = searchParams.get("status") || "Published";
    const minPrice = searchParams.get("min_price");
    const maxPrice = searchParams.get("max_price");
    const stockStatus = searchParams.get("stock_status"); // in_stock, out_of_stock, low_stock
    const limit = Math.min(parseInt(searchParams.get("limit") || "1000", 10), 5000);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const includeVariants = searchParams.get("include_variants") === "true";

    const db = getDb();
    
    // Build conditions
    const conditions: any[] = [eq(catalogItems.status, status)];
    
    // Filter by seller if not admin
    if (auth.sellerId) {
      conditions.push(eq(catalogItems.sellerId, auth.sellerId));
    }
    
    if (category) {
      conditions.push(eq(catalogItems.category, category));
    }
    
    if (minPrice) {
      conditions.push(gte(catalogItems.price, minPrice));
    }
    
    if (maxPrice) {
      conditions.push(lte(catalogItems.price, maxPrice));
    }
    
    // Stock status filters
    switch (stockStatus) {
      case 'in_stock':
        conditions.push(sql`${catalogItems.stockQuantity} > 0`);
        break;
      case 'out_of_stock':
        conditions.push(eq(catalogItems.stockQuantity, 0));
        break;
      case 'low_stock':
        conditions.push(
          sql`${catalogItems.stockQuantity} > 0 AND ${catalogItems.stockQuantity} <= ${catalogItems.lowStockThreshold}`
        );
        break;
    }

    // Get products
    const productsQuery = db
      .select({
        id: catalogItems.id,
        name: catalogItems.name,
        type: catalogItems.type,
        price: catalogItems.price,
        compareAtPrice: catalogItems.compareAtPrice,
        status: catalogItems.status,
        imageUrl: catalogItems.imageUrl,
        imageUrls: catalogItems.imageUrls,
        shortDescription: catalogItems.shortDescription,
        category: catalogItems.category,
        stockQuantity: catalogItems.stockQuantity,
        trackInventory: catalogItems.trackInventory,
        lowStockThreshold: catalogItems.lowStockThreshold,
        hasVariants: catalogItems.hasVariants,
        createdAt: catalogItems.createdAt,
        sellerId: catalogItems.sellerId,
        sellerName: sellers.name,
        sellerSlug: sellers.slug,
        sellerCurrency: sellers.currency,
      })
      .from(catalogItems)
      .leftJoin(sellers, eq(catalogItems.sellerId, sellers.id))
      .where(and(...conditions))
      .orderBy(catalogItems.createdAt)
      .limit(limit)
      .offset(offset);

    const products = await productsQuery;

    // Add variants if requested
    let feedData = products;
    if (includeVariants) {
      const productIds = products.map(p => p.id);
      const variants = productIds.length > 0 
        ? await db
            .select({
              id: productVariants.id,
              productId: productVariants.productId,
              name: productVariants.name,
              sku: productVariants.sku,
              price: productVariants.price,
              compareAtPrice: productVariants.compareAtPrice,
              stockQuantity: productVariants.stockQuantity,
              imageUrl: productVariants.imageUrl,
              attributes: productVariants.attributes,
              active: productVariants.active,
            })
            .from(productVariants)
            .where(sql`${productVariants.productId} = ANY(${productIds})`)
        : [];

      // Create expanded feed with variants as separate items
      const expandedFeed: any[] = [];
      
      products.forEach(product => {
        const productVariants = variants.filter(v => v.productId === product.id);
        
        if (productVariants.length > 0) {
          // Add each variant as a separate item
          productVariants.forEach(variant => {
            expandedFeed.push({
              ...product,
              id: `${product.id}_${variant.id}`,
              name: `${product.name} - ${variant.name}`,
              price: variant.price,
              compareAtPrice: variant.compareAtPrice,
              stockQuantity: variant.stockQuantity,
              imageUrl: variant.imageUrl || product.imageUrl,
              sku: variant.sku,
              attributes: variant.attributes,
              variantId: variant.id,
              parentProductId: product.id,
            });
          });
        } else {
          // Add product without variants
          expandedFeed.push(product);
        }
      });
      
      feedData = expandedFeed;
    }

    // Get base URL for full URLs
    const baseUrl = request.headers.get('origin') || 'https://myshop.com';

    // Generate appropriate response based on format
    switch (format.toLowerCase()) {
      case 'csv':
        const csvContent = generateCSVFeed(feedData);
        return new NextResponse(csvContent, {
          status: 200,
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="products-feed-${new Date().toISOString().split('T')[0]}.csv"`,
          },
        });

      case 'xml':
        const xmlContent = generateXMLFeed(feedData, baseUrl);
        return new NextResponse(xmlContent, {
          status: 200,
          headers: {
            'Content-Type': 'application/xml',
            'Content-Disposition': `attachment; filename="products-feed-${new Date().toISOString().split('T')[0]}.xml"`,
          },
        });

      case 'json':
      default:
        return NextResponse.json({
          data: feedData,
          meta: {
            total: feedData.length,
            format,
            generatedAt: new Date().toISOString(),
            filters: {
              category,
              status,
              minPrice,
              maxPrice,
              stockStatus,
              includeVariants,
            },
          },
        });
    }
    
  } catch (error) {
    console.error("Feed API error:", error);
    return NextResponse.json(
      { error: "Failed to generate product feed" },
      { status: 500 }
    );
  }
}