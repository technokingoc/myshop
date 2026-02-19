const { neon } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-http');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL is not set in .env.local');
  process.exit(1);
}

async function migrate() {
  const sql = neon(DATABASE_URL);
  const db = drizzle(sql);
  
  try {
    console.log('Creating promotions table...');
    await sql`
      CREATE TABLE IF NOT EXISTS promotions (
        id SERIAL PRIMARY KEY,
        seller_id INTEGER NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
        title VARCHAR(256) NOT NULL,
        description TEXT DEFAULT '',
        type VARCHAR(32) NOT NULL DEFAULT 'banner',
        banner_image_url TEXT DEFAULT '',
        background_color VARCHAR(16) DEFAULT '#3b82f6',
        text_color VARCHAR(16) DEFAULT '#ffffff',
        link_url TEXT DEFAULT '',
        priority INTEGER DEFAULT 0,
        valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        valid_until TIMESTAMP WITH TIME ZONE,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `;
    
    console.log('Creating flash_sales table...');
    await sql`
      CREATE TABLE IF NOT EXISTS flash_sales (
        id SERIAL PRIMARY KEY,
        seller_id INTEGER NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
        name VARCHAR(256) NOT NULL,
        description TEXT DEFAULT '',
        discount_type VARCHAR(16) NOT NULL DEFAULT 'percentage',
        discount_value NUMERIC(10,2) NOT NULL,
        max_discount NUMERIC(10,2) DEFAULT 0,
        min_order_amount NUMERIC(10,2) DEFAULT 0,
        max_uses INTEGER DEFAULT -1,
        used_count INTEGER DEFAULT 0,
        start_time TIMESTAMP WITH TIME ZONE NOT NULL,
        end_time TIMESTAMP WITH TIME ZONE NOT NULL,
        products TEXT DEFAULT '',
        banner_text VARCHAR(512) DEFAULT '',
        banner_color VARCHAR(16) DEFAULT '#ef4444',
        show_countdown BOOLEAN DEFAULT true,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `;
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();