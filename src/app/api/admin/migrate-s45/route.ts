import { NextRequest, NextResponse } from 'next/server';
import { neon } from "@neondatabase/serverless";

export async function POST(request: NextRequest) {
  try {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error("DATABASE_URL is not configured");
    }
    
    const sql = neon(url);
    console.log('Starting shipping zones and methods migration (S45)...');

    // Step 1: Create shipping zones table
    console.log('Creating shipping zones table...');
    await sql`
      CREATE TABLE IF NOT EXISTS shipping_zones (
        id SERIAL PRIMARY KEY,
        seller_id INTEGER NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
        name VARCHAR(256) NOT NULL,
        regions JSONB DEFAULT '[]',
        countries JSONB DEFAULT '[]',
        active BOOLEAN DEFAULT true,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `;

    // Step 2: Create shipping methods table
    console.log('Creating shipping methods table...');
    await sql`
      CREATE TABLE IF NOT EXISTS shipping_methods (
        id SERIAL PRIMARY KEY,
        seller_id INTEGER NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
        zone_id INTEGER NOT NULL REFERENCES shipping_zones(id) ON DELETE CASCADE,
        name VARCHAR(256) NOT NULL,
        type VARCHAR(32) NOT NULL DEFAULT 'flat_rate',
        rate NUMERIC(10, 2) DEFAULT 0,
        free_shipping_min_order NUMERIC(10, 2) DEFAULT 0,
        estimated_days INTEGER DEFAULT 3,
        max_weight NUMERIC(8, 2) DEFAULT 0,
        pickup_address TEXT DEFAULT '',
        pickup_instructions TEXT DEFAULT '',
        active BOOLEAN DEFAULT true,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `;

    // Step 3: Add shipping fields to orders table
    console.log('Adding shipping fields to orders table...');
    
    // Check if columns exist first and add them if they don't
    try {
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_method_id INTEGER REFERENCES shipping_methods(id)`;
    } catch (e) {
      console.log('shipping_method_id column might already exist');
    }
    
    try {
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_cost NUMERIC(10, 2) DEFAULT 0`;
    } catch (e) {
      console.log('shipping_cost column might already exist');
    }
    
    try {
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address JSONB`;
    } catch (e) {
      console.log('shipping_address column might already exist');
    }
    
    try {
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_delivery TIMESTAMP WITH TIME ZONE`;
    } catch (e) {
      console.log('estimated_delivery column might already exist');
    }
    
    try {
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(128) DEFAULT ''`;
    } catch (e) {
      console.log('tracking_number column might already exist');
    }

    // Step 4: Create indexes
    console.log('Creating indexes...');
    await sql`CREATE INDEX IF NOT EXISTS idx_shipping_zones_seller_id ON shipping_zones(seller_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_shipping_methods_seller_id ON shipping_methods(seller_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_shipping_methods_zone_id ON shipping_methods(zone_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_orders_shipping_method_id ON orders(shipping_method_id)`;

    // Step 5: Insert default shipping zones and methods for existing sellers
    console.log('Creating default shipping zones for existing sellers...');
    const defaultZonesResult = await sql`
      INSERT INTO shipping_zones (seller_id, name, regions, countries, active, sort_order)
      SELECT 
        s.id as seller_id,
        'Local Delivery' as name,
        CASE 
          WHEN s.city != '' THEN jsonb_build_array(s.city)
          ELSE '["Local Area"]'::jsonb
        END as regions,
        CASE 
          WHEN s.country != '' THEN jsonb_build_array(s.country)
          ELSE '["Mozambique"]'::jsonb
        END as countries,
        true as active,
        0 as sort_order
      FROM sellers s
      WHERE NOT EXISTS (
        SELECT 1 FROM shipping_zones sz WHERE sz.seller_id = s.id
      )
      RETURNING id
    `;

    console.log('Creating default shipping methods...');
    const defaultMethodsResult = await sql`
      INSERT INTO shipping_methods (seller_id, zone_id, name, type, rate, estimated_days, active, sort_order)
      SELECT 
        sz.seller_id,
        sz.id as zone_id,
        'Standard Delivery' as name,
        'flat_rate' as type,
        50.00 as rate,
        3 as estimated_days,
        true as active,
        0 as sort_order
      FROM shipping_zones sz
      WHERE NOT EXISTS (
        SELECT 1 FROM shipping_methods sm WHERE sm.zone_id = sz.id
      )
      RETURNING id
    `;

    console.log('Migration completed successfully! ✅');

    return NextResponse.json({
      success: true,
      message: 'Shipping migration completed successfully',
      summary: {
        tablesCreated: ['shipping_zones', 'shipping_methods'],
        fieldsAdded: ['shipping_method_id', 'shipping_cost', 'shipping_address', 'estimated_delivery', 'tracking_number'],
        indexesCreated: 4
      }
    });

  } catch (error) {
    console.error('Migration failed:', error);
    return NextResponse.json(
      { 
        error: 'Migration failed', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}