-- S55 Sprint: API Keys and Webhooks Tables
-- Date: 2026-02-20

-- Create API Keys table
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
);

-- Create indexes for API keys
CREATE INDEX idx_api_keys_store_id ON api_keys(store_id);
CREATE INDEX idx_api_keys_seller_id ON api_keys(seller_id);
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_is_active ON api_keys(is_active);

-- Create Webhooks table
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
);

-- Create indexes for webhooks
CREATE INDEX idx_webhooks_store_id ON webhooks(store_id);
CREATE INDEX idx_webhooks_seller_id ON webhooks(seller_id);
CREATE INDEX idx_webhooks_user_id ON webhooks(user_id);
CREATE INDEX idx_webhooks_is_active ON webhooks(is_active);

-- Create Webhook Deliveries table
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
);

-- Create indexes for webhook deliveries
CREATE INDEX idx_webhook_deliveries_webhook_id ON webhook_deliveries(webhook_id);
CREATE INDEX idx_webhook_deliveries_status ON webhook_deliveries(status);
CREATE INDEX idx_webhook_deliveries_event_type ON webhook_deliveries(event_type);
CREATE INDEX idx_webhook_deliveries_created_at ON webhook_deliveries(created_at);
CREATE INDEX idx_webhook_deliveries_next_retry_at ON webhook_deliveries(next_retry_at);

-- Add comment documentation
COMMENT ON TABLE api_keys IS 'API keys for external access to store inventory and orders';
COMMENT ON TABLE webhooks IS 'Webhook endpoints for order status change notifications';
COMMENT ON TABLE webhook_deliveries IS 'Log of webhook delivery attempts and responses';