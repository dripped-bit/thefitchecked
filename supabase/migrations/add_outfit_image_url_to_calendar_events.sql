-- Add outfit_image_url column to calendar_events table
-- This stores the primary outfit/product image to display on calendar grid

ALTER TABLE calendar_events 
ADD COLUMN IF NOT EXISTS outfit_image_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN calendar_events.outfit_image_url IS 'URL of the outfit or product image to display on calendar grid. Falls back to this if no shopping_links images available.';
