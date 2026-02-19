import { getDb } from '../src/lib/db.js';
import { sql } from 'drizzle-orm';

async function runMigration() {
  try {
    console.log('Starting unified user model migration...');
    const db = getDb();

    // Step 1: Create new users table
    console.log('Creating users table...');
    await db.execute(sql`
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
    `);

    // Step 2: Create new stores table
    console.log('Creating stores table...');
    await db.execute(sql`
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
    `);

    // Step 3: Migrate existing sellers to users + stores
    console.log('Migrating sellers to users...');
    await db.execute(sql`
      INSERT INTO users (email, password_hash, name, phone, city, country, role, created_at, updated_at)
      SELECT 
        email, 
        password_hash, 
        COALESCE(owner_name, name, 'Store Owner') as name,
        '' as phone,
        city,
        country,
        'user' as role,
        created_at,
        updated_at
      FROM sellers
      WHERE email IS NOT NULL AND password_hash IS NOT NULL
      ON CONFLICT (email) DO NOTHING
    `);

    console.log('Creating stores for migrated sellers...');
    await db.execute(sql`
      INSERT INTO stores (user_id, slug, name, description, logo_url, banner_url, business_type, currency, social_links, plan, theme_color, store_template, header_template, business_hours, address, city, country, email_notifications, created_at, updated_at)
      SELECT 
        u.id as user_id,
        s.slug,
        s.name,
        s.description,
        s.logo_url,
        s.banner_url,
        s.business_type,
        s.currency,
        s.social_links,
        s.plan,
        s.theme_color,
        s.store_template,
        s.header_template,
        s.business_hours,
        s.address,
        s.city,
        s.country,
        s.email_notifications,
        s.created_at,
        s.updated_at
      FROM sellers s
      JOIN users u ON s.email = u.email
      WHERE s.email IS NOT NULL AND s.password_hash IS NOT NULL
    `);

    // Step 4: Migrate existing customers to users
    console.log('Migrating customers to users...');
    await db.execute(sql`
      INSERT INTO users (email, password_hash, name, phone, city, country, role, created_at, updated_at)
      SELECT 
        c.email, 
        c.password_hash, 
        c.name,
        c.phone,
        c.city,
        c.country,
        'user' as role,
        c.created_at,
        NOW() as updated_at
      FROM customers c
      WHERE c.email NOT IN (SELECT email FROM users)
      ON CONFLICT (email) DO NOTHING
    `);

    // Create indexes
    console.log('Creating indexes...');
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_stores_user_id ON stores(user_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_stores_slug ON stores(slug)`);

    console.log('Migration completed successfully! ✅');
    console.log('NOTE: Legacy tables (sellers, customers) are preserved for safety.');
    console.log('You may drop them after verifying the migration worked correctly.');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();