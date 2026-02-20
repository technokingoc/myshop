-- S59: Reviews & Ratings v2 - Enhanced Review System
-- This migration ensures the reviews system is properly configured

-- The customerReviews and reviewVotes tables already exist from previous migrations
-- This migration adds indexes for better performance and ensures data integrity

-- Add indexes for better performance on reviews queries
CREATE INDEX IF NOT EXISTS idx_customer_reviews_product_status 
ON customer_reviews (catalog_item_id, status);

CREATE INDEX IF NOT EXISTS idx_customer_reviews_customer_product 
ON customer_reviews (customer_id, catalog_item_id);

CREATE INDEX IF NOT EXISTS idx_customer_reviews_order_item 
ON customer_reviews (order_id, catalog_item_id);

CREATE INDEX IF NOT EXISTS idx_customer_reviews_verified 
ON customer_reviews (verified) WHERE verified = true;

CREATE INDEX IF NOT EXISTS idx_review_votes_review 
ON review_votes (review_id);

CREATE INDEX IF NOT EXISTS idx_review_votes_customer 
ON review_votes (customer_id);

-- Add unique constraint to prevent duplicate votes
CREATE UNIQUE INDEX IF NOT EXISTS idx_review_votes_unique 
ON review_votes (review_id, customer_id);

-- Ensure helpful/unhelpful columns are not null and default to 0
UPDATE customer_reviews 
SET helpful = 0 WHERE helpful IS NULL;

UPDATE customer_reviews 
SET unhelpful = 0 WHERE unhelpful IS NULL;

-- Add check constraints to ensure valid ratings
ALTER TABLE customer_reviews 
ADD CONSTRAINT IF NOT EXISTS check_rating_range 
CHECK (rating >= 1 AND rating <= 5);

-- Add check constraint for vote types
ALTER TABLE review_votes 
ADD CONSTRAINT IF NOT EXISTS check_vote_type 
CHECK (vote_type IN ('helpful', 'unhelpful'));

-- Add comments to document the enhanced features
COMMENT ON COLUMN customer_reviews.verified IS 'TRUE if review is from verified purchase (linked to order)';
COMMENT ON COLUMN customer_reviews.image_urls IS 'Comma-separated URLs for up to 5 review photos';
COMMENT ON COLUMN customer_reviews.helpful IS 'Count of helpful votes from other customers';
COMMENT ON COLUMN customer_reviews.unhelpful IS 'Count of unhelpful votes from other customers';
COMMENT ON TABLE review_votes IS 'Tracks helpful/unhelpful votes to prevent duplicates';