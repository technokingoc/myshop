-- Migration for S51: Add language preference support

-- Add language preference to sellers table for backward compatibility
ALTER TABLE sellers 
ADD COLUMN language VARCHAR(8) DEFAULT 'en';

-- Add language preference to stores table (new unified table)
ALTER TABLE stores 
ADD COLUMN language VARCHAR(8) DEFAULT 'en';

-- Add language preference to users table
ALTER TABLE users 
ADD COLUMN language VARCHAR(8) DEFAULT 'en';

-- Update existing records to have default language
UPDATE sellers SET language = 'en' WHERE language IS NULL;
UPDATE stores SET language = 'en' WHERE language IS NULL;
UPDATE users SET language = 'en' WHERE language IS NULL;

-- Add indexes for performance
CREATE INDEX idx_sellers_language ON sellers(language);
CREATE INDEX idx_stores_language ON stores(language);
CREATE INDEX idx_users_language ON users(language);