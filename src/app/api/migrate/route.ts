import { NextRequest, NextResponse } from "next/server";

const NEON_API_URL = "https://neon.tech/api/v1/databases/query";

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    
    if (action !== "add_referral_tables") {
      return NextResponse.json({ error: "Invalid migration action" }, { status: 400 });
    }

    // Get database connection info
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return NextResponse.json({ error: "Database URL not found" }, { status: 500 });
    }

    // Parse database URL to get connection details
    const url = new URL(databaseUrl);
    
    // Create the SQL for adding referral system tables
    const migrationSQL = `
-- Create referral programs table
CREATE TABLE IF NOT EXISTS referral_programs (
  id SERIAL PRIMARY KEY,
  store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
  seller_id INTEGER REFERENCES sellers(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  name VARCHAR(256) DEFAULT 'Referral Program',
  description TEXT DEFAULT '',
  referrer_reward_type VARCHAR(32) DEFAULT 'percentage',
  referrer_reward_value NUMERIC(8,2) DEFAULT 10.00,
  referred_reward_type VARCHAR(32) DEFAULT 'percentage',
  referred_reward_value NUMERIC(8,2) DEFAULT 5.00,
  max_referrals INTEGER DEFAULT -1,
  max_reward_amount NUMERIC(10,2) DEFAULT 0,
  validity_days INTEGER DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create referral links table
CREATE TABLE IF NOT EXISTS referral_links (
  id SERIAL PRIMARY KEY,
  program_id INTEGER NOT NULL REFERENCES referral_programs(id) ON DELETE CASCADE,
  store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
  seller_id INTEGER REFERENCES sellers(id) ON DELETE CASCADE,
  code VARCHAR(64) NOT NULL UNIQUE,
  target_url TEXT,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  total_revenue NUMERIC(12,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create referral tracking table
CREATE TABLE IF NOT EXISTS referral_tracking (
  id SERIAL PRIMARY KEY,
  link_id INTEGER NOT NULL REFERENCES referral_links(id) ON DELETE CASCADE,
  visitor_id VARCHAR(128),
  ip_address VARCHAR(45),
  user_agent TEXT,
  referrer TEXT,
  action VARCHAR(32) NOT NULL,
  order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
  customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  order_value NUMERIC(12,2) DEFAULT 0,
  reward_amount NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create email campaigns table (UI only)
CREATE TABLE IF NOT EXISTS email_campaigns (
  id SERIAL PRIMARY KEY,
  store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
  seller_id INTEGER REFERENCES sellers(id) ON DELETE CASCADE,
  name VARCHAR(256) NOT NULL,
  subject VARCHAR(256) NOT NULL,
  content TEXT NOT NULL,
  audience_type VARCHAR(32) DEFAULT 'all',
  audience_filter JSONB DEFAULT '{}',
  status VARCHAR(32) DEFAULT 'draft',
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  estimated_recipients INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_referral_programs_store_id ON referral_programs(store_id);
CREATE INDEX IF NOT EXISTS idx_referral_programs_seller_id ON referral_programs(seller_id);
CREATE INDEX IF NOT EXISTS idx_referral_links_program_id ON referral_links(program_id);
CREATE INDEX IF NOT EXISTS idx_referral_links_code ON referral_links(code);
CREATE INDEX IF NOT EXISTS idx_referral_tracking_link_id ON referral_tracking(link_id);
CREATE INDEX IF NOT EXISTS idx_referral_tracking_visitor_id ON referral_tracking(visitor_id);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_store_id ON email_campaigns(store_id);
`;

    // Execute migration using direct SQL query
    const { Pool } = await import('pg');
    const pool = new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false }
    });

    try {
      await pool.query(migrationSQL);
      await pool.end();
      
      return NextResponse.json({ 
        success: true, 
        message: "Referral system tables created successfully" 
      });
    } catch (dbError: any) {
      await pool.end();
      throw dbError;
    }

  } catch (error: any) {
    console.error("Migration error:", error);
    return NextResponse.json(
      { error: "Migration failed", details: error.message },
      { status: 500 }
    );
  }
}