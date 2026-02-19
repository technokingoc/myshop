-- Migration for Sprint S43: Notifications System Enhancement
-- Adds notification preferences table and improves notification system

-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_type VARCHAR(32) NOT NULL DEFAULT 'seller', -- 'seller' or 'customer'
  
  -- Email preferences
  email_order_updates BOOLEAN DEFAULT TRUE,
  email_inventory_alerts BOOLEAN DEFAULT TRUE,
  email_review_alerts BOOLEAN DEFAULT TRUE,
  email_promotional_emails BOOLEAN DEFAULT FALSE,
  email_system_updates BOOLEAN DEFAULT TRUE,
  
  -- In-app preferences  
  inapp_order_updates BOOLEAN DEFAULT TRUE,
  inapp_inventory_alerts BOOLEAN DEFAULT TRUE,
  inapp_review_alerts BOOLEAN DEFAULT TRUE,
  inapp_system_updates BOOLEAN DEFAULT TRUE,
  
  -- Email frequency
  email_frequency VARCHAR(32) DEFAULT 'instant', -- 'instant', 'daily', 'weekly'
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Ensure one preference set per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_preference_per_user 
ON notification_preferences(user_id);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_type ON notification_preferences(user_type);

-- Enhance existing notifications table with action_url
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS action_url TEXT DEFAULT '';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 1; -- 1=low, 2=medium, 3=high
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS notification_channel VARCHAR(32) DEFAULT 'in_app'; -- 'in_app', 'email', 'both'

-- Add index for better performance on notifications queries
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(seller_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read_status ON notifications(read, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_type_priority ON notifications(type, priority, created_at);

-- Create default notification preferences for existing users
INSERT INTO notification_preferences (user_id, user_type, email_order_updates, email_inventory_alerts, email_review_alerts)
SELECT 
  u.id,
  CASE 
    WHEN s.id IS NOT NULL THEN 'seller'
    ELSE 'customer'
  END as user_type,
  COALESCE(s.email_notifications, TRUE),
  COALESCE(s.email_notifications, TRUE),
  COALESCE(s.email_notifications, TRUE)
FROM users u
LEFT JOIN stores s ON s.user_id = u.id
WHERE NOT EXISTS (
  SELECT 1 FROM notification_preferences np WHERE np.user_id = u.id
);