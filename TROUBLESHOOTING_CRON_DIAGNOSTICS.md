# Cron Job Troubleshooting Diagnostics

## 🚨 Problem: Zero Results from Price History

You ran this query and got **0 results**:
```sql
SELECT COUNT(*) FROM wishlist_price_history 
WHERE source = 'claude_scrape' 
AND checked_at > NOW() - INTERVAL '24 hours';
```

Follow these steps to diagnose the issue.

---

## 🔍 Step-by-Step Diagnostic

### 1️⃣ Run Complete Diagnostic (Copy/Paste into Supabase)

**Copy this entire block into Supabase SQL Editor and run it:**

```sql
-- ===========================================
-- COMPLETE DIAGNOSTIC REPORT
-- ===========================================

DO $$ 
DECLARE
  table_count INT;
  column_count INT;
  item_count INT;
  enabled_count INT;
  url_count INT;
  history_count INT;
  recent_count INT;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'WISHLIST CRON JOB DIAGNOSTIC REPORT';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- 1. Check tables exist
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN ('wishlist_price_history', 'wishlist_items');
  
  RAISE NOTICE '1. TABLES CHECK: %', 
    CASE WHEN table_count = 2 THEN '✓ PASS - Both tables exist' 
         ELSE '✗ FAIL - Missing tables! Run migrations!' END;

  -- 2. Check columns exist
  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns
  WHERE table_name = 'wishlist_items'
  AND column_name IN ('price_monitoring_enabled', 'price_numeric', 'last_price_check');
  
  RAISE NOTICE '2. COLUMNS CHECK: %', 
    CASE WHEN column_count = 3 THEN '✓ PASS - All monitoring columns exist' 
         ELSE '✗ FAIL - Missing columns! Run migrations!' END;

  -- 3. Count wishlist items
  SELECT COUNT(*) INTO item_count FROM wishlist_items;
  
  RAISE NOTICE '3. WISHLIST ITEMS: %', 
    CASE WHEN item_count > 0 THEN '✓ PASS - ' || item_count || ' items found' 
         ELSE '✗ FAIL - No wishlist items! Add items first!' END;

  -- 4. Count items with monitoring enabled
  SELECT COUNT(*) INTO enabled_count 
  FROM wishlist_items 
  WHERE price_monitoring_enabled = true;
  
  RAISE NOTICE '4. MONITORING ENABLED: %', 
    CASE WHEN enabled_count > 0 THEN '✓ PASS - ' || enabled_count || ' items enabled' 
         ELSE '✗ FAIL - No items enabled! Run: UPDATE wishlist_items SET price_monitoring_enabled = true;' END;

  -- 5. Count items with URLs
  SELECT COUNT(*) INTO url_count 
  FROM wishlist_items 
  WHERE url IS NOT NULL AND url != '';
  
  RAISE NOTICE '5. ITEMS WITH URLs: %', 
    CASE WHEN url_count > 0 THEN '✓ PASS - ' || url_count || ' items have URLs' 
         ELSE '✗ FAIL - No items have URLs! Add product URLs!' END;

  -- 6. Count price history entries
  SELECT COUNT(*) INTO history_count FROM wishlist_price_history;
  
  RAISE NOTICE '6. PRICE HISTORY: %', 
    CASE WHEN history_count > 0 THEN '✓ PASS - ' || history_count || ' entries found' 
         ELSE '✗ FAIL - No price history! Cron hasn''t run or failed!' END;

  -- 7. Recent price checks (last 24 hours)
  SELECT COUNT(*) INTO recent_count 
  FROM wishlist_price_history 
  WHERE checked_at > NOW() - INTERVAL '24 hours';
  
  RAISE NOTICE '7. RECENT CHECKS (24h): %', 
    CASE WHEN recent_count > 0 THEN '✓ PASS - ' || recent_count || ' recent checks' 
         ELSE '✗ INFO - No checks in last 24h (may not have run yet)' END;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'DETAILED DATA:';
  RAISE NOTICE '========================================';
END $$;

-- Show sample items
SELECT 
  'SAMPLE ITEMS:' as info,
  id,
  name,
  CASE WHEN url IS NOT NULL AND url != '' THEN '✓ Has URL' ELSE '✗ No URL' END as url_status,
  CASE WHEN price_monitoring_enabled THEN '✓ Enabled' ELSE '✗ Disabled' END as monitoring_status,
  last_price_check
FROM wishlist_items
LIMIT 5;

-- Show recent price checks if any
SELECT 
  'RECENT PRICE CHECKS:' as info,
  wi.name,
  wph.price,
  wph.checked_at
FROM wishlist_price_history wph
JOIN wishlist_items wi ON wi.id = wph.wishlist_item_id
WHERE wph.source = 'claude_scrape'
ORDER BY wph.checked_at DESC
LIMIT 5;
```

---

## 📊 Interpreting Results

### If you see these FAILURES:

**✗ FAIL - Missing tables! Run migrations!**
```sql
-- Run this in Supabase SQL Editor:
-- Copy entire content of wishlist-price-monitoring-migration.sql
```

**✗ FAIL - Missing columns! Run migrations!**
```sql
-- Run this in Supabase SQL Editor:
-- Copy entire content of wishlist-price-monitoring-migration.sql
```

**✗ FAIL - No wishlist items!**
- Go to your app and add items to wishlist

**✗ FAIL - No items enabled!**
```sql
-- Enable monitoring for all items:
UPDATE wishlist_items SET price_monitoring_enabled = true;

-- Verify:
SELECT id, name, price_monitoring_enabled FROM wishlist_items LIMIT 5;
```

**✗ FAIL - No items have URLs!**
```sql
-- Add URLs to your items:
UPDATE wishlist_items 
SET url = 'https://www.nike.com/t/product-name-abc123'
WHERE id = 'your-item-id';
```

**✗ FAIL - No price history!**
- Cron hasn't run yet or failed
- Check Vercel logs: `vercel logs --follow`
- Manually trigger: `vercel cron trigger /api/cron/check-wishlist-prices`

---

## 🔧 Quick Fixes

### Fix 1: Enable Monitoring for All Items
```sql
UPDATE wishlist_items 
SET price_monitoring_enabled = true
WHERE url IS NOT NULL AND url != '';

-- Verify
SELECT 
  COUNT(*) as enabled_items
FROM wishlist_items 
WHERE price_monitoring_enabled = true;
```

### Fix 2: Check Environment Variables

Run in terminal:
```bash
# List environment variables in Vercel
vercel env ls

# Should show:
# VITE_SUPABASE_URL
# SUPABASE_SERVICE_ROLE_KEY  ← CRITICAL
# CLAUDE_API_KEY
# CRON_SECRET
```

If missing, add in Vercel Dashboard → Settings → Environment Variables

### Fix 3: Manually Trigger Cron

```bash
# Trigger now (don't wait 6 hours)
vercel cron trigger /api/cron/check-wishlist-prices

# Watch logs in real-time
vercel logs --follow
```

### Fix 4: Check Vercel Cron Status

```bash
# List all crons
vercel crons ls

# Expected output:
# /api/cron/check-wishlist-prices  0 */6 * * *  Active

# If not listed, redeploy:
git push
```

---

## 📝 Checklist (Run in Order)

```
□ 1. Run diagnostic SQL (above)
□ 2. Check if tables exist (both should exist)
□ 3. Check if columns exist (all 3 should exist)
□ 4. Check if items exist (should be > 0)
□ 5. Enable monitoring: UPDATE wishlist_items SET price_monitoring_enabled = true;
□ 6. Verify items have URLs
□ 7. Check Vercel environment variables (SUPABASE_SERVICE_ROLE_KEY!)
□ 8. Check cron is active: vercel crons ls
□ 9. Manually trigger: vercel cron trigger /api/cron/check-wishlist-prices
□ 10. Check logs: vercel logs --follow
□ 11. Re-run diagnostic SQL to verify
```

---

## ✅ Success Criteria

You'll know it's working when:

1. **Diagnostic shows all PASS:**
```
✓ PASS - Both tables exist
✓ PASS - All monitoring columns exist  
✓ PASS - X items found
✓ PASS - X items enabled
✓ PASS - X items have URLs
✓ PASS - X entries found
✓ PASS - X recent checks
```

2. **This query returns > 0:**
```sql
SELECT COUNT(*) FROM wishlist_price_history;
```

3. **Vercel logs show:**
```
✅ [CRON] Completed in 45000ms
✅ [CRON] Success: 10, Failed: 0
```

---

## 🆘 Common Issues

### Issue: "No items to monitor" in logs
**Fix:** Enable monitoring
```sql
UPDATE wishlist_items SET price_monitoring_enabled = true;
```

### Issue: "Failed to fetch items" in logs  
**Fix:** Add SUPABASE_SERVICE_ROLE_KEY to Vercel
1. Supabase Dashboard → Settings → API → Copy service_role key
2. Vercel → Settings → Environment Variables → Add

### Issue: "Claude API error" in logs
**Fix:** Add CLAUDE_API_KEY to Vercel
1. Verify key at console.anthropic.com
2. Vercel → Settings → Environment Variables → Add

---

## 📞 Need More Help?

Run these commands and share the output:

```bash
# 1. Check Vercel cron status
vercel crons ls

# 2. Check environment variables (won't show values)
vercel env ls

# 3. Trigger cron and watch logs
vercel cron trigger /api/cron/check-wishlist-prices
vercel logs --follow

# 4. Run diagnostic SQL in Supabase (above)
```

Then share what failed so we can debug further!
