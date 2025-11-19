-- Wishlist Closet Pairing Migration
-- Run this in your Supabase SQL Editor to add outfit pairing suggestions
-- This enables OpenAI-powered fashion styling recommendations

-- ==============================================
-- PART 1: Pairings Table
-- ==============================================

-- Create table to cache pairing suggestions
CREATE TABLE IF NOT EXISTS wishlist_pairings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wishlist_item_id UUID REFERENCES wishlist_items(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Pairing suggestions stored as JSON array
  -- Structure: [{"itemId": "...", "itemName": "...", "imageUrl": "...", "reason": "...", "score": 0.95, "colorMatch": "monochromatic", "occasions": ["casual", "date night"]}]
  suggestions JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- AI reasoning for overall pairing strategy
  reasoning TEXT,
  completeness_note TEXT,
  
  -- Cache management
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  
  -- Metadata
  model_used TEXT DEFAULT 'gpt-4o',
  generation_time_ms INTEGER,
  closet_size_at_generation INTEGER
);

-- Indexes for fast pairing lookups
CREATE INDEX IF NOT EXISTS idx_pairings_item 
ON wishlist_pairings(wishlist_item_id);

CREATE INDEX IF NOT EXISTS idx_pairings_user 
ON wishlist_pairings(user_id);

CREATE INDEX IF NOT EXISTS idx_pairings_expires 
ON wishlist_pairings(expires_at)
WHERE expires_at > NOW();

CREATE INDEX IF NOT EXISTS idx_pairings_item_valid
ON wishlist_pairings(wishlist_item_id, expires_at)
WHERE expires_at > NOW();

-- ==============================================
-- PART 2: Update Wishlist Items Table
-- ==============================================

-- Add pairing-related columns to wishlist_items
ALTER TABLE wishlist_items
ADD COLUMN IF NOT EXISTS has_pairings BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_pairing_update TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS pairing_generation_status TEXT DEFAULT 'pending'; -- pending, generating, completed, failed

-- Index for items needing pairing updates
CREATE INDEX IF NOT EXISTS idx_wishlist_items_pairing_status
ON wishlist_items(user_id, has_pairings, last_pairing_update)
WHERE price_monitoring_enabled = true;

-- ==============================================
-- PART 3: Helper Functions
-- ==============================================

-- Function to get valid (non-expired) pairings for an item
CREATE OR REPLACE FUNCTION get_valid_pairings(p_item_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_pairings RECORD;
BEGIN
  SELECT 
    suggestions,
    reasoning,
    completeness_note,
    generated_at
  INTO v_pairings
  FROM wishlist_pairings
  WHERE wishlist_item_id = p_item_id
    AND expires_at > NOW()
  ORDER BY generated_at DESC
  LIMIT 1;
  
  IF FOUND THEN
    RETURN jsonb_build_object(
      'suggestions', v_pairings.suggestions,
      'reasoning', v_pairings.reasoning,
      'completenessNote', v_pairings.completeness_note,
      'generatedAt', v_pairings.generated_at,
      'isValid', true
    );
  END IF;
  
  RETURN jsonb_build_object('isValid', false);
END;
$$ LANGUAGE plpgsql;

-- Function to check if pairings need refresh
CREATE OR REPLACE FUNCTION pairings_need_refresh(p_item_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT expires_at INTO v_expires_at
  FROM wishlist_pairings
  WHERE wishlist_item_id = p_item_id
  ORDER BY generated_at DESC
  LIMIT 1;
  
  -- Needs refresh if no pairings exist or they're expired
  RETURN v_expires_at IS NULL OR v_expires_at <= NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to invalidate pairings when closet changes significantly
CREATE OR REPLACE FUNCTION invalidate_all_pairings_for_user(p_user_id UUID)
RETURNS void AS $$
BEGIN
  -- Set all pairings to expire immediately
  UPDATE wishlist_pairings
  SET expires_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Update wishlist items status
  UPDATE wishlist_items
  SET has_pairings = false,
      pairing_generation_status = 'pending'
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get pairing statistics for analytics
CREATE OR REPLACE FUNCTION get_pairing_stats(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_stats RECORD;
BEGIN
  SELECT 
    COUNT(*) as total_pairings,
    COUNT(*) FILTER (WHERE expires_at > NOW()) as valid_pairings,
    COUNT(*) FILTER (WHERE expires_at <= NOW()) as expired_pairings,
    AVG(generation_time_ms) as avg_generation_time_ms,
    MAX(generated_at) as last_generated_at
  INTO v_stats
  FROM wishlist_pairings
  WHERE user_id = p_user_id;
  
  RETURN jsonb_build_object(
    'totalPairings', v_stats.total_pairings,
    'validPairings', v_stats.valid_pairings,
    'expiredPairings', v_stats.expired_pairings,
    'avgGenerationTimeMs', v_stats.avg_generation_time_ms,
    'lastGeneratedAt', v_stats.last_generated_at
  );
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- PART 4: Automatic Cleanup
-- ==============================================

-- Function to clean up expired pairings (keep last 30 days)
CREATE OR REPLACE FUNCTION cleanup_expired_pairings()
RETURNS void AS $$
BEGIN
  DELETE FROM wishlist_pairings
  WHERE expires_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- PART 5: Triggers
-- ==============================================

-- Trigger to update has_pairings flag when new pairings are added
CREATE OR REPLACE FUNCTION update_wishlist_has_pairings()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE wishlist_items
  SET 
    has_pairings = true,
    last_pairing_update = NEW.generated_at,
    pairing_generation_status = 'completed'
  WHERE id = NEW.wishlist_item_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_has_pairings ON wishlist_pairings;
CREATE TRIGGER trigger_update_has_pairings
  AFTER INSERT ON wishlist_pairings
  FOR EACH ROW
  EXECUTE FUNCTION update_wishlist_has_pairings();

-- Trigger to invalidate pairings when user adds new closet items
-- (This ensures pairings stay fresh with current closet inventory)
CREATE OR REPLACE FUNCTION invalidate_pairings_on_closet_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only invalidate if it's been more than 1 hour since last invalidation
  -- (prevents excessive invalidation during bulk uploads)
  UPDATE wishlist_pairings
  SET expires_at = NOW() + INTERVAL '1 hour'
  WHERE user_id = NEW.user_id
    AND expires_at > NOW() + INTERVAL '6 days'; -- Only affect fresh pairings
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: Uncomment below if you want pairings to auto-refresh when closet changes
-- DROP TRIGGER IF EXISTS trigger_invalidate_pairings ON clothing_items;
-- CREATE TRIGGER trigger_invalidate_pairings
--   AFTER INSERT ON clothing_items
--   FOR EACH ROW
--   EXECUTE FUNCTION invalidate_pairings_on_closet_change();

-- ==============================================
-- PART 6: RLS Policies
-- ==============================================

-- Enable RLS on pairings table
ALTER TABLE wishlist_pairings ENABLE ROW LEVEL SECURITY;

-- Users can view their own pairings
CREATE POLICY "Users can view own pairings" ON wishlist_pairings
  FOR SELECT 
  USING (user_id = auth.uid());

-- Users can insert their own pairings
CREATE POLICY "Users can insert own pairings" ON wishlist_pairings
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

-- Users can update their own pairings
CREATE POLICY "Users can update own pairings" ON wishlist_pairings
  FOR UPDATE 
  USING (user_id = auth.uid());

-- Users can delete their own pairings
CREATE POLICY "Users can delete own pairings" ON wishlist_pairings
  FOR DELETE 
  USING (user_id = auth.uid());

-- ==============================================
-- PART 7: Views for Easy Querying
-- ==============================================

-- View combining wishlist items with valid pairings
CREATE OR REPLACE VIEW wishlist_items_with_pairings AS
SELECT 
  wi.*,
  wp.suggestions as pairing_suggestions,
  wp.reasoning as pairing_reasoning,
  wp.completeness_note as pairing_completeness_note,
  wp.generated_at as pairing_generated_at,
  wp.expires_at as pairing_expires_at,
  (wp.expires_at > NOW()) as has_valid_pairings
FROM wishlist_items wi
LEFT JOIN LATERAL (
  SELECT *
  FROM wishlist_pairings
  WHERE wishlist_item_id = wi.id
  ORDER BY generated_at DESC
  LIMIT 1
) wp ON true;

-- ==============================================
-- PART 8: Comments for Documentation
-- ==============================================

COMMENT ON TABLE wishlist_pairings IS 
  'Stores OpenAI-generated outfit pairing suggestions for wishlist items with user closet';

COMMENT ON COLUMN wishlist_pairings.suggestions IS 
  'JSON array of pairing suggestions with item details, reasoning, and style scores';

COMMENT ON COLUMN wishlist_pairings.reasoning IS 
  'Overall AI reasoning explaining the pairing strategy';

COMMENT ON COLUMN wishlist_pairings.expires_at IS 
  'When pairing suggestions expire and need regeneration (default 7 days)';

COMMENT ON COLUMN wishlist_pairings.closet_size_at_generation IS 
  'Number of closet items available when pairings were generated';

COMMENT ON COLUMN wishlist_items.has_pairings IS 
  'Quick flag indicating if valid pairings exist for this item';

COMMENT ON COLUMN wishlist_items.pairing_generation_status IS 
  'Current status: pending, generating, completed, or failed';

COMMENT ON FUNCTION get_valid_pairings IS 
  'Returns non-expired pairing suggestions for a wishlist item';

COMMENT ON FUNCTION pairings_need_refresh IS 
  'Checks if pairings are expired or missing and need regeneration';

COMMENT ON FUNCTION invalidate_all_pairings_for_user IS 
  'Forces all user pairings to expire (use after major closet changes)';

COMMENT ON VIEW wishlist_items_with_pairings IS 
  'Convenient view joining wishlist items with their latest pairing suggestions';

-- ==============================================
-- Migration Complete!
-- ==============================================
-- Next steps:
-- 1. Implement closetPairingService.ts
-- 2. Create UI components (ClosetPairingGrid.tsx)
-- 3. Test pairing generation with real data
-- 4. Monitor OpenAI API costs
