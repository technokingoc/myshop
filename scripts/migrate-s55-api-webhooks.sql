-- Migration S55: API & Webhooks Infrastructure
-- Date: 2026-02-20
-- Description: Add tables and indexes for Sprint S55 API & Webhooks

-- Rate limit requests tracking
CREATE TABLE IF NOT EXISTS rate_limit_requests (
  id SERIAL PRIMARY KEY,
  identifier VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_identifier ON rate_limit_requests(identifier);
CREATE INDEX IF NOT EXISTS idx_rate_limit_created_at ON rate_limit_requests(created_at);

-- Add rate limiting fields to api_keys table
ALTER TABLE api_keys 
ADD COLUMN IF NOT EXISTS rate_limit_per_day INTEGER DEFAULT 1000,
ADD COLUMN IF NOT EXISTS daily_usage_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS daily_usage_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;

-- Webhooks table
CREATE TABLE IF NOT EXISTS webhooks (
  id SERIAL PRIMARY KEY,
  store_id INTEGER,
  seller_id INTEGER,
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT '{}',
  secret VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  max_retries INTEGER DEFAULT 3,
  timeout_seconds INTEGER DEFAULT 30,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  last_delivery_at TIMESTAMP WITH TIME ZONE,
  last_delivery_status VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Webhook deliveries table
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id SERIAL PRIMARY KEY,
  webhook_id INTEGER,
  event_type VARCHAR(100) NOT NULL,
  event_data JSONB NOT NULL DEFAULT '{}',
  url TEXT NOT NULL,
  http_method VARCHAR(10) DEFAULT 'POST',
  headers JSONB DEFAULT '{}',
  body TEXT,
  response_status INTEGER,
  response_body TEXT,
  response_headers JSONB DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'pending',
  retry_count INTEGER DEFAULT 0,
  next_retry_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_store_id ON api_keys(store_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_seller_id ON api_keys(seller_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_prefix ON api_keys(key_prefix);

CREATE INDEX IF NOT EXISTS idx_webhooks_store_id ON webhooks(store_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_seller_id ON webhooks(seller_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_active ON webhooks(is_active);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook_id ON webhook_deliveries(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON webhook_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_created_at ON webhook_deliveries(created_at);