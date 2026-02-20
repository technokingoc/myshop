#!/usr/bin/env node

import { neon } from "@neondatabase/serverless";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is required");
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function runMigration() {
  try {
    console.log('Starting S54 Marketing Tools migration...');

    // Affiliate links table
    console.log('Creating affiliate_links table...');
    await sql`
      CREATE TABLE IF NOT EXISTS affiliate_links (
        id SERIAL PRIMARY KEY,
        store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
        seller_id INTEGER REFERENCES sellers(id) ON DELETE CASCADE, -- Legacy support
        product_id INTEGER REFERENCES catalog_items(id) ON DELETE CASCADE,
        
        -- Link details
        code VARCHAR(64) NOT NULL UNIQUE, -- Unique affiliate code
        name VARCHAR(256) NOT NULL,
        description TEXT DEFAULT '',
        
        -- Commission settings
        commission_type VARCHAR(16) DEFAULT 'percentage', -- 'percentage' or 'fixed'
        commission_value NUMERIC(8,2) DEFAULT 10.00,
        
        -- Tracking
        clicks INTEGER DEFAULT 0,
        conversions INTEGER DEFAULT 0,
        total_revenue NUMERIC(12,2) DEFAULT 0,
        total_commission NUMERIC(12,2) DEFAULT 0,
        
        -- Status
        is_active BOOLEAN DEFAULT true,
        expires_at TIMESTAMP WITH TIME ZONE,
        
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `);

    // Affiliate tracking table
    console.log('Creating affiliate_tracking table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS affiliate_tracking (
        id SERIAL PRIMARY KEY,
        link_id INTEGER NOT NULL REFERENCES affiliate_links(id) ON DELETE CASCADE,
        
        -- Visitor tracking
        visitor_id VARCHAR(128), -- Browser fingerprint
        ip_address VARCHAR(45),
        user_agent TEXT,
        referrer TEXT,
        
        -- Action tracking
        action VARCHAR(32) NOT NULL, -- 'click', 'conversion', 'purchase'
        order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
        customer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        
        -- Revenue tracking
        order_value NUMERIC(12,2) DEFAULT 0,
        commission_amount NUMERIC(10,2) DEFAULT 0,
        
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `);

    // Social share tracking table
    console.log('Creating social_shares table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS social_shares (
        id SERIAL PRIMARY KEY,
        store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
        seller_id INTEGER REFERENCES sellers(id) ON DELETE CASCADE, -- Legacy support
        product_id INTEGER REFERENCES catalog_items(id) ON DELETE SET NULL, -- NULL for store shares
        
        -- Share details
        platform VARCHAR(32) NOT NULL, -- 'whatsapp', 'facebook', 'twitter', 'copy_link'
        shared_url TEXT NOT NULL,
        share_title VARCHAR(256) DEFAULT '',
        
        -- Tracking
        visitor_id VARCHAR(128), -- Browser fingerprint
        ip_address VARCHAR(45),
        user_agent TEXT,
        referrer TEXT,
        
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `);

    // Email templates table (for campaign templates)
    console.log('Creating email_templates table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS email_templates (
        id SERIAL PRIMARY KEY,
        store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
        seller_id INTEGER REFERENCES sellers(id) ON DELETE CASCADE, -- Legacy support
        
        -- Template details
        name VARCHAR(256) NOT NULL,
        subject VARCHAR(256) NOT NULL,
        content TEXT NOT NULL, -- HTML content
        preview_text TEXT DEFAULT '', -- Email preview text
        
        -- Template type
        template_type VARCHAR(32) DEFAULT 'custom', -- 'new_product', 'promotion', 'custom'
        
        -- Status
        is_active BOOLEAN DEFAULT true,
        
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `);

    // Email recipients/subscribers table
    console.log('Creating email_subscribers table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS email_subscribers (
        id SERIAL PRIMARY KEY,
        store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
        seller_id INTEGER REFERENCES sellers(id) ON DELETE CASCADE, -- Legacy support
        
        -- Subscriber details
        email VARCHAR(256) NOT NULL,
        name VARCHAR(256) DEFAULT '',
        phone VARCHAR(64) DEFAULT '',
        
        -- Subscription settings
        status VARCHAR(32) DEFAULT 'subscribed', -- 'subscribed', 'unsubscribed', 'bounced'
        source VARCHAR(64) DEFAULT 'manual', -- 'manual', 'import', 'signup', 'purchase'
        
        -- Segmentation
        city VARCHAR(256) DEFAULT '',
        country VARCHAR(64) DEFAULT '',
        tags JSONB DEFAULT '[]',
        
        -- Customer relationship
        customer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        total_purchases INTEGER DEFAULT 0,
        last_purchase_date TIMESTAMP WITH TIME ZONE,
        
        subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        unsubscribed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        
        UNIQUE(store_id, email)
      )
    `);

    // Create indexes for performance
    console.log('Creating indexes...');
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_affiliate_links_store_id ON affiliate_links(store_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_affiliate_links_code ON affiliate_links(code)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_affiliate_tracking_link_id ON affiliate_tracking(link_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_social_shares_store_id ON social_shares(store_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_social_shares_platform ON social_shares(platform)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_email_templates_store_id ON email_templates(store_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_email_subscribers_store_id ON email_subscribers(store_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_email_subscribers_email ON email_subscribers(email)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_email_subscribers_status ON email_subscribers(status)`);

    console.log('S54 Marketing Tools migration completed successfully! ✅');
    console.log('Created tables:');
    console.log('  - affiliate_links');
    console.log('  - affiliate_tracking');
    console.log('  - social_shares');
    console.log('  - email_templates');
    console.log('  - email_subscribers');
    console.log('Marketing tools are now ready to use!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();