-- Migration: Create rate limiting tables for Sprint S55
-- Date: 2026-02-20
-- Description: Add tables for API rate limiting and webhook delivery tracking

-- Rate limit requests tracking
CREATE TABLE IF NOT EXISTS rate_limit_requests (
  id SERIAL PRIMARY KEY,
  identifier VARCHAR(255) NOT NULL, -- ip:xxx.xxx.xxx.xxx or api_key:123
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  
  -- Indexes for performance
  INDEX idx_rate_limit_identifier (identifier),
  INDEX idx_rate_limit_created_at (created_at)
);

-- Add rate limiting fields to api_keys table (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'api_keys' AND column_name = 'rate_limit_per_day') THEN
    ALTER TABLE api_keys ADD COLUMN rate_limit_per_day INTEGER DEFAULT 1000;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'api_keys' AND column_name = 'daily_usage_count') THEN
    ALTER TABLE api_keys ADD COLUMN daily_usage_count INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'api_keys' AND column_name = 'daily_usage_date') THEN
    ALTER TABLE api_keys ADD COLUMN daily_usage_date DATE DEFAULT CURRENT_DATE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'api_keys' AND column_name = 'usage_count') THEN
    ALTER TABLE api_keys ADD COLUMN usage_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Webhooks table (if not exists)
CREATE TABLE IF NOT EXISTS webhooks (
  id SERIAL PRIMARY KEY,
  store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
  seller_id INTEGER REFERENCES sellers(id) ON DELETE CASCADE,
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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_webhooks_store_id (store_id),
  INDEX idx_webhooks_seller_id (seller_id),
  INDEX idx_webhooks_active (is_active),
  INDEX idx_webhooks_events (events)
);

-- Webhook deliveries table (if not exists)
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id SERIAL PRIMARY KEY,
  webhook_id INTEGER REFERENCES webhooks(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  event_data JSONB NOT NULL DEFAULT '{}',
  url TEXT NOT NULL,
  http_method VARCHAR(10) DEFAULT 'POST',
  headers JSONB DEFAULT '{}',
  body TEXT,
  response_status INTEGER,
  response_body TEXT,
  response_headers JSONB DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'pending', -- pending, success, failure, retry
  retry_count INTEGER DEFAULT 0,
  next_retry_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  
  -- Indexes
  INDEX idx_webhook_deliveries_webhook_id (webhook_id),
  INDEX idx_webhook_deliveries_status (status),
  INDEX idx_webhook_deliveries_retry (status, next_retry_at),
  INDEX idx_webhook_deliveries_created_at (created_at)
);

-- Add indexes to existing tables if they don't exist
DO $$
BEGIN
  -- API keys indexes
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_api_keys_store_id') THEN
    CREATE INDEX idx_api_keys_store_id ON api_keys(store_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_api_keys_seller_id') THEN
    CREATE INDEX idx_api_keys_seller_id ON api_keys(seller_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_api_keys_active') THEN
    CREATE INDEX idx_api_keys_active ON api_keys(is_active);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_api_keys_key_prefix') THEN
    CREATE INDEX idx_api_keys_key_prefix ON api_keys(key_prefix);
  END IF;
  
  -- Clean up old rate limit requests periodically
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_rate_limit_cleanup') THEN
    CREATE INDEX idx_rate_limit_cleanup ON rate_limit_requests(created_at) WHERE created_at < NOW() - INTERVAL '24 hours';
  END IF;
END $$;

-- Add useful constraints
ALTER TABLE webhooks ADD CONSTRAINT check_webhook_timeout 
  CHECK (timeout_seconds > 0 AND timeout_seconds <= 120);

ALTER TABLE webhooks ADD CONSTRAINT check_webhook_retries 
  CHECK (max_retries >= 0 AND max_retries <= 10);

ALTER TABLE webhook_deliveries ADD CONSTRAINT check_delivery_status 
  CHECK (status IN ('pending', 'success', 'failure', 'retry'));

-- Grant permissions (adjust as needed)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON rate_limit_requests TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON webhooks TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON webhook_deliveries TO your_app_user;

-- Add comments for documentation
COMMENT ON TABLE rate_limit_requests IS 'API rate limiting request tracking';
COMMENT ON TABLE webhooks IS 'Webhook endpoint configurations';
COMMENT ON TABLE webhook_deliveries IS 'Webhook delivery attempts and responses';

COMMENT ON COLUMN api_keys.rate_limit_per_day IS 'Daily rate limit for this API key';
COMMENT ON COLUMN api_keys.daily_usage_count IS 'Current daily usage count';
COMMENT ON COLUMN api_keys.daily_usage_date IS 'Date of current usage count';
COMMENT ON COLUMN api_keys.usage_count IS 'Total lifetime usage count';