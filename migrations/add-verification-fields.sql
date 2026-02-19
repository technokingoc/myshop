-- Add verification fields to sellers table for legacy support
ALTER TABLE sellers 
ADD COLUMN verification_status VARCHAR(32) DEFAULT 'pending',
ADD COLUMN verification_notes TEXT DEFAULT '',
ADD COLUMN verification_requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN verification_reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN verification_reviewed_by INTEGER,
ADD COLUMN business_documents JSONB DEFAULT '[]',
ADD COLUMN flagged_reason TEXT DEFAULT '';

-- Add verification fields to stores table for new system
ALTER TABLE stores 
ADD COLUMN verification_status VARCHAR(32) DEFAULT 'pending',
ADD COLUMN verification_notes TEXT DEFAULT '',
ADD COLUMN verification_requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN verification_reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN verification_reviewed_by INTEGER REFERENCES users(id),
ADD COLUMN business_documents JSONB DEFAULT '[]',
ADD COLUMN flagged_reason TEXT DEFAULT '';

-- Add moderation fields to catalog_items
ALTER TABLE catalog_items
ADD COLUMN moderation_status VARCHAR(32) DEFAULT 'approved',
ADD COLUMN flagged_reason TEXT DEFAULT '',
ADD COLUMN flagged_by INTEGER REFERENCES users(id),
ADD COLUMN flagged_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN reviewed_by INTEGER REFERENCES users(id),
ADD COLUMN reviewed_at TIMESTAMP WITH TIME ZONE;

-- Add moderation fields to comments  
ALTER TABLE comments
ADD COLUMN moderation_status VARCHAR(32) DEFAULT 'approved',
ADD COLUMN flagged_reason TEXT DEFAULT '',
ADD COLUMN flagged_by INTEGER REFERENCES users(id),
ADD COLUMN flagged_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN reviewed_by INTEGER REFERENCES users(id),
ADD COLUMN reviewed_at TIMESTAMP WITH TIME ZONE;

-- Add platform settings for fees and configuration
INSERT INTO platform_settings (key, value) VALUES 
('platform_fee_percentage', '5.0'),
('platform_fee_fixed', '0.30'),
('platform_fee_enabled', 'true'),
('auto_approve_sellers', 'false'),
('auto_approve_products', 'true'),
('auto_approve_reviews', 'true')
ON CONFLICT (key) DO NOTHING;

-- Create admin activities log table
CREATE TABLE IF NOT EXISTS admin_activities (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(128) NOT NULL,
    target_type VARCHAR(64) NOT NULL, -- 'seller', 'product', 'review', 'order'
    target_id INTEGER NOT NULL,
    old_values JSONB DEFAULT '{}',
    new_values JSONB DEFAULT '{}',
    notes TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sellers_verification_status ON sellers(verification_status);
CREATE INDEX IF NOT EXISTS idx_stores_verification_status ON stores(verification_status);
CREATE INDEX IF NOT EXISTS idx_catalog_items_moderation_status ON catalog_items(moderation_status);
CREATE INDEX IF NOT EXISTS idx_comments_moderation_status ON comments(moderation_status);
CREATE INDEX IF NOT EXISTS idx_admin_activities_created_at ON admin_activities(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_activities_admin_id ON admin_activities(admin_id);