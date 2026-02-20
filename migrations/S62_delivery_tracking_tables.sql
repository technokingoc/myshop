-- S62: Delivery & Shipping: Tracking & Integration

-- Add delivery confirmation fields to orders table if not exists
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS delivery_confirmed BOOLEAN DEFAULT FALSE;

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS delivery_confirmed_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS delivery_photos TEXT DEFAULT '';

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS delivery_rating INTEGER;

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS seller_rating INTEGER;

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS delivered_by VARCHAR(256) DEFAULT '';

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS delivery_location VARCHAR(256) DEFAULT '';

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS delivery_notes TEXT DEFAULT '';

-- Create delivery confirmations table for photo proof and detailed feedback
CREATE TABLE IF NOT EXISTS delivery_confirmations (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  customer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  seller_id INTEGER REFERENCES sellers(id) ON DELETE CASCADE,
  
  -- Confirmation details
  confirmed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  delivery_rating INTEGER CHECK (delivery_rating >= 1 AND delivery_rating <= 5),
  seller_rating INTEGER CHECK (seller_rating >= 1 AND seller_rating <= 5),
  
  -- Delivery details
  delivered_by VARCHAR(256) DEFAULT '',
  delivery_location VARCHAR(512) DEFAULT '',
  delivery_notes TEXT DEFAULT '',
  
  -- Photo evidence
  photo_urls JSONB DEFAULT '[]',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create order tracking table for timeline updates
CREATE TABLE IF NOT EXISTS order_tracking (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  seller_id INTEGER NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  
  -- Status change
  old_status VARCHAR(32),
  new_status VARCHAR(32) NOT NULL,
  status_note TEXT DEFAULT '',
  
  -- Tracking info
  tracking_number VARCHAR(128) DEFAULT '',
  tracking_provider VARCHAR(128) DEFAULT 'Manual',
  tracking_url TEXT DEFAULT '',
  
  -- Location and timing
  location VARCHAR(256) DEFAULT '',
  estimated_delivery TIMESTAMP WITH TIME ZONE,
  
  -- Audit
  updated_by INTEGER REFERENCES users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create delivery analytics table for admin dashboard
CREATE TABLE IF NOT EXISTS delivery_analytics (
  id SERIAL PRIMARY KEY,
  seller_id INTEGER REFERENCES sellers(id) ON DELETE CASCADE,
  analytics_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Order counts by status
  total_orders INTEGER DEFAULT 0,
  confirmed_orders INTEGER DEFAULT 0,
  preparing_orders INTEGER DEFAULT 0,
  shipped_orders INTEGER DEFAULT 0,
  in_transit_orders INTEGER DEFAULT 0,
  delivered_orders INTEGER DEFAULT 0,
  cancelled_orders INTEGER DEFAULT 0,
  
  -- Delivery metrics
  avg_delivery_time_hours INTEGER DEFAULT 0,
  avg_preparation_time_hours INTEGER DEFAULT 0,
  avg_shipping_time_hours INTEGER DEFAULT 0,
  
  -- Delivery confirmation metrics
  delivery_confirmations INTEGER DEFAULT 0,
  delivery_confirmation_rate NUMERIC(5,2) DEFAULT 0.00,
  avg_delivery_rating NUMERIC(3,2) DEFAULT 0.00,
  avg_seller_rating NUMERIC(3,2) DEFAULT 0.00,
  
  -- Issue tracking
  delivery_issues INTEGER DEFAULT 0,
  cancellation_rate NUMERIC(5,2) DEFAULT 0.00,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  UNIQUE(seller_id, analytics_date)
);

-- Create delivery notifications table for SMS/email tracking
CREATE TABLE IF NOT EXISTS delivery_notifications (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  customer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  seller_id INTEGER NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  
  -- Status change details
  old_status VARCHAR(32),
  new_status VARCHAR(32) NOT NULL,
  
  -- Notification tracking
  sms_sent BOOLEAN DEFAULT FALSE,
  sms_sent_at TIMESTAMP WITH TIME ZONE,
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  
  -- Customer contact at time of notification
  customer_phone VARCHAR(64) DEFAULT '',
  customer_email VARCHAR(256) DEFAULT '',
  customer_name VARCHAR(256) DEFAULT '',
  
  -- Message content
  notification_message TEXT DEFAULT '',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_delivery_confirmations_order ON delivery_confirmations(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_confirmations_customer ON delivery_confirmations(customer_id);
CREATE INDEX IF NOT EXISTS idx_order_tracking_order ON order_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_order_tracking_seller ON order_tracking(seller_id);
CREATE INDEX IF NOT EXISTS idx_delivery_analytics_seller_date ON delivery_analytics(seller_id, analytics_date);
CREATE INDEX IF NOT EXISTS idx_delivery_notifications_order ON delivery_notifications(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_notifications_customer ON delivery_notifications(customer_id);

-- Update existing orders to have proper status flow if needed
UPDATE orders SET status = 'placed' WHERE status = 'new';
UPDATE orders SET status = 'confirmed' WHERE status = 'contacted';
UPDATE orders SET status = 'delivered' WHERE status = 'completed';