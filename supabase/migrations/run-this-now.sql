-- ⚠️ RUN THIS IN SUPABASE SQL EDITOR TO FIX WEATHER PICKS SAVE ERROR
-- Error: Could not find the 'tags' column of 'saved_outfits'
-- Solution: Add the missing tags column

-- Add tags column if it doesn't exist
ALTER TABLE saved_outfits 
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS saved_outfits_tags_idx ON saved_outfits USING GIN(tags);

-- Comment on column
COMMENT ON COLUMN saved_outfits.tags IS 'Array of tags for categorizing saved outfits (e.g., weather_picks, manual, ai_generated)';

-- ✅ After running this, you can save weather picks to favorites!
