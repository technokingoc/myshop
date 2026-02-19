import { neon } from '@neondatabase/serverless';

async function runMigration() {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    console.error('DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const sql = neon(DATABASE_URL);

  try {
    console.log('Starting unified user model migration...');

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

    // Step 3: Migrate sellers to users
    console.log('Migrating sellers to users...');
    const sellersResult = await sql`
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
      RETURNING id
    `;
    console.log(`Migrated ${sellersResult.length} sellers to users`);

    // Step 4: Create stores for migrated sellers
    console.log('Creating stores for sellers...');
    const storesResult = await sql`
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
      RETURNING id
    `;
    console.log(`Created ${storesResult.length} stores for sellers`);

    // Step 5: Migrate customers to users
    console.log('Migrating customers to users...');
    const customersResult = await sql`
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
      RETURNING id
    `;
    console.log(`Migrated ${customersResult.length} customers to users`);

    // Step 6: Create indexes
    console.log('Creating indexes...');
    await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_stores_user_id ON stores(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_stores_slug ON stores(slug)`;

    console.log('Migration completed successfully! ✅');
    console.log('');
    console.log('Summary:');
    console.log(`- Created users table`);
    console.log(`- Created stores table`);
    console.log(`- Migrated ${sellersResult.length} sellers → users + stores`);
    console.log(`- Migrated ${customersResult.length} customers → users`);
    console.log('');
    console.log('Next steps:');
    console.log('1. Update foreign key references in dependent tables');
    console.log('2. Test the unified auth system');
    console.log('3. After verification, legacy tables can be dropped');

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

runMigration().catch(console.error);