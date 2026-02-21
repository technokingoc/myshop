-- Migration: Add tables for bulk operations tracking
-- S65: Bulk Operations - Price History and Job Tracking

-- Bulk Jobs Table
CREATE TABLE IF NOT EXISTS bulk_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id INTEGER NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  job_type VARCHAR(64) NOT NULL, -- 'price_adjustment', 'category_assignment', etc.
  status VARCHAR(32) NOT NULL DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
  progress INTEGER NOT NULL DEFAULT 0, -- percentage 0-100
  total_items INTEGER NOT NULL DEFAULT 0,
  processed_items INTEGER NOT NULL DEFAULT 0,
  failed_items INTEGER NOT NULL DEFAULT 0,
  payload JSONB NOT NULL DEFAULT '{}', -- operation-specific data
  results JSONB DEFAULT '{}', -- results and error details
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days')
);

-- Price Change History Table
CREATE TABLE IF NOT EXISTS price_history (
  id SERIAL PRIMARY KEY,
  job_id UUID REFERENCES bulk_jobs(id) ON DELETE CASCADE,
  seller_id INTEGER NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES catalog_items(id) ON DELETE CASCADE,
  old_price DECIMAL(12,2) NOT NULL,
  new_price DECIMAL(12,2) NOT NULL,
  change_type VARCHAR(32) NOT NULL, -- 'percentage', 'fixed', 'set'
  change_action VARCHAR(32) NOT NULL, -- 'increase', 'decrease', 'set'
  change_value VARCHAR(32) NOT NULL, -- the actual value used (e.g., '10' for 10%)
  can_undo BOOLEAN NOT NULL DEFAULT true,
  undone_at TIMESTAMP WITH TIME ZONE,
  undone_by INTEGER REFERENCES sellers(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bulk_jobs_seller_id ON bulk_jobs(seller_id);
CREATE INDEX IF NOT EXISTS idx_bulk_jobs_status ON bulk_jobs(status);
CREATE INDEX IF NOT EXISTS idx_bulk_jobs_created_at ON bulk_jobs(created_at);

CREATE INDEX IF NOT EXISTS idx_price_history_seller_id ON price_history(seller_id);
CREATE INDEX IF NOT EXISTS idx_price_history_product_id ON price_history(product_id);
CREATE INDEX IF NOT EXISTS idx_price_history_job_id ON price_history(job_id);
CREATE INDEX IF NOT EXISTS idx_price_history_can_undo ON price_history(can_undo);
CREATE INDEX IF NOT EXISTS idx_price_history_created_at ON price_history(created_at);

-- Add product tags support (many-to-many)
CREATE TABLE IF NOT EXISTS product_tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  slug VARCHAR(128) NOT NULL UNIQUE,
  color VARCHAR(32) DEFAULT '#3B82F6', -- hex color for UI
  seller_id INTEGER NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  product_count INTEGER DEFAULT 0, -- denormalized count for performance
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_tag_assignments (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES catalog_items(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES product_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, tag_id)
);

-- Create indexes for tags
CREATE INDEX IF NOT EXISTS idx_product_tags_seller_id ON product_tags(seller_id);
CREATE INDEX IF NOT EXISTS idx_product_tags_slug ON product_tags(slug);
CREATE INDEX IF NOT EXISTS idx_product_tag_assignments_product_id ON product_tag_assignments(product_id);
CREATE INDEX IF NOT EXISTS idx_product_tag_assignments_tag_id ON product_tag_assignments(tag_id);

-- Function to update product count in tags (trigger function)
CREATE OR REPLACE FUNCTION update_product_tag_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update count for the affected tag
  IF TG_OP = 'INSERT' THEN
    UPDATE product_tags 
    SET product_count = (
      SELECT COUNT(*) 
      FROM product_tag_assignments 
      WHERE tag_id = NEW.tag_id
    )
    WHERE id = NEW.tag_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE product_tags 
    SET product_count = (
      SELECT COUNT(*) 
      FROM product_tag_assignments 
      WHERE tag_id = OLD.tag_id
    )
    WHERE id = OLD.tag_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to maintain tag counts
DROP TRIGGER IF EXISTS trigger_update_product_tag_count ON product_tag_assignments;
CREATE TRIGGER trigger_update_product_tag_count
  AFTER INSERT OR DELETE ON product_tag_assignments
  FOR EACH ROW EXECUTE FUNCTION update_product_tag_count();