-- ============================================
-- WISHLIST CRON JOB DIAGNOSTIC QUERIES
-- ============================================
-- Copy and run these in Supabase SQL Editor
-- to diagnose why cron isn't populating data
-- ============================================

-- STEP 1: Check if tables exist
-- Expected: Should return 2 rows
SELECT 'Step 1: Check Tables Exist' as step;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('wishlist_price_history', 'wishlist_items');

-- STEP 2: Check if monitoring columns exist
-- Expected: Should return 4 rows
SELECT 'Step 2: Check Monitoring Columns' as step;
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'wishlist_items'
AND column_name IN (
  'price_monitoring_enabled',
  'price_numeric',
  'last_price_check',
  'lowest_price_seen'
)
ORDER BY column_name;

-- STEP 3: Count total wishlist items
-- Expected: Should be > 0
SELECT 'Step 3: Total Wishlist Items' as step;
SELECT COUNT(*) as total_items FROM wishlist_items;

-- STEP 4: Count items with monitoring enabled
-- Expected: Should be > 0
SELECT 'Step 4: Items With Monitoring Enabled' as step;
SELECT COUNT(*) as enabled_count 
FROM wishlist_items 
WHERE price_monitoring_enabled = true;

-- STEP 5: Count items with URLs
-- Expected: Should be > 0
SELECT 'Step 5: Items With URLs' as step;
SELECT COUNT(*) as items_with_urls 
FROM wishlist_items 
WHERE url IS NOT NULL AND url != '';

-- STEP 6: View sample items
-- Check if items are ready for monitoring
SELECT 'Step 6: Sample Items Ready for Monitoring' as step;
SELECT 
  id,
  name,
  SUBSTRING(url, 1, 50) as url_preview,
  price_monitoring_enabled,
  last_price_check
FROM wishlist_items
LIMIT 5;

-- STEP 7: Count price history entries (all time)
-- This tells us if cron has EVER run
SELECT 'Step 7: Total Price History Entries' as step;
SELECT 
  COUNT(*) as total_entries,
  COUNT(DISTINCT wishlist_item_id) as unique_items,
  MIN(checked_at) as first_check,
  MAX(checked_at) as last_check
FROM wishlist_price_history;

-- STEP 8: Count recent checks (last 24 hours)
-- This tells us if cron is running recently
SELECT 'Step 8: Recent Checks (Last 24 Hours)' as step;
SELECT 
  COUNT(*) as recent_checks,
  COUNT(DISTINCT wishlist_item_id) as items_checked
FROM wishlist_price_history 
WHERE checked_at > NOW() - INTERVAL '24 hours'
  AND source = 'claude_scrape';

-- STEP 9: View recent price checks
-- Shows actual data if available
SELECT 'Step 9: Most Recent Price Checks' as step;
SELECT 
  wi.name,
  wph.price,
  wph.checked_at,
  wph.source
FROM wishlist_price_history wph
JOIN wishlist_items wi ON wi.id = wph.wishlist_item_id
WHERE wph.source = 'claude_scrape'
ORDER BY wph.checked_at DESC
LIMIT 10;

-- ============================================
-- DIAGNOSTIC SUMMARY
-- ============================================

SELECT 'DIAGNOSTIC SUMMARY' as summary;
SELECT 
  (SELECT COUNT(*) FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('wishlist_price_history', 'wishlist_items')) as tables_exist,
  
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_name = 'wishlist_items'
   AND column_name IN ('price_monitoring_enabled', 'price_numeric', 'last_price_check')) as columns_exist,
  
  (SELECT COUNT(*) FROM wishlist_items) as total_items,
  
  (SELECT COUNT(*) FROM wishlist_items WHERE price_monitoring_enabled = true) as enabled_items,
  
  (SELECT COUNT(*) FROM wishlist_items WHERE url IS NOT NULL AND url != '') as items_with_urls,
  
  (SELECT COUNT(*) FROM wishlist_price_history) as total_history,
  
  (SELECT COUNT(*) FROM wishlist_price_history 
   WHERE checked_at > NOW() - INTERVAL '24 hours') as recent_checks;

-- ============================================
-- QUICK FIXES (Uncomment and run if needed)
-- ============================================

-- FIX 1: Enable monitoring for all items with URLs
-- UPDATE wishlist_items 
-- SET price_monitoring_enabled = true
-- WHERE url IS NOT NULL AND url != '';

-- FIX 2: Enable monitoring for ALL items
-- UPDATE wishlist_items 
-- SET price_monitoring_enabled = true;

-- FIX 3: Check items that need URLs
-- SELECT id, name, url FROM wishlist_items WHERE url IS NULL OR url = '';

-- FIX 4: Add URL to specific item
-- UPDATE wishlist_items 
-- SET url = 'https://www.nike.com/t/product-name-abc123'
-- WHERE id = 'your-item-uuid';

-- ============================================
-- EXPECTED RESULTS FOR WORKING SYSTEM:
-- ============================================
-- tables_exist: 2
-- columns_exist: 3
-- total_items: > 0
-- enabled_items: > 0
-- items_with_urls: > 0
-- total_history: > 0 (if cron has run at least once)
-- recent_checks: > 0 (if cron ran in last 24 hours)
