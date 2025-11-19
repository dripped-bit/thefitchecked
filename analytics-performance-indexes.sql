-- Analytics Performance Indexes
-- Add indexes to improve query performance for analytics features

-- Index for color filtering (non-null colors)
CREATE INDEX IF NOT EXISTS idx_clothing_items_color 
ON clothing_items(color) 
WHERE color IS NOT NULL;

-- Index for date_added queries (for historical analytics)
CREATE INDEX IF NOT EXISTS idx_clothing_items_date_added 
ON clothing_items(date_added DESC);

-- Composite index for user + date queries
CREATE INDEX IF NOT EXISTS idx_clothing_items_user_date 
ON clothing_items(user_id, date_added DESC);

-- Composite index for user + category queries
CREATE INDEX IF NOT EXISTS idx_clothing_items_user_category 
ON clothing_items(user_id, category);

-- Index for price (non-null, for value calculations)
CREATE INDEX IF NOT EXISTS idx_clothing_items_price 
ON clothing_items(price) 
WHERE price IS NOT NULL AND price > 0;

-- Composite index for unworn items queries (user + last_worn)
CREATE INDEX IF NOT EXISTS idx_clothing_items_user_last_worn 
ON clothing_items(user_id, last_worn DESC NULLS LAST);

-- Index for wishlist queries
CREATE INDEX IF NOT EXISTS idx_wishlist_items_user 
ON wishlist_items(user_id, date_added DESC);

-- Comments
COMMENT ON INDEX idx_clothing_items_color IS 'Speeds up color analysis queries by indexing non-null colors';
COMMENT ON INDEX idx_clothing_items_date_added IS 'Enables fast historical date range queries';
COMMENT ON INDEX idx_clothing_items_user_last_worn IS 'Optimizes unworn items detection queries';
