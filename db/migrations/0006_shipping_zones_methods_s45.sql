-- Migration 0006: Shipping Zones, Methods & Delivery - Sprint S45
-- Create shipping zones and methods tables, update orders table with shipping fields

-- Create shipping zones table
CREATE TABLE IF NOT EXISTS shipping_zones (
  id SERIAL PRIMARY KEY,
  seller_id INTEGER NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  name VARCHAR(256) NOT NULL,
  regions JSONB DEFAULT '[]',
  countries JSONB DEFAULT '[]',
  active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create shipping methods table
CREATE TABLE IF NOT EXISTS shipping_methods (
  id SERIAL PRIMARY KEY,
  seller_id INTEGER NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  zone_id INTEGER NOT NULL REFERENCES shipping_zones(id) ON DELETE CASCADE,
  name VARCHAR(256) NOT NULL,
  type VARCHAR(32) NOT NULL DEFAULT 'flat_rate',
  rate NUMERIC(10, 2) DEFAULT 0,
  free_shipping_min_order NUMERIC(10, 2) DEFAULT 0,
  estimated_days INTEGER DEFAULT 3,
  max_weight NUMERIC(8, 2) DEFAULT 0,
  pickup_address TEXT DEFAULT '',
  pickup_instructions TEXT DEFAULT '',
  active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add shipping fields to orders table if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'shipping_method_id') THEN
        ALTER TABLE orders ADD COLUMN shipping_method_id INTEGER REFERENCES shipping_methods(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'shipping_cost') THEN
        ALTER TABLE orders ADD COLUMN shipping_cost NUMERIC(10, 2) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'shipping_address') THEN
        ALTER TABLE orders ADD COLUMN shipping_address JSONB;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'estimated_delivery') THEN
        ALTER TABLE orders ADD COLUMN estimated_delivery TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'tracking_number') THEN
        ALTER TABLE orders ADD COLUMN tracking_number VARCHAR(128) DEFAULT '';
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shipping_zones_seller_id ON shipping_zones(seller_id);
CREATE INDEX IF NOT EXISTS idx_shipping_methods_seller_id ON shipping_methods(seller_id);
CREATE INDEX IF NOT EXISTS idx_shipping_methods_zone_id ON shipping_methods(zone_id);
CREATE INDEX IF NOT EXISTS idx_orders_shipping_method_id ON orders(shipping_method_id);

-- Insert default shipping zones and methods for existing sellers
INSERT INTO shipping_zones (seller_id, name, regions, countries, active, sort_order)
SELECT 
  id as seller_id,
  'Local Delivery' as name,
  CASE 
    WHEN city != '' THEN jsonb_build_array(city)
    ELSE '["Local Area"]'::jsonb
  END as regions,
  CASE 
    WHEN country != '' THEN jsonb_build_array(country)
    ELSE '["Mozambique"]'::jsonb
  END as countries,
  true as active,
  0 as sort_order
FROM sellers 
WHERE NOT EXISTS (
  SELECT 1 FROM shipping_zones sz WHERE sz.seller_id = sellers.id
);

-- Insert default shipping methods for each new zone
INSERT INTO shipping_methods (seller_id, zone_id, name, type, rate, estimated_days, active, sort_order)
SELECT 
  sz.seller_id,
  sz.id as zone_id,
  'Standard Delivery' as name,
  'flat_rate' as type,
  50.00 as rate,
  3 as estimated_days,
  true as active,
  0 as sort_order
FROM shipping_zones sz
WHERE NOT EXISTS (
  SELECT 1 FROM shipping_methods sm WHERE sm.zone_id = sz.id
);