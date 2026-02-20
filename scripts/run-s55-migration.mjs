import { neon } from '@neondatabase/serverless';

async function runS55Migration() {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    console.error('DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const sql = neon(DATABASE_URL);

  try {
    console.log('🚀 Starting S55 migration: API Keys and Webhooks...');

    // Create API Keys table
    console.log('Creating api_keys table...');
    await sql`
      CREATE TABLE IF NOT EXISTS api_keys (
        id SERIAL PRIMARY KEY,
        store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
        seller_id INTEGER REFERENCES sellers(id) ON DELETE CASCADE, -- Legacy support
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        
        -- Key details
        name VARCHAR(256) NOT NULL, -- User-friendly name
        key_hash VARCHAR(512) NOT NULL, -- Hashed API key
        key_prefix VARCHAR(16) NOT NULL, -- First few chars for display (e.g., "mk_123456...")
        
        -- Permissions
        permissions JSONB DEFAULT '[]', -- ['products:read', 'products:write', 'orders:read', etc.]
        
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
        expires_at TIMESTAMP WITH TIME ZONE -- Optional expiration
      )
    `;

    // Create indexes for API keys
    console.log('Creating indexes for api_keys...');
    await sql`CREATE INDEX IF NOT EXISTS idx_api_keys_store_id ON api_keys(store_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_api_keys_seller_id ON api_keys(seller_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON api_keys(is_active)`;

    // Create Webhooks table
    console.log('Creating webhooks table...');
    await sql`
      CREATE TABLE IF NOT EXISTS webhooks (
        id SERIAL PRIMARY KEY,
        store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
        seller_id INTEGER REFERENCES sellers(id) ON DELETE CASCADE, -- Legacy support
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        
        -- Webhook details
        name VARCHAR(256) NOT NULL, -- User-friendly name
        url TEXT NOT NULL, -- Webhook endpoint URL
        
        -- Events
        events JSONB DEFAULT '[]', -- ['order.created', 'order.paid', 'order.shipped', etc.]
        
        -- Security
        secret VARCHAR(128) NOT NULL, -- Used for HMAC signature
        
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

    // Create indexes for webhooks
    console.log('Creating indexes for webhooks...');
    await sql`CREATE INDEX IF NOT EXISTS idx_webhooks_store_id ON webhooks(store_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_webhooks_seller_id ON webhooks(seller_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_webhooks_user_id ON webhooks(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_webhooks_is_active ON webhooks(is_active)`;

    // Create Webhook Deliveries table
    console.log('Creating webhook_deliveries table...');
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
        status VARCHAR(32) NOT NULL, -- 'pending', 'success', 'failure', 'retry'
        retry_count INTEGER DEFAULT 0,
        next_retry_at TIMESTAMP WITH TIME ZONE,
        
        -- Timing
        delivered_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `;

    // Create indexes for webhook deliveries
    console.log('Creating indexes for webhook_deliveries...');
    await sql`CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook_id ON webhook_deliveries(webhook_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON webhook_deliveries(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_event_type ON webhook_deliveries(event_type)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_created_at ON webhook_deliveries(created_at)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_next_retry_at ON webhook_deliveries(next_retry_at)`;

    console.log('✅ S55 migration completed successfully!');
    console.log('');
    console.log('📋 Tables created:');
    console.log('- api_keys: For REST API access authentication');
    console.log('- webhooks: For order status change notifications');
    console.log('- webhook_deliveries: For webhook delivery logging');
    console.log('');
    console.log('🔧 Next steps:');
    console.log('1. Build /api/v1/products REST API');
    console.log('2. Build webhook management UI');
    console.log('3. Build API key management UI');
    console.log('4. Test webhook delivery system');

  } catch (error) {
    console.error('❌ S55 migration failed:', error);
    throw error;
  }
}

runS55Migration().catch(console.error);