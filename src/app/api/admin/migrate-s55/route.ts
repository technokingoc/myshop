// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export async function POST(req: NextRequest) {
  try {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error("DATABASE_URL is not configured");
    }

    const sql = neon(url);
    console.log("Starting Sprint S55 migration...");

    // Step 1: Create API Keys table
    await sql`
      CREATE TABLE IF NOT EXISTS api_keys (
        id SERIAL PRIMARY KEY,
        store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
        seller_id INTEGER REFERENCES sellers(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        
        -- Key details
        name VARCHAR(256) NOT NULL,
        key_hash VARCHAR(512) NOT NULL,
        key_prefix VARCHAR(16) NOT NULL,
        
        -- Permissions
        permissions JSONB DEFAULT '[]',
        
        -- Usage tracking
        last_used_at TIMESTAMP WITH TIME ZONE,
        usage_count INTEGER DEFAULT 0,
        rate_limit_per_day INTEGER DEFAULT 1000,
        
        -- Status
        is_active BOOLEAN DEFAULT true,
        
        -- Metadata
        notes TEXT DEFAULT '',
        
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE
      )
    `;

    // Step 2: Create indexes for API keys
    await sql`CREATE INDEX IF NOT EXISTS idx_api_keys_store_id ON api_keys(store_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_api_keys_seller_id ON api_keys(seller_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON api_keys(is_active)`;

    // Step 3: Create Webhooks table
    await sql`
      CREATE TABLE IF NOT EXISTS webhooks (
        id SERIAL PRIMARY KEY,
        store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
        seller_id INTEGER REFERENCES sellers(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        
        -- Webhook details
        name VARCHAR(256) NOT NULL,
        url TEXT NOT NULL,
        
        -- Events
        events JSONB DEFAULT '[]',
        
        -- Security
        secret VARCHAR(128) NOT NULL,
        
        -- Status and stats
        is_active BOOLEAN DEFAULT true,
        success_count INTEGER DEFAULT 0,
        failure_count INTEGER DEFAULT 0,
        last_delivery_at TIMESTAMP WITH TIME ZONE,
        last_delivery_status VARCHAR(32) DEFAULT 'pending',
        
        -- Settings
        max_retries INTEGER DEFAULT 3,
        timeout_seconds INTEGER DEFAULT 30,
        
        -- Metadata
        notes TEXT DEFAULT '',
        
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `;

    // Step 4: Create indexes for webhooks
    await sql`CREATE INDEX IF NOT EXISTS idx_webhooks_store_id ON webhooks(store_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_webhooks_seller_id ON webhooks(seller_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_webhooks_user_id ON webhooks(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_webhooks_is_active ON webhooks(is_active)`;

    // Step 5: Create Webhook Deliveries table
    await sql`
      CREATE TABLE IF NOT EXISTS webhook_deliveries (
        id SERIAL PRIMARY KEY,
        webhook_id INTEGER NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
        
        -- Event details
        event_type VARCHAR(64) NOT NULL,
        event_data JSONB DEFAULT '{}',
        
        -- Delivery details
        url TEXT NOT NULL,
        http_method VARCHAR(10) DEFAULT 'POST',
        headers JSONB DEFAULT '{}',
        body TEXT NOT NULL,
        
        -- Response details
        response_status INTEGER,
        response_body TEXT DEFAULT '',
        response_headers JSONB DEFAULT '{}',
        
        -- Delivery status
        status VARCHAR(32) NOT NULL,
        retry_count INTEGER DEFAULT 0,
        next_retry_at TIMESTAMP WITH TIME ZONE,
        
        -- Timing
        delivered_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `;

    // Step 6: Create indexes for webhook deliveries
    await sql`CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook_id ON webhook_deliveries(webhook_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON webhook_deliveries(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_event_type ON webhook_deliveries(event_type)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_created_at ON webhook_deliveries(created_at)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_next_retry_at ON webhook_deliveries(next_retry_at)`;

    console.log("Migration S55 completed successfully!");

    return NextResponse.json({ 
      success: true, 
      message: "Sprint S55 migration completed successfully" 
    });

  } catch (error) {
    console.error("Migration failed:", error);
    return NextResponse.json(
      { error: "Migration failed", details: String(error) || "Unknown error" },
      { status: 500 }
    );
  }
}