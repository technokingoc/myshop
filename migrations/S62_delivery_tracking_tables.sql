-- S62 Sprint: Delivery & Shipping Tracking & Integration
-- Add delivery confirmation, order tracking, analytics and notification tables

-- Delivery confirmations table - for buyer confirmation with optional photo proof
CREATE TABLE IF NOT EXISTS delivery_confirmations (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  customer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Confirmation details
  confirmed BOOLEAN DEFAULT FALSE,
  confirmation_date TIMESTAMP WITH TIME ZONE,
  
  -- Photo proof (optional) - JSON array of photo URLs
  photo_urls JSONB DEFAULT '[]'::jsonb,
  notes TEXT DEFAULT '',
  
  -- Delivery details
  delivered_by VARCHAR(256) DEFAULT '',
  delivery_location TEXT DEFAULT '',
  
  -- Ratings (optional)
  delivery_rating INTEGER, -- 1-5 stars for delivery experience
  seller_rating INTEGER, -- 1-5 stars for seller
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enhanced order tracking table
CREATE TABLE IF NOT EXISTS order_tracking (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Enhanced tracking info
  tracking_provider VARCHAR(64) DEFAULT '',
  tracking_url TEXT DEFAULT '',
  
  -- Estimated delivery calculation
  estimated_delivery_start TIMESTAMP WITH TIME ZONE,
  estimated_delivery_end TIMESTAMP WITH TIME ZONE,
  actual_delivery_date TIMESTAMP WITH TIME ZONE,
  
  -- Delivery zone info
  shipping_zone_id INTEGER,
  estimated_days INTEGER DEFAULT 3,
  
  -- Tracking events (external API integration ready)
  last_tracking_check TIMESTAMP WITH TIME ZONE,
  tracking_events JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Delivery analytics table - for admin dashboard
CREATE TABLE IF NOT EXISTS delivery_analytics (
  id SERIAL PRIMARY KEY,
  seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Time period for analytics (daily aggregation)
  analytics_date TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Delivery performance metrics
  total_orders INTEGER DEFAULT 0,
  orders_shipped INTEGER DEFAULT 0,
  orders_delivered INTEGER DEFAULT 0,
  orders_in_transit INTEGER DEFAULT 0,
  delivery_issues INTEGER DEFAULT 0,
  
  -- Timing metrics (in hours)
  avg_processing_time NUMERIC(8,2) DEFAULT 0,
  avg_shipping_time NUMERIC(8,2) DEFAULT 0,
  avg_total_delivery_time NUMERIC(8,2) DEFAULT 0,
  
  -- On-time delivery
  on_time_deliveries INTEGER DEFAULT 0,
  late_deliveries INTEGER DEFAULT 0,
  on_time_delivery_rate NUMERIC(5,2) DEFAULT 0.00,
  
  -- Customer satisfaction
  delivery_ratings_count INTEGER DEFAULT 0,
  avg_delivery_rating NUMERIC(3,2) DEFAULT 0.00,
  confirmation_rate NUMERIC(5,2) DEFAULT 0.00,
  
  -- Geographic data
  top_delivery_zones JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Delivery notifications table
CREATE TABLE IF NOT EXISTS delivery_notifications (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  customer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Notification details
  notification_type VARCHAR(64) NOT NULL,
  status VARCHAR(32) NOT NULL,
  
  -- Channel configuration
  channels JSONB DEFAULT '["email"]'::jsonb,
  
  -- Delivery status
  sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP WITH TIME ZONE,
  
  -- Content
  subject VARCHAR(256) NOT NULL,
  message TEXT NOT NULL,
  
  -- Tracking
  opened BOOLEAN DEFAULT FALSE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked BOOLEAN DEFAULT FALSE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  
  -- Error handling
  delivery_attempts INTEGER DEFAULT 0,
  last_error TEXT DEFAULT '',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_delivery_confirmations_order_id ON delivery_confirmations(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_confirmations_customer_id ON delivery_confirmations(customer_id);

CREATE INDEX IF NOT EXISTS idx_order_tracking_order_id ON order_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_order_tracking_shipping_zone_id ON order_tracking(shipping_zone_id);

CREATE INDEX IF NOT EXISTS idx_delivery_analytics_seller_id ON delivery_analytics(seller_id);
CREATE INDEX IF NOT EXISTS idx_delivery_analytics_date ON delivery_analytics(analytics_date);

CREATE INDEX IF NOT EXISTS idx_delivery_notifications_order_id ON delivery_notifications(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_notifications_customer_id ON delivery_notifications(customer_id);
CREATE INDEX IF NOT EXISTS idx_delivery_notifications_seller_id ON delivery_notifications(seller_id);
CREATE INDEX IF NOT EXISTS idx_delivery_notifications_sent ON delivery_notifications(sent);

-- Add updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_delivery_confirmations_updated_at BEFORE UPDATE ON delivery_confirmations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_order_tracking_updated_at BEFORE UPDATE ON order_tracking FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_delivery_analytics_updated_at BEFORE UPDATE ON delivery_analytics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_delivery_notifications_updated_at BEFORE UPDATE ON delivery_notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();