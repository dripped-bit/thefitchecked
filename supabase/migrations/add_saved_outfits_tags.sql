-- Migration: Add tags column to saved_outfits table
-- This allows filtering saved outfits by source (e.g., weather_picks)

-- Add tags column if it doesn't exist
ALTER TABLE saved_outfits 
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS saved_outfits_tags_idx ON saved_outfits USING GIN(tags);

-- Comment on column
COMMENT ON COLUMN saved_outfits.tags IS 'Array of tags for categorizing saved outfits (e.g., weather_picks, manual, ai_generated)';
