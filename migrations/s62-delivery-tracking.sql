-- S62: Delivery & Shipping: Tracking & Integration

-- Add delivery confirmation fields to orders table if not exists
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS delivery_confirmed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS delivery_confirmed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS delivery_photos TEXT DEFAULT '', -- JSON array of photo URLs
ADD COLUMN IF NOT EXISTS delivery_rating INTEGER DEFAULT NULL, -- 1-5 rating of delivery experience
ADD COLUMN IF NOT EXISTS seller_rating INTEGER DEFAULT NULL, -- 1-5 rating of seller
ADD COLUMN IF NOT EXISTS delivered_by VARCHAR(256) DEFAULT '', -- courier name/company
ADD COLUMN IF NOT EXISTS delivery_location VARCHAR(256) DEFAULT '', -- delivery location description
ADD COLUMN IF NOT EXISTS delivery_notes TEXT DEFAULT ''; -- customer delivery notes

-- Create delivery analytics table for admin dashboard
CREATE TABLE IF NOT EXISTS delivery_analytics (
  id SERIAL PRIMARY KEY,
  seller_id INTEGER NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  analytics_date DATE NOT NULL, -- Daily aggregation
  
  -- Order counts by status
  total_orders INTEGER DEFAULT 0,
  confirmed_orders INTEGER DEFAULT 0,
  preparing_orders INTEGER DEFAULT 0,
  shipped_orders INTEGER DEFAULT 0,
  in_transit_orders INTEGER DEFAULT 0,
  delivered_orders INTEGER DEFAULT 0,
  cancelled_orders INTEGER DEFAULT 0,
  
  -- Delivery metrics
  avg_delivery_time_hours INTEGER DEFAULT 0, -- Average from confirmed to delivered
  avg_preparation_time_hours INTEGER DEFAULT 0, -- Average from confirmed to shipped
  avg_shipping_time_hours INTEGER DEFAULT 0, -- Average from shipped to delivered
  
  -- Delivery confirmation metrics
  delivery_confirmations INTEGER DEFAULT 0,
  delivery_confirmation_rate NUMERIC(5,2) DEFAULT 0.00, -- % of delivered orders confirmed
  avg_delivery_rating NUMERIC(3,2) DEFAULT 0.00, -- Average delivery rating
  avg_seller_rating NUMERIC(3,2) DEFAULT 0.00, -- Average seller rating
  
  -- Issue tracking
  delivery_issues INTEGER DEFAULT 0, -- Orders with problems/complaints
  cancellation_rate NUMERIC(5,2) DEFAULT 0.00, -- % of orders cancelled
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create index for analytics queries
CREATE INDEX IF NOT EXISTS idx_delivery_analytics_seller_date ON delivery_analytics(seller_id, analytics_date);
CREATE INDEX IF NOT EXISTS idx_delivery_analytics_date ON delivery_analytics(analytics_date);

-- Create delivery status change log table for SMS/notifications
CREATE TABLE IF NOT EXISTS delivery_status_changes (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  seller_id INTEGER NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  customer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  
  -- Status change details
  old_status VARCHAR(32),
  new_status VARCHAR(32) NOT NULL,
  changed_by INTEGER REFERENCES users(id) ON DELETE SET NULL, -- seller who made the change
  change_reason TEXT DEFAULT '',
  
  -- Notification tracking
  sms_sent BOOLEAN DEFAULT FALSE,
  sms_sent_at TIMESTAMP WITH TIME ZONE,
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  push_sent BOOLEAN DEFAULT FALSE,
  push_sent_at TIMESTAMP WITH TIME ZONE,
  
  -- Customer contact info at time of change
  customer_phone VARCHAR(64) DEFAULT '',
  customer_email VARCHAR(256) DEFAULT '',
  customer_name VARCHAR(256) DEFAULT '',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create index for notification queries
CREATE INDEX IF NOT EXISTS idx_delivery_status_changes_order ON delivery_status_changes(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_status_changes_customer ON delivery_status_changes(customer_id);
CREATE INDEX IF NOT EXISTS idx_delivery_status_changes_seller ON delivery_status_changes(seller_id);
CREATE INDEX IF NOT EXISTS idx_delivery_status_changes_notifications ON delivery_status_changes(sms_sent, email_sent, push_sent);

-- Create delivery issue reports table
CREATE TABLE IF NOT EXISTS delivery_issues (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  seller_id INTEGER NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  customer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  
  -- Issue details
  issue_type VARCHAR(64) NOT NULL, -- 'damaged', 'wrong_item', 'not_delivered', 'late_delivery', 'other'
  description TEXT NOT NULL,
  severity VARCHAR(16) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  
  -- Resolution tracking
  status VARCHAR(32) DEFAULT 'open', -- 'open', 'investigating', 'resolved', 'closed'
  resolution TEXT DEFAULT '',
  resolved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  
  -- Photo evidence
  photo_urls TEXT DEFAULT '', -- JSON array of photo URLs
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create index for issue tracking
CREATE INDEX IF NOT EXISTS idx_delivery_issues_order ON delivery_issues(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_issues_seller ON delivery_issues(seller_id);
CREATE INDEX IF NOT EXISTS idx_delivery_issues_status ON delivery_issues(status);

-- Update existing orders to have proper status flow if needed
UPDATE orders 
SET status = 'placed' 
WHERE status = 'new';

UPDATE orders 
SET status = 'confirmed' 
WHERE status = 'contacted';

UPDATE orders 
SET status = 'delivered' 
WHERE status = 'completed';

-- Function to calculate delivery analytics (to be called daily via cron)
CREATE OR REPLACE FUNCTION update_delivery_analytics(target_date DATE DEFAULT CURRENT_DATE - INTERVAL '1 day')
RETURNS void AS $$
DECLARE
  seller_record RECORD;
BEGIN
  -- Process analytics for each seller
  FOR seller_record IN SELECT DISTINCT seller_id FROM orders LOOP
    INSERT INTO delivery_analytics (
      seller_id,
      analytics_date,
      total_orders,
      confirmed_orders,
      preparing_orders,
      shipped_orders,
      in_transit_orders,
      delivered_orders,
      cancelled_orders,
      delivery_confirmations,
      delivery_confirmation_rate,
      avg_delivery_rating,
      avg_seller_rating,
      cancellation_rate
    )
    SELECT
      seller_record.seller_id,
      target_date,
      COUNT(*) FILTER (WHERE DATE(created_at) = target_date),
      COUNT(*) FILTER (WHERE status = 'confirmed' AND DATE(created_at) = target_date),
      COUNT(*) FILTER (WHERE status = 'preparing' AND DATE(created_at) = target_date),
      COUNT(*) FILTER (WHERE status = 'shipped' AND DATE(created_at) = target_date),
      COUNT(*) FILTER (WHERE status = 'in-transit' AND DATE(created_at) = target_date),
      COUNT(*) FILTER (WHERE status = 'delivered' AND DATE(created_at) = target_date),
      COUNT(*) FILTER (WHERE status = 'cancelled' AND DATE(created_at) = target_date),
      COUNT(*) FILTER (WHERE delivery_confirmed = true AND DATE(created_at) = target_date),
      CASE 
        WHEN COUNT(*) FILTER (WHERE status = 'delivered' AND DATE(created_at) = target_date) > 0 
        THEN ROUND(
          COUNT(*) FILTER (WHERE delivery_confirmed = true AND DATE(created_at) = target_date) * 100.0 / 
          COUNT(*) FILTER (WHERE status = 'delivered' AND DATE(created_at) = target_date), 
          2
        )
        ELSE 0 
      END,
      COALESCE(AVG(delivery_rating) FILTER (WHERE delivery_rating IS NOT NULL AND DATE(created_at) = target_date), 0),
      COALESCE(AVG(seller_rating) FILTER (WHERE seller_rating IS NOT NULL AND DATE(created_at) = target_date), 0),
      CASE 
        WHEN COUNT(*) FILTER (WHERE DATE(created_at) = target_date) > 0 
        THEN ROUND(
          COUNT(*) FILTER (WHERE status = 'cancelled' AND DATE(created_at) = target_date) * 100.0 / 
          COUNT(*) FILTER (WHERE DATE(created_at) = target_date), 
          2
        )
        ELSE 0 
      END
    FROM orders 
    WHERE seller_id = seller_record.seller_id
    ON CONFLICT (seller_id, analytics_date) 
    DO UPDATE SET
      total_orders = EXCLUDED.total_orders,
      confirmed_orders = EXCLUDED.confirmed_orders,
      preparing_orders = EXCLUDED.preparing_orders,
      shipped_orders = EXCLUDED.shipped_orders,
      in_transit_orders = EXCLUDED.in_transit_orders,
      delivered_orders = EXCLUDED.delivered_orders,
      cancelled_orders = EXCLUDED.cancelled_orders,
      delivery_confirmations = EXCLUDED.delivery_confirmations,
      delivery_confirmation_rate = EXCLUDED.delivery_confirmation_rate,
      avg_delivery_rating = EXCLUDED.avg_delivery_rating,
      avg_seller_rating = EXCLUDED.avg_seller_rating,
      cancellation_rate = EXCLUDED.cancellation_rate,
      updated_at = NOW();
  END LOOP;
END;
$$ LANGUAGE plpgsql;