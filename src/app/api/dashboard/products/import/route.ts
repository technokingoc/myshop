import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { catalogItems, productVariants, sellers, stores } from "@/lib/schema";
import { eq, and, sql } from "drizzle-orm";
import { getSellerFromSession } from "@/lib/auth";

interface ImportRow {
  [key: string]: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
  value?: string;
}

interface ImportResult {
  success: boolean;
  errors: ValidationError[];
  processed: number;
  created: number;
  updated: number;
  skipped: number;
  preview?: any[];
}

export async function POST(request: NextRequest) {
  try {
    const sellerId = await getSellerFromSession(request);
    if (!sellerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const mapping = JSON.parse(formData.get("mapping") as string || "{}");
    const dryRun = formData.get("dryRun") === "true";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Parse CSV
    const csvText = await file.text();
    const lines = csvText.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      return NextResponse.json({ error: "CSV file must contain at least a header and one data row" }, { status: 400 });
    }

    const headers = parseCsvRow(lines[0]);
    const rows = lines.slice(1).map((line, index) => ({
      rowNumber: index + 2,
      data: parseCsvRow(line)
    })).filter(row => row.data.some(cell => cell.trim())); // Filter out empty rows

    // Validate mapping
    const requiredFields = ['name', 'price'];
    const mappingErrors: ValidationError[] = [];
    
    for (const field of requiredFields) {
      if (!mapping[field] || !headers.includes(mapping[field])) {
        mappingErrors.push({
          row: 0,
          field,
          message: `Required field '${field}' is not mapped or column doesn't exist`
        });
      }
    }

    if (mappingErrors.length > 0) {
      return NextResponse.json({
        success: false,
        errors: mappingErrors,
        processed: 0,
        created: 0,
        updated: 0,
        skipped: 0
      });
    }

    // Process rows
    const errors: ValidationError[] = [];
    const validRows: any[] = [];
    const preview: any[] = [];

    for (const row of rows.slice(0, dryRun ? 10 : undefined)) { // Limit preview to 10 rows
      const rowData: any = {};
      
      // Map columns to fields
      for (const [field, columnName] of Object.entries(mapping)) {
        const columnIndex = headers.indexOf(columnName as string);
        if (columnIndex >= 0 && row.data[columnIndex] !== undefined) {
          rowData[field] = row.data[columnIndex].trim();
        }
      }

      // Validate required fields
      if (!rowData.name || !rowData.name.trim()) {
        errors.push({
          row: row.rowNumber,
          field: 'name',
          message: 'Product name is required',
          value: rowData.name
        });
        continue;
      }

      if (!rowData.price || isNaN(parseFloat(rowData.price))) {
        errors.push({
          row: row.rowNumber,
          field: 'price',
          message: 'Valid price is required',
          value: rowData.price
        });
        continue;
      }

      // Validate optional fields
      if (rowData.compareAtPrice && isNaN(parseFloat(rowData.compareAtPrice))) {
        errors.push({
          row: row.rowNumber,
          field: 'compareAtPrice',
          message: 'Compare at price must be a valid number',
          value: rowData.compareAtPrice
        });
        continue;
      }

      if (rowData.stockQuantity && isNaN(parseInt(rowData.stockQuantity))) {
        errors.push({
          row: row.rowNumber,
          field: 'stockQuantity',
          message: 'Stock quantity must be a valid number',
          value: rowData.stockQuantity
        });
        continue;
      }

      // Validate status
      if (rowData.status && !['Draft', 'Published'].includes(rowData.status)) {
        errors.push({
          row: row.rowNumber,
          field: 'status',
          message: 'Status must be either "Draft" or "Published"',
          value: rowData.status
        });
        continue;
      }

      // Add to valid rows
      const processedRow = {
        ...rowData,
        sellerId,
        price: parseFloat(rowData.price),
        compareAtPrice: rowData.compareAtPrice ? parseFloat(rowData.compareAtPrice) : null,
        stockQuantity: rowData.stockQuantity ? parseInt(rowData.stockQuantity) : 0,
        lowStockThreshold: rowData.lowStockThreshold ? parseInt(rowData.lowStockThreshold) : 5,
        status: rowData.status || 'Draft',
        type: rowData.type || 'Product',
        trackInventory: rowData.trackInventory ? rowData.trackInventory.toLowerCase() === 'true' : false,
        hasVariants: rowData.hasVariants ? rowData.hasVariants.toLowerCase() === 'true' : false,
      };

      validRows.push(processedRow);
      
      if (dryRun) {
        preview.push({
          row: row.rowNumber,
          action: rowData.productId ? 'update' : 'create',
          data: processedRow
        });
      }
    }

    if (dryRun) {
      return NextResponse.json({
        success: true,
        errors,
        processed: rows.length,
        created: validRows.filter(r => !r.productId).length,
        updated: validRows.filter(r => r.productId).length,
        skipped: rows.length - validRows.length,
        preview
      });
    }

    // Actually import data if not dry run
    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const rowData of validRows) {
      try {
        if (rowData.productId) {
          // Update existing product
          await db
            .update(catalogItems)
            .set({
              name: rowData.name,
              price: rowData.price.toString(),
              compareAtPrice: rowData.compareAtPrice?.toString() || null,
              category: rowData.category || '',
              shortDescription: rowData.shortDescription || '',
              imageUrl: rowData.imageUrl || '',
              stockQuantity: rowData.stockQuantity,
              lowStockThreshold: rowData.lowStockThreshold,
              status: rowData.status,
              type: rowData.type,
              trackInventory: rowData.trackInventory,
              hasVariants: rowData.hasVariants,
              updatedAt: new Date(),
            })
            .where(and(
              eq(catalogItems.id, parseInt(rowData.productId)),
              eq(catalogItems.sellerId, sellerId)
            ));
          updated++;
        } else {
          // Create new product
          await db.insert(catalogItems).values({
            sellerId,
            name: rowData.name,
            price: rowData.price.toString(),
            compareAtPrice: rowData.compareAtPrice?.toString() || null,
            category: rowData.category || '',
            shortDescription: rowData.shortDescription || '',
            imageUrl: rowData.imageUrl || '',
            stockQuantity: rowData.stockQuantity,
            lowStockThreshold: rowData.lowStockThreshold,
            status: rowData.status,
            type: rowData.type,
            trackInventory: rowData.trackInventory,
            hasVariants: rowData.hasVariants,
          });
          created++;
        }
      } catch (dbError) {
        console.error(`Failed to process row ${rowData.rowNumber}:`, dbError);
        errors.push({
          row: rowData.rowNumber || 0,
          field: 'database',
          message: 'Database error occurred while processing this row'
        });
        skipped++;
      }
    }

    // Log import activity
    try {
      await db.execute(sql`
        INSERT INTO import_history (seller_id, import_type, filename, record_count, created_count, updated_count, error_count, created_at)
        VALUES (${sellerId}, 'products', ${file.name}, ${rows.length}, ${created}, ${updated}, ${errors.length}, NOW())
      `);
    } catch (logError) {
      console.warn("Failed to log import activity:", logError);
    }

    return NextResponse.json({
      success: true,
      errors,
      processed: rows.length,
      created,
      updated,
      skipped,
    });

  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: "Failed to import products" },
      { status: 500 }
    );
  }
}

function parseCsvRow(row: string): string[] {
  const result = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < row.length) {
    const char = row[i];
    
    if (char === '"') {
      if (inQuotes && i + 1 < row.length && row[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i += 2;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current);
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }
  
  result.push(current);
  return result;
}

// Get template CSV
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeVariants = searchParams.get("includeVariants") === "true";

    const templateHeaders = includeVariants
      ? [
        'Product ID', 'Name', 'Type', 'Status', 'Category', 'Short Description', 'Has Variants',
        'Variant ID', 'Variant Name', 'SKU', 'Price', 'Compare At Price', 'Stock Quantity', 
        'Low Stock Threshold', 'Image URL', 'Attributes', 'Active', 'Sort Order'
      ]
      : [
        'Product ID', 'Name', 'Type', 'Status', 'Category', 'Short Description', 'Price', 
        'Compare At Price', 'Stock Quantity', 'Low Stock Threshold', 'Image URL', 'Track Inventory'
      ];

    const sampleData = includeVariants
      ? [
        ['', 'Sample T-Shirt', 'Product', 'Published', 'Clothing', 'Comfortable cotton t-shirt', 'true', '', 'Small - Red', 'TSH-SM-RED', '25.99', '29.99', '50', '5', 'https://example.com/image1.jpg', 'size:Small;color:Red', 'true', '1'],
        ['', 'Sample T-Shirt', 'Product', 'Published', 'Clothing', 'Comfortable cotton t-shirt', 'true', '', 'Medium - Blue', 'TSH-MD-BLUE', '25.99', '29.99', '30', '5', 'https://example.com/image2.jpg', 'size:Medium;color:Blue', 'true', '2'],
        ['', 'Sample Mug', 'Product', 'Draft', 'Home & Kitchen', 'Ceramic coffee mug', 'false', '', '', '', '12.50', '', '100', '10', 'https://example.com/mug.jpg', '', 'true', '']
      ]
      : [
        ['', 'Sample Product 1', 'Product', 'Published', 'Electronics', 'Description of product 1', '99.99', '109.99', '50', '5', 'https://example.com/image1.jpg', 'true'],
        ['', 'Sample Product 2', 'Service', 'Draft', 'Services', 'Description of product 2', '49.99', '', '0', '0', '', 'false'],
      ];

    const csvRows = [templateHeaders.join(',')];
    for (const row of sampleData) {
      csvRows.push(row.map(cell => `"${cell}"`).join(','));
    }

    const csvContent = csvRows.join('\n');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `products-template-${timestamp}.csv`;

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': csvContent.length.toString(),
      },
    });

  } catch (error) {
    console.error("Template download error:", error);
    return NextResponse.json(
      { error: "Failed to generate template" },
      { status: 500 }
    );
  }
}