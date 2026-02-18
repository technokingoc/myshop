-- Sprint 35: dedicated storefront header templates
-- Safe migration: add nullable/defaulted column only if missing, then backfill.

ALTER TABLE sellers
  ADD COLUMN IF NOT EXISTS header_template VARCHAR(32) DEFAULT 'compact';

UPDATE sellers
SET header_template = 'compact'
WHERE header_template IS NULL OR header_template = '';
