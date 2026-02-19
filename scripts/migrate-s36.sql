-- Migration script for Sprint S36: Product Management Premium
-- Adds columns for variant support and enhanced stock tracking

-- Add new columns to catalog_items table
ALTER TABLE catalog_items 
ADD COLUMN IF NOT EXISTS has_variants BOOLEAN DEFAULT FALSE;

-- Create product_variants table
CREATE TABLE IF NOT EXISTS product_variants (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES catalog_items(id) ON DELETE CASCADE,
    name VARCHAR(256) NOT NULL,
    sku VARCHAR(128) DEFAULT '',
    price NUMERIC(12,2) NOT NULL,
    compare_at_price NUMERIC(10,2) DEFAULT '0',
    stock_quantity INTEGER DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 5,
    image_url TEXT DEFAULT '',
    attributes JSONB DEFAULT '{}',
    sort_order INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_active ON product_variants(active);
CREATE INDEX IF NOT EXISTS idx_product_variants_sort_order ON product_variants(sort_order);
CREATE INDEX IF NOT EXISTS idx_catalog_items_has_variants ON catalog_items(has_variants);
CREATE INDEX IF NOT EXISTS idx_catalog_items_stock ON catalog_items(stock_quantity);
CREATE INDEX IF NOT EXISTS idx_catalog_items_track_inventory ON catalog_items(track_inventory);

-- Comments for documentation
COMMENT ON TABLE product_variants IS 'Product variants for size, color, material, etc.';
COMMENT ON COLUMN catalog_items.has_variants IS 'Whether this product has variants';
COMMENT ON COLUMN product_variants.attributes IS 'JSON object containing variant attributes like size, color, material';