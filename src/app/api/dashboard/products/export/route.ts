import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { catalogItems, productVariants, sellers, stores } from "@/lib/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { getSellerFromSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const sellerId = await getSellerFromSession(request);
    if (!sellerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "csv";
    const includeVariants = searchParams.get("includeVariants") === "true";

    // Fetch products with variants
    const productsQuery = await db
      .select({
        // Product fields
        productId: catalogItems.id,
        productName: catalogItems.name,
        productType: catalogItems.type,
        productStatus: catalogItems.status,
        productPrice: catalogItems.price,
        productCompareAtPrice: catalogItems.compareAtPrice,
        productCategory: catalogItems.category,
        productShortDescription: catalogItems.shortDescription,
        productImageUrl: catalogItems.imageUrl,
        productImageUrls: catalogItems.imageUrls,
        productStockQuantity: catalogItems.stockQuantity,
        productTrackInventory: catalogItems.trackInventory,
        productLowStockThreshold: catalogItems.lowStockThreshold,
        productHasVariants: catalogItems.hasVariants,
        productCreatedAt: catalogItems.createdAt,
        // Variant fields
        variantId: productVariants.id,
        variantName: productVariants.name,
        variantSku: productVariants.sku,
        variantPrice: productVariants.price,
        variantCompareAtPrice: productVariants.compareAtPrice,
        variantStockQuantity: productVariants.stockQuantity,
        variantLowStockThreshold: productVariants.lowStockThreshold,
        variantImageUrl: productVariants.imageUrl,
        variantAttributes: productVariants.attributes,
        variantSortOrder: productVariants.sortOrder,
        variantActive: productVariants.active,
      })
      .from(catalogItems)
      .leftJoin(productVariants, eq(catalogItems.id, productVariants.productId))
      .where(eq(catalogItems.sellerId, sellerId))
      .orderBy(desc(catalogItems.createdAt), productVariants.sortOrder);

    // Transform data for export
    let exportData: any[] = [];

    if (includeVariants) {
      // Include variants as separate rows
      for (const row of productsQuery) {
        if (row.variantId) {
          // Product with variant
          exportData.push({
            productId: row.productId,
            name: row.productName,
            type: row.productType,
            status: row.productStatus,
            category: row.productCategory,
            shortDescription: row.productShortDescription,
            hasVariants: row.productHasVariants,
            variantId: row.variantId,
            variantName: row.variantName,
            sku: row.variantSku,
            price: row.variantPrice,
            compareAtPrice: row.variantCompareAtPrice,
            stockQuantity: row.variantStockQuantity,
            lowStockThreshold: row.variantLowStockThreshold,
            imageUrl: row.variantImageUrl || row.productImageUrl,
            attributes: typeof row.variantAttributes === 'object' 
              ? Object.entries(row.variantAttributes || {}).map(([k, v]) => `${k}:${v}`).join(';')
              : '',
            active: row.variantActive,
            sortOrder: row.variantSortOrder,
            createdAt: row.productCreatedAt,
          });
        } else {
          // Product without variants
          exportData.push({
            productId: row.productId,
            name: row.productName,
            type: row.productType,
            status: row.productStatus,
            category: row.productCategory,
            shortDescription: row.productShortDescription,
            hasVariants: row.productHasVariants,
            variantId: null,
            variantName: '',
            sku: '',
            price: row.productPrice,
            compareAtPrice: row.productCompareAtPrice,
            stockQuantity: row.productStockQuantity,
            lowStockThreshold: row.productLowStockThreshold,
            imageUrl: row.productImageUrl,
            attributes: '',
            active: true,
            sortOrder: 0,
            createdAt: row.productCreatedAt,
          });
        }
      }
    } else {
      // Export products only (no variants)
      const uniqueProducts = new Map();
      for (const row of productsQuery) {
        if (!uniqueProducts.has(row.productId)) {
          uniqueProducts.set(row.productId, {
            productId: row.productId,
            name: row.productName,
            type: row.productType,
            status: row.productStatus,
            category: row.productCategory,
            shortDescription: row.productShortDescription,
            price: row.productPrice,
            compareAtPrice: row.productCompareAtPrice,
            stockQuantity: row.productStockQuantity,
            lowStockThreshold: row.productLowStockThreshold,
            imageUrl: row.productImageUrl,
            imageUrls: row.productImageUrls,
            trackInventory: row.productTrackInventory,
            hasVariants: row.productHasVariants,
            createdAt: row.productCreatedAt,
          });
        }
      }
      exportData = Array.from(uniqueProducts.values());
    }

    if (format === "csv") {
      // Generate CSV
      const csvHeaders = includeVariants 
        ? [
          'Product ID', 'Name', 'Type', 'Status', 'Category', 'Short Description', 'Has Variants',
          'Variant ID', 'Variant Name', 'SKU', 'Price', 'Compare At Price', 'Stock Quantity', 
          'Low Stock Threshold', 'Image URL', 'Attributes', 'Active', 'Sort Order', 'Created At'
        ]
        : [
          'Product ID', 'Name', 'Type', 'Status', 'Category', 'Short Description', 'Price', 
          'Compare At Price', 'Stock Quantity', 'Low Stock Threshold', 'Image URL', 'Image URLs', 
          'Track Inventory', 'Has Variants', 'Created At'
        ];

      const csvRows = [csvHeaders.join(',')];
      
      for (const item of exportData) {
        const row = includeVariants 
          ? [
            item.productId, 
            `"${(item.name || '').replace(/"/g, '""')}"`,
            item.type,
            item.status,
            `"${(item.category || '').replace(/"/g, '""')}"`,
            `"${(item.shortDescription || '').replace(/"/g, '""')}"`,
            item.hasVariants,
            item.variantId || '',
            `"${(item.variantName || '').replace(/"/g, '""')}"`,
            item.sku || '',
            item.price || '',
            item.compareAtPrice || '',
            item.stockQuantity || 0,
            item.lowStockThreshold || 0,
            item.imageUrl || '',
            `"${(item.attributes || '').replace(/"/g, '""')}"`,
            item.active !== false,
            item.sortOrder || 0,
            item.createdAt || ''
          ]
          : [
            item.productId,
            `"${(item.name || '').replace(/"/g, '""')}"`,
            item.type,
            item.status,
            `"${(item.category || '').replace(/"/g, '""')}"`,
            `"${(item.shortDescription || '').replace(/"/g, '""')}"`,
            item.price || '',
            item.compareAtPrice || '',
            item.stockQuantity || 0,
            item.lowStockThreshold || 0,
            item.imageUrl || '',
            item.imageUrls || '',
            item.trackInventory || false,
            item.hasVariants || false,
            item.createdAt || ''
          ];
        csvRows.push(row.join(','));
      }

      const csvContent = csvRows.join('\n');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `products-export-${timestamp}.csv`;

      // Log export activity
      try {
        await db.insert(sql`
          INSERT INTO export_history (seller_id, export_type, filename, record_count, created_at)
          VALUES (${sellerId}, 'products', ${filename}, ${exportData.length}, NOW())
        `);
      } catch (logError) {
        console.warn("Failed to log export activity:", logError);
      }

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': csvContent.length.toString(),
        },
      });
    }

    // JSON format
    return NextResponse.json({
      data: exportData,
      count: exportData.length,
      includeVariants,
      exportedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Failed to export products" },
      { status: 500 }
    );
  }
}