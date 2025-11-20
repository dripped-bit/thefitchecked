-- Create outfit_history table for tracking worn outfits
-- Used by: YourFitsWeekSection in FashionFeed
-- Run this ONLY if verification script shows outfit_history_exists = FALSE

-- ============================================
-- CREATE TABLE: outfit_history
-- ============================================
CREATE TABLE IF NOT EXISTS outfit_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  worn_date DATE NOT NULL,
  outfit_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  event_id UUID REFERENCES calendar_events(id) ON DELETE SET NULL,
  event_type TEXT,
  weather_data JSONB,
  time_of_day TEXT CHECK (time_of_day IN ('morning', 'afternoon', 'evening')),
  day_of_week TEXT,
  user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
  mood TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CREATE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS outfit_history_user_id_idx 
  ON outfit_history(user_id);

CREATE INDEX IF NOT EXISTS outfit_history_worn_date_idx 
  ON outfit_history(worn_date DESC);

CREATE INDEX IF NOT EXISTS outfit_history_user_date_idx 
  ON outfit_history(user_id, worn_date DESC);

CREATE INDEX IF NOT EXISTS outfit_history_event_id_idx 
  ON outfit_history(event_id) WHERE event_id IS NOT NULL;

-- ============================================
-- ADD COMMENTS
-- ============================================
COMMENT ON TABLE outfit_history IS 
  'Tracks what outfits users have worn for AI learning and analytics. 
   Used by FashionFeed Your Fits This Week section and AI style analysis.';

COMMENT ON COLUMN outfit_history.outfit_items IS 
  'JSONB array of outfit items worn (from closet_items). Structure: [{id, name, category, image_url}, ...]';

COMMENT ON COLUMN outfit_history.weather_data IS 
  'Weather conditions when outfit was worn (temperature, conditions, etc.)';

COMMENT ON COLUMN outfit_history.time_of_day IS 
  'When the outfit was worn: morning, afternoon, or evening';

COMMENT ON COLUMN outfit_history.user_rating IS 
  'User satisfaction rating 1-5 stars for this outfit';

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE outfit_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own outfit history
CREATE POLICY outfit_history_select_own 
  ON outfit_history FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own outfit history
CREATE POLICY outfit_history_insert_own 
  ON outfit_history FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own outfit history
CREATE POLICY outfit_history_update_own 
  ON outfit_history FOR UPDATE 
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own outfit history
CREATE POLICY outfit_history_delete_own 
  ON outfit_history FOR DELETE 
  USING (auth.uid() = user_id);

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
SELECT 'outfit_history table created successfully! ✅' as status;
