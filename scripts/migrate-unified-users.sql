-- MyShop Unified User Model Migration
-- Migrates from dual auth (sellers + customers) to unified users + stores model

BEGIN;

-- Step 1: Create new users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(256) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name VARCHAR(256) NOT NULL,
  phone VARCHAR(64) DEFAULT '',
  avatar_url TEXT DEFAULT '',
  city VARCHAR(256) DEFAULT '',
  country VARCHAR(64) DEFAULT '',
  role VARCHAR(32) DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Step 2: Create new stores table (replaces seller business info)
CREATE TABLE IF NOT EXISTS stores (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slug VARCHAR(128) UNIQUE NOT NULL,
  name VARCHAR(256) NOT NULL,
  description TEXT DEFAULT '',
  logo_url TEXT DEFAULT '',
  banner_url TEXT DEFAULT '',
  business_type VARCHAR(128) DEFAULT 'Retail',
  currency VARCHAR(16) DEFAULT 'USD',
  social_links JSONB DEFAULT '{}',
  plan VARCHAR(32) DEFAULT 'free',
  theme_color VARCHAR(32) DEFAULT 'indigo',
  store_template VARCHAR(32) DEFAULT 'classic',
  header_template VARCHAR(32) DEFAULT 'compact',
  business_hours JSONB DEFAULT '{}',
  address TEXT DEFAULT '',
  city VARCHAR(256) DEFAULT '',
  country VARCHAR(64) DEFAULT '',
  email_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Step 3: Migrate existing sellers to users + stores
INSERT INTO users (email, password_hash, name, phone, city, country, role, created_at, updated_at)
SELECT 
  email, 
  password_hash, 
  COALESCE(owner_name, name, 'Store Owner') as name,
  '' as phone,
  city,
  country,
  'user' as role,
  created_at,
  updated_at
FROM sellers
WHERE email IS NOT NULL AND password_hash IS NOT NULL;

-- Create stores for migrated sellers
INSERT INTO stores (user_id, slug, name, description, logo_url, banner_url, business_type, currency, social_links, plan, theme_color, store_template, header_template, business_hours, address, city, country, email_notifications, created_at, updated_at)
SELECT 
  u.id as user_id,
  s.slug,
  s.name,
  s.description,
  s.logo_url,
  s.banner_url,
  s.business_type,
  s.currency,
  s.social_links,
  s.plan,
  s.theme_color,
  s.store_template,
  s.header_template,
  s.business_hours,
  s.address,
  s.city,
  s.country,
  s.email_notifications,
  s.created_at,
  s.updated_at
FROM sellers s
JOIN users u ON s.email = u.email
WHERE s.email IS NOT NULL AND s.password_hash IS NOT NULL;

-- Step 4: Migrate existing customers to users (merge by email if overlap)
INSERT INTO users (email, password_hash, name, phone, city, country, role, created_at, updated_at)
SELECT 
  c.email, 
  c.password_hash, 
  c.name,
  c.phone,
  c.city,
  c.country,
  'user' as role,
  c.created_at,
  NOW() as updated_at
FROM customers c
WHERE c.email NOT IN (SELECT email FROM users)
ON CONFLICT (email) DO NOTHING;

-- Step 5: Create temporary mapping tables for foreign key updates
CREATE TEMP TABLE seller_to_store_map AS
SELECT s.id as old_seller_id, st.id as new_store_id, st.user_id as new_user_id
FROM sellers s
JOIN users u ON s.email = u.email
JOIN stores st ON st.user_id = u.id
WHERE s.email IS NOT NULL AND s.password_hash IS NOT NULL;

CREATE TEMP TABLE customer_to_user_map AS
SELECT c.id as old_customer_id, u.id as new_user_id
FROM customers c
JOIN users u ON c.email = u.email;

-- Step 6: Update foreign keys in dependent tables

-- Update catalog_items.seller_id -> stores.id
ALTER TABLE catalog_items ADD COLUMN store_id INTEGER;
UPDATE catalog_items 
SET store_id = m.new_store_id
FROM seller_to_store_map m
WHERE catalog_items.seller_id = m.old_seller_id;

ALTER TABLE catalog_items DROP CONSTRAINT catalog_items_seller_id_sellers_id_fk;
ALTER TABLE catalog_items DROP COLUMN seller_id;
ALTER TABLE catalog_items RENAME COLUMN store_id TO seller_id;
ALTER TABLE catalog_items ADD CONSTRAINT catalog_items_seller_id_stores_id_fk FOREIGN KEY (seller_id) REFERENCES stores(id) ON DELETE CASCADE;

-- Update orders.customer_id -> users.id AND orders.seller_id -> stores.id
-- First handle customer_id
ALTER TABLE orders ADD COLUMN user_id INTEGER;
UPDATE orders 
SET user_id = m.new_user_id
FROM customer_to_user_map m
WHERE orders.customer_id = m.old_customer_id;

-- Then handle seller_id -> store_id
ALTER TABLE orders ADD COLUMN store_id INTEGER;
UPDATE orders 
SET store_id = m.new_store_id
FROM seller_to_store_map m
WHERE orders.seller_id = m.old_seller_id;

-- Drop old constraints and rename columns
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_customer_id_customers_id_fk;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_seller_id_sellers_id_fk;
ALTER TABLE orders DROP COLUMN customer_id;
ALTER TABLE orders DROP COLUMN seller_id;
ALTER TABLE orders RENAME COLUMN user_id TO customer_id;
ALTER TABLE orders RENAME COLUMN store_id TO seller_id;
ALTER TABLE orders ADD CONSTRAINT orders_customer_id_users_id_fk FOREIGN KEY (customer_id) REFERENCES users(id);
ALTER TABLE orders ADD CONSTRAINT orders_seller_id_stores_id_fk FOREIGN KEY (seller_id) REFERENCES stores(id) ON DELETE CASCADE;

-- Update coupons.seller_id -> stores.id
ALTER TABLE coupons ADD COLUMN store_id INTEGER;
UPDATE coupons 
SET store_id = m.new_store_id
FROM seller_to_store_map m
WHERE coupons.seller_id = m.old_seller_id;

ALTER TABLE coupons DROP CONSTRAINT coupons_seller_id_sellers_id_fk;
ALTER TABLE coupons DROP COLUMN seller_id;
ALTER TABLE coupons RENAME COLUMN store_id TO seller_id;
ALTER TABLE coupons ADD CONSTRAINT coupons_seller_id_stores_id_fk FOREIGN KEY (seller_id) REFERENCES stores(id) ON DELETE CASCADE;

-- Update comments.seller_id -> stores.id
ALTER TABLE comments ADD COLUMN store_id INTEGER;
UPDATE comments 
SET store_id = m.new_store_id
FROM seller_to_store_map m
WHERE comments.seller_id = m.old_seller_id;

ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_seller_id_sellers_id_fk;
ALTER TABLE comments DROP COLUMN seller_id;
ALTER TABLE comments RENAME COLUMN store_id TO seller_id;
ALTER TABLE comments ADD CONSTRAINT comments_seller_id_stores_id_fk FOREIGN KEY (seller_id) REFERENCES stores(id) ON DELETE CASCADE;

-- Update wishlists.customer_id -> users.id
ALTER TABLE wishlists ADD COLUMN user_id INTEGER;
UPDATE wishlists 
SET user_id = m.new_user_id
FROM customer_to_user_map m
WHERE wishlists.customer_id = m.old_customer_id;

ALTER TABLE wishlists DROP CONSTRAINT wishlists_customer_id_customers_id_fk;
ALTER TABLE wishlists DROP COLUMN customer_id;
ALTER TABLE wishlists RENAME COLUMN user_id TO customer_id;
ALTER TABLE wishlists ADD CONSTRAINT wishlists_customer_id_users_id_fk FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE;

-- Update notifications foreign keys
ALTER TABLE notifications ADD COLUMN store_id INTEGER;
ALTER TABLE notifications ADD COLUMN user_id INTEGER;

UPDATE notifications 
SET store_id = m.new_store_id
FROM seller_to_store_map m
WHERE notifications.seller_id = m.old_seller_id;

UPDATE notifications 
SET user_id = m.new_user_id
FROM customer_to_user_map m
WHERE notifications.customer_id = m.old_customer_id;

ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_seller_id_sellers_id_fk;
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_customer_id_customers_id_fk;
ALTER TABLE notifications DROP COLUMN seller_id;
ALTER TABLE notifications DROP COLUMN customer_id;
ALTER TABLE notifications RENAME COLUMN store_id TO seller_id;
ALTER TABLE notifications RENAME COLUMN user_id TO customer_id;
ALTER TABLE notifications ADD CONSTRAINT notifications_seller_id_stores_id_fk FOREIGN KEY (seller_id) REFERENCES stores(id) ON DELETE CASCADE;
ALTER TABLE notifications ADD CONSTRAINT notifications_customer_id_users_id_fk FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE;

-- Step 7: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_stores_user_id ON stores(user_id);
CREATE INDEX IF NOT EXISTS idx_stores_slug ON stores(slug);

-- Step 8: Update sequences to avoid conflicts
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('stores_id_seq', (SELECT MAX(id) FROM stores));

COMMIT;

-- Migration complete! 
-- The old 'sellers' and 'customers' tables are preserved but should be dropped after verification
-- DROP TABLE IF EXISTS sellers CASCADE;
-- DROP TABLE IF EXISTS customers CASCADE;