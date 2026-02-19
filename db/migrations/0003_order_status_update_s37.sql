-- Migration for Sprint S37: Update order statuses to new flow
-- Update existing order statuses to align with new flow

-- Map old statuses to new ones:
-- new -> placed
-- contacted -> confirmed  
-- completed -> delivered
UPDATE orders 
SET status = CASE 
  WHEN status = 'new' THEN 'placed'
  WHEN status = 'contacted' THEN 'confirmed'
  WHEN status = 'completed' THEN 'delivered'
  ELSE status
END
WHERE status IN ('new', 'contacted', 'completed');

-- Update default value for new orders
ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'placed';