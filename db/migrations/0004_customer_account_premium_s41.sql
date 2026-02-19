-- Migration for Sprint S41: Customer Account Premium
-- Adds customer addresses and reviews tables

-- Create customer_addresses table
CREATE TABLE IF NOT EXISTS customer_addresses (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label VARCHAR(100) NOT NULL DEFAULT 'Home',
  full_name VARCHAR(256) NOT NULL,
  address_line1 VARCHAR(256) NOT NULL,
  address_line2 VARCHAR(256) DEFAULT '',
  city VARCHAR(256) NOT NULL,
  state VARCHAR(256) DEFAULT '',
  postal_code VARCHAR(32) DEFAULT '',
  country VARCHAR(64) NOT NULL DEFAULT 'Mozambique',
  phone VARCHAR(64) DEFAULT '',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create customer_reviews table  
CREATE TABLE IF NOT EXISTS customer_reviews (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  catalog_item_id INTEGER NOT NULL REFERENCES catalog_items(id) ON DELETE CASCADE,
  seller_id INTEGER NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(256) DEFAULT '',
  content TEXT DEFAULT '',
  image_urls TEXT DEFAULT '',
  helpful INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT FALSE,
  status VARCHAR(32) DEFAULT 'published',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer_id ON customer_addresses(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_is_default ON customer_addresses(customer_id, is_default);
CREATE INDEX IF NOT EXISTS idx_customer_reviews_customer_id ON customer_reviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_reviews_catalog_item_id ON customer_reviews(catalog_item_id);
CREATE INDEX IF NOT EXISTS idx_customer_reviews_seller_id ON customer_reviews(seller_id);
CREATE INDEX IF NOT EXISTS idx_customer_reviews_status ON customer_reviews(status);

-- Ensure only one default address per customer
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_default_address_per_customer 
ON customer_addresses(customer_id) 
WHERE is_default = TRUE;

-- Ensure only one review per customer per item
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_review_per_customer_per_item 
ON customer_reviews(customer_id, catalog_item_id);