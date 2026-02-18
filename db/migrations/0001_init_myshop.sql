CREATE TABLE IF NOT EXISTS sellers (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(128) NOT NULL UNIQUE,
  name VARCHAR(256) NOT NULL,
  description TEXT DEFAULT '',
  owner_name VARCHAR(256) DEFAULT '',
  business_type VARCHAR(128) DEFAULT 'Retail',
  currency VARCHAR(16) DEFAULT 'USD',
  city VARCHAR(256) DEFAULT '',
  logo_url TEXT DEFAULT '',
  social_links JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS catalog_items (
  id SERIAL PRIMARY KEY,
  seller_id INTEGER NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  name VARCHAR(256) NOT NULL,
  type VARCHAR(32) NOT NULL DEFAULT 'Product',
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  status VARCHAR(32) NOT NULL DEFAULT 'Draft',
  image_url TEXT DEFAULT '',
  short_description TEXT DEFAULT '',
  category VARCHAR(128) DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  seller_id INTEGER NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  item_id INTEGER,
  customer_name VARCHAR(256) NOT NULL,
  customer_contact VARCHAR(512) NOT NULL,
  message TEXT DEFAULT '',
  status VARCHAR(32) NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_catalog_items_seller_id ON catalog_items(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
