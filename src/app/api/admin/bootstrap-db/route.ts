import { NextRequest, NextResponse } from 'next/server';
import { neon } from "@neondatabase/serverless";

export async function POST(request: NextRequest) {
  try {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error("DATABASE_URL is not configured");
    }
    
    const sql = neon(url);
    console.log('Starting database bootstrap migration...');

    // Step 1: Create users table
    console.log('Creating users table...');
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(256) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name VARCHAR(256) NOT NULL,
        phone VARCHAR(64) DEFAULT '',
        avatar_url TEXT DEFAULT '',
        city VARCHAR(256) DEFAULT '',
        country VARCHAR(64) DEFAULT '',
        role VARCHAR(32) DEFAULT 'user',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `;

    // Step 2: Create stores table
    console.log('Creating stores table...');
    await sql`
      CREATE TABLE IF NOT EXISTS stores (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        slug VARCHAR(128) UNIQUE NOT NULL,
        name VARCHAR(256) NOT NULL,
        description TEXT DEFAULT '',
        logo_url TEXT DEFAULT '',
        banner_url TEXT DEFAULT '',
        business_type VARCHAR(128) DEFAULT 'Retail',
        currency VARCHAR(16) DEFAULT 'USD',
        social_links JSONB DEFAULT '{}',
        plan VARCHAR(32) DEFAULT 'free',
        theme_color VARCHAR(32) DEFAULT 'indigo',
        store_template VARCHAR(32) DEFAULT 'classic',
        header_template VARCHAR(32) DEFAULT 'compact',
        business_hours JSONB DEFAULT '{}',
        address TEXT DEFAULT '',
        city VARCHAR(256) DEFAULT '',
        country VARCHAR(64) DEFAULT '',
        email_notifications BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `;

    // Step 3: Create legacy sellers table for backward compatibility
    console.log('Creating sellers table (legacy)...');
    await sql`
      CREATE TABLE IF NOT EXISTS sellers (
        id SERIAL PRIMARY KEY,
        slug VARCHAR(128) UNIQUE NOT NULL,
        email VARCHAR(256) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name VARCHAR(256) NOT NULL,
        description TEXT DEFAULT '',
        logo_url TEXT DEFAULT '',
        banner_url TEXT DEFAULT '',
        owner_name VARCHAR(256) DEFAULT '',
        business_type VARCHAR(128) DEFAULT 'Retail',
        currency VARCHAR(16) DEFAULT 'USD',
        social_links JSONB DEFAULT '{}',
        plan VARCHAR(32) DEFAULT 'free',
        theme_color VARCHAR(32) DEFAULT 'indigo',
        store_template VARCHAR(32) DEFAULT 'classic',
        header_template VARCHAR(32) DEFAULT 'compact',
        business_hours JSONB DEFAULT '{}',
        address TEXT DEFAULT '',
        city VARCHAR(256) DEFAULT '',
        country VARCHAR(64) DEFAULT '',
        email_notifications BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `;

    // Step 4: Create customers table (legacy)
    console.log('Creating customers table (legacy)...');
    await sql`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(256) NOT NULL,
        email VARCHAR(256) UNIQUE NOT NULL,
        phone VARCHAR(64) DEFAULT '',
        password_hash TEXT,
        address TEXT DEFAULT '',
        city VARCHAR(256) DEFAULT '',
        country VARCHAR(64) DEFAULT '',
        avatar_url TEXT DEFAULT '',
        email_notifications BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `;

    // Step 5: Create catalog_items table
    console.log('Creating catalog_items table...');
    await sql`
      CREATE TABLE IF NOT EXISTS catalog_items (
        id SERIAL PRIMARY KEY,
        seller_id INTEGER NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
        name VARCHAR(256) NOT NULL,
        description TEXT DEFAULT '',
        price NUMERIC(10, 2) NOT NULL,
        category VARCHAR(256) DEFAULT '',
        tags TEXT DEFAULT '',
        images JSONB DEFAULT '[]',
        stock_quantity INTEGER DEFAULT 0,
        min_order_quantity INTEGER DEFAULT 1,
        max_order_quantity INTEGER DEFAULT -1,
        weight NUMERIC(8, 2) DEFAULT 0,
        dimensions VARCHAR(256) DEFAULT '',
        sku VARCHAR(128) DEFAULT '',
        status VARCHAR(32) DEFAULT 'active',
        featured BOOLEAN DEFAULT FALSE,
        sort_order INTEGER DEFAULT 0,
        variant_type VARCHAR(64) DEFAULT '',
        variant_values JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `;

    // Step 6: Create orders table
    console.log('Creating orders table...');
    await sql`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        seller_id INTEGER NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
        customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
        customer_name VARCHAR(256) NOT NULL,
        customer_email VARCHAR(256) NOT NULL,
        customer_phone VARCHAR(64) DEFAULT '',
        customer_address TEXT DEFAULT '',
        message TEXT DEFAULT '',
        total_amount NUMERIC(10, 2) DEFAULT 0,
        status VARCHAR(32) DEFAULT 'pending',
        tracking_token VARCHAR(128) DEFAULT '',
        shipping_cost NUMERIC(8, 2) DEFAULT 0,
        discount_amount NUMERIC(8, 2) DEFAULT 0,
        notes TEXT DEFAULT '',
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `;

    // Step 7: Create basic indexes
    console.log('Creating indexes...');
    await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_stores_user_id ON stores(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_stores_slug ON stores(slug)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_sellers_email ON sellers(email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_sellers_slug ON sellers(slug)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_catalog_items_seller_id ON catalog_items(seller_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_catalog_items_status ON catalog_items(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON orders(seller_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_orders_tracking_token ON orders(tracking_token)`;

    console.log('Database bootstrap completed successfully!');

    return NextResponse.json({ 
      success: true,
      message: 'Database bootstrap completed successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Bootstrap error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during bootstrap'
      },
      { status: 500 }
    );
  }
}