import { NextRequest, NextResponse } from "next/server";
import { getUnifiedSession } from "@/lib/unified-session";
import { getDb } from "@/lib/db";
import { stores, catalogItems } from "@/lib/schema";
import { eq } from "drizzle-orm";

interface CSVRow {
  name: string;
  price: string;
  description: string;
  category: string;
  stockQuantity: string;
  imageUrl?: string;
}

function parseCSV(csvText: string): CSVRow[] {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const rows: CSVRow[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    if (values.length < headers.length) continue;
    
    const row: any = {};
    headers.forEach((header, index) => {
      const key = header.toLowerCase().replace(/\s+/g, '');
      row[key] = values[index] || '';
    });
    
    // Map to expected structure
    rows.push({
      name: row.name || row.productname || '',
      price: row.price || '0',
      description: row.description || '',
      category: row.category || 'General',
      stockQuantity: row.stockquantity || row.stock || '0',
      imageUrl: row.imageurl || row.image || '',
    });
  }
  
  return rows.filter(row => row.name); // Only include rows with names
}

export async function POST(request: NextRequest) {
  try {
    const session = await getUnifiedSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const db = getDb();

    // Get user's store
    const userStores = await db
      .select()
      .from(stores)
      .where(eq(stores.userId, session.userId))
      .limit(1);

    if (!userStores.length) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const store = userStores[0];

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      return NextResponse.json({ error: "Invalid file type. Please upload a CSV file." }, { status: 400 });
    }

    const csvText = await file.text();
    const rows = parseCSV(csvText);

    if (!rows.length) {
      return NextResponse.json({ error: "No valid products found in CSV file" }, { status: 400 });
    }

    // Import products
    const imported = [];
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const price = parseFloat(row.price) || 0;
        const stockQuantity = parseInt(row.stockQuantity) || 0;

        if (!row.name.trim()) {
          errors.push(`Row ${i + 2}: Product name is required`);
          continue;
        }

        if (price <= 0) {
          errors.push(`Row ${i + 2}: Invalid price for "${row.name}"`);
          continue;
        }

        // Note: Using sellerId for backward compatibility with existing schema
        // In the new schema, this should reference the store, but keeping it simple for now
        const [product] = await db
          .insert(catalogItems)
          .values({
            sellerId: store.id, // This maps to the store ID in the current schema
            name: row.name.trim(),
            price: price.toString(),
            shortDescription: row.description.trim() || '',
            category: row.category.trim() || 'General',
            stockQuantity: stockQuantity >= 0 ? stockQuantity : -1, // -1 means no tracking
            trackInventory: stockQuantity >= 0,
            imageUrl: row.imageUrl?.trim() || '',
            status: 'Published',
          })
          .returning();

        imported.push(product);
      } catch (error) {
        console.error('Error importing product:', error);
        errors.push(`Row ${i + 2}: Failed to import "${row.name}"`);
      }
    }

    return NextResponse.json({
      success: true,
      imported: imported.length,
      errors,
      products: imported,
    });
  } catch (error) {
    console.error("CSV import error:", error);
    return NextResponse.json({ error: "Failed to import products" }, { status: 500 });
  }
}