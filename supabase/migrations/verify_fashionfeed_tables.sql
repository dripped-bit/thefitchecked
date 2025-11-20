-- Verification Script for FashionFeed Database Requirements
-- Run this in Supabase SQL Editor to check if all tables exist

-- ============================================
-- CHECK 1: Verify outfit_history table exists
-- ============================================
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'outfit_history'
) as outfit_history_exists;

-- ============================================
-- CHECK 2: Verify calendar_events has required columns
-- ============================================
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'calendar_events' 
AND column_name IN ('wore_today', 'outfit_image_url')
ORDER BY column_name;

-- ============================================
-- CHECK 3: Verify closet_items has wear tracking columns
-- ============================================
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'closet_items'
AND column_name IN ('times_worn', 'last_worn', 'color', 'brand')
ORDER BY column_name;

-- ============================================
-- EXPECTED RESULTS:
-- ============================================
-- outfit_history_exists: TRUE
-- calendar_events: wore_today (boolean), outfit_image_url (text)
-- closet_items: times_worn (integer), last_worn (text/date), color (text), brand (text)
