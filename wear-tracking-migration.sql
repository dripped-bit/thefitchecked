-- Wear Tracking Migration
-- Add wear tracking columns to clothing_items table for cost-per-wear analytics

-- Add wear tracking columns if they don't exist
ALTER TABLE clothing_items 
ADD COLUMN IF NOT EXISTS times_worn INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_worn TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS date_added TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add columns for better analytics (if missing)
ALTER TABLE clothing_items
ADD COLUMN IF NOT EXISTS price NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS brand TEXT,
ADD COLUMN IF NOT EXISTS color TEXT,
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_clothing_items_times_worn 
ON clothing_items(times_worn DESC);

CREATE INDEX IF NOT EXISTS idx_clothing_items_last_worn 
ON clothing_items(last_worn DESC);

CREATE INDEX IF NOT EXISTS idx_clothing_items_user_worn 
ON clothing_items(user_id, times_worn DESC);

-- Create a function to increment times_worn
CREATE OR REPLACE FUNCTION increment_times_worn(item_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE clothing_items
  SET 
    times_worn = COALESCE(times_worn, 0) + 1,
    last_worn = NOW(),
    updated_at = NOW()
  WHERE id = item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to batch increment times_worn for multiple items
CREATE OR REPLACE FUNCTION increment_multiple_times_worn(item_ids UUID[])
RETURNS void AS $$
BEGIN
  UPDATE clothing_items
  SET 
    times_worn = COALESCE(times_worn, 0) + 1,
    last_worn = NOW(),
    updated_at = NOW()
  WHERE id = ANY(item_ids);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing items to have times_worn = 0 if NULL
UPDATE clothing_items 
SET times_worn = 0 
WHERE times_worn IS NULL;

-- Make times_worn NOT NULL with default 0
ALTER TABLE clothing_items 
ALTER COLUMN times_worn SET DEFAULT 0,
ALTER COLUMN times_worn SET NOT NULL;

-- Comment documentation
COMMENT ON COLUMN clothing_items.times_worn IS 'Number of times this item has been worn (tracked via outfit history)';
COMMENT ON COLUMN clothing_items.last_worn IS 'Timestamp of the last time this item was worn';
COMMENT ON COLUMN clothing_items.date_added IS 'Date when item was added to closet';
COMMENT ON COLUMN clothing_items.price IS 'Purchase price of the item for cost-per-wear analytics';
COMMENT ON FUNCTION increment_times_worn(UUID) IS 'Atomically increments times_worn counter for a single item';
COMMENT ON FUNCTION increment_multiple_times_worn(UUID[]) IS 'Atomically increments times_worn counter for multiple items at once';
