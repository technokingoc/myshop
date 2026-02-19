import { neon } from '@neondatabase/serverless';

async function runMigration() {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    console.error('DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const sql = neon(DATABASE_URL);

  try {
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
    
    // Check if columns exist first
    const orderColumns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'orders'
    `;
    const existingColumns = orderColumns.map(row => row.column_name);

    if (!existingColumns.includes('shipping_method_id')) {
      await sql`ALTER TABLE orders ADD COLUMN shipping_method_id INTEGER REFERENCES shipping_methods(id)`;
    }
    
    if (!existingColumns.includes('shipping_cost')) {
      await sql`ALTER TABLE orders ADD COLUMN shipping_cost NUMERIC(10, 2) DEFAULT 0`;
    }
    
    if (!existingColumns.includes('shipping_address')) {
      await sql`ALTER TABLE orders ADD COLUMN shipping_address JSONB`;
    }
    
    if (!existingColumns.includes('estimated_delivery')) {
      await sql`ALTER TABLE orders ADD COLUMN estimated_delivery TIMESTAMP WITH TIME ZONE`;
    }
    
    if (!existingColumns.includes('tracking_number')) {
      await sql`ALTER TABLE orders ADD COLUMN tracking_number VARCHAR(128) DEFAULT ''`;
    }

    // Step 4: Create indexes
    console.log('Creating indexes...');
    await sql`CREATE INDEX IF NOT EXISTS idx_shipping_zones_seller_id ON shipping_zones(seller_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_shipping_methods_seller_id ON shipping_methods(seller_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_shipping_methods_zone_id ON shipping_methods(zone_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_orders_shipping_method_id ON orders(shipping_method_id)`;

    // Step 5: Insert default shipping zones and methods for existing sellers
    console.log('Creating default shipping zones for existing sellers...');
    const defaultZones = await sql`
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
    console.log(`Created ${defaultZones.length} default shipping zones`);

    console.log('Creating default shipping methods...');
    const defaultMethods = await sql`
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
    console.log(`Created ${defaultMethods.length} default shipping methods`);

    console.log('Migration completed successfully! ✅');
    console.log('');
    console.log('Summary:');
    console.log(`- Created shipping_zones table`);
    console.log(`- Created shipping_methods table`);
    console.log(`- Added shipping fields to orders table`);
    console.log(`- Created ${defaultZones.length} default zones`);
    console.log(`- Created ${defaultMethods.length} default methods`);

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

runMigration().catch(console.error);