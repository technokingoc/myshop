-- S59: Reviews & Ratings v2 - Database Migration
-- Add unhelpful votes and review voting tracking

-- Add unhelpful column to customer_reviews table
ALTER TABLE customer_reviews ADD COLUMN IF NOT EXISTS unhelpful INTEGER DEFAULT 0;

-- Create review_votes table for tracking user votes to prevent duplicates
CREATE TABLE IF NOT EXISTS review_votes (
  id SERIAL PRIMARY KEY,
  review_id INTEGER NOT NULL REFERENCES customer_reviews(id) ON DELETE CASCADE,
  customer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vote_type VARCHAR(16) NOT NULL CHECK (vote_type IN ('helpful', 'unhelpful')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Unique constraint to prevent duplicate votes from same user on same review
  UNIQUE(review_id, customer_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_review_votes_review_id ON review_votes(review_id);
CREATE INDEX IF NOT EXISTS idx_review_votes_customer_id ON review_votes(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_reviews_verified ON customer_reviews(verified);
CREATE INDEX IF NOT EXISTS idx_customer_reviews_status ON customer_reviews(status);
CREATE INDEX IF NOT EXISTS idx_customer_reviews_order_id ON customer_reviews(order_id);