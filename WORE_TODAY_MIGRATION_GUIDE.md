# Wore Today Feature - Database Migration Guide

## 🎯 Overview

This guide explains how to enable the new **Outfit Wear Tracking** feature that integrates Weather Picks, Wore This Today, and the calendar display.

---

## 📋 Prerequisites

- Supabase project with `calendar_events` table
- Access to Supabase SQL Editor or `psql` command line

---

## 🚀 Migration Steps

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the migration below
5. Click **Run**
6. Verify success message

### Option 2: Command Line

```bash
# Using psql
psql $DATABASE_URL -f supabase/migrations/add_wore_today_to_calendar_events.sql

# Or using Supabase CLI
supabase db push
```

---

## 📝 Migration SQL

```sql
-- Add wore_today field to calendar_events table
-- This tracks whether an outfit was actually worn (vs just planned)

ALTER TABLE calendar_events 
ADD COLUMN IF NOT EXISTS wore_today BOOLEAN DEFAULT false;

-- Add comment explaining the field
COMMENT ON COLUMN calendar_events.wore_today IS 
  'TRUE if this outfit was actually worn (from Weather Picks "Wear This Today" or Wore This Today tracker). 
   FALSE if just planned. Used for visual indicators and AI wear tracking analytics.';

-- Create index for efficient filtering of worn outfits
CREATE INDEX IF NOT EXISTS calendar_events_wore_today_idx 
  ON calendar_events(wore_today) WHERE wore_today = true;

-- Add helpful comment on outfit_image_url for clarity
COMMENT ON COLUMN calendar_events.outfit_image_url IS 
  'URL of the outfit image to display on calendar. Can be from uploaded photo (Wore This Today), 
   closet item image, or product image from shopping links.';
```

---

## ✅ Verification

After running the migration, verify it worked:

```sql
-- Check column exists
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'calendar_events'
  AND column_name = 'wore_today';

-- Check index exists
SELECT indexname
FROM pg_indexes
WHERE tablename = 'calendar_events'
  AND indexname = 'calendar_events_wore_today_idx';

-- Expected Results:
-- column_name: wore_today
-- data_type: boolean
-- column_default: false
-- indexname: calendar_events_wore_today_idx
```

---

## 🎨 What This Enables

### 1. Weather Picks Integration
- Users click "Wear This Today" on outfit suggestions
- Outfit saved to calendar with `wore_today: true`
- Saved to `outfit_history` for AI learning
- Displays on calendar with green "✓ Worn" badge

### 2. Wore This Today Integration
- Users upload outfit photos
- Automatically creates calendar event
- Photo appears in calendar grid
- Shows "✓ Worn" badge

### 3. Calendar Visual Indicators
- **Planned outfits**: No badge
- **Worn outfits**: Green "✓ Worn" badge
- Easy visual distinction

### 4. AI Analytics Foundation
- Cost-per-wear calculations
- Style preference learning
- Brand choice tracking
- Wear frequency analysis

---

## 🔍 Example Queries

### Get all worn outfits
```sql
SELECT 
  id,
  title,
  start_time,
  outfit_image_url,
  wore_today
FROM calendar_events
WHERE wore_today = true
ORDER BY start_time DESC;
```

### Count worn vs planned
```sql
SELECT 
  wore_today,
  COUNT(*) as count
FROM calendar_events
GROUP BY wore_today;
```

### Worn outfits this month
```sql
SELECT 
  DATE(start_time) as date,
  title,
  outfit_image_url
FROM calendar_events
WHERE wore_today = true
  AND start_time >= DATE_TRUNC('month', CURRENT_DATE)
  AND start_time < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
ORDER BY start_time DESC;
```

---

## 🔄 Rollback (If Needed)

If you need to undo the migration:

```sql
-- Remove index
DROP INDEX IF EXISTS calendar_events_wore_today_idx;

-- Remove column
ALTER TABLE calendar_events 
DROP COLUMN IF EXISTS wore_today;
```

**⚠️ Warning:** This will delete all wore_today data. Make sure to backup first!

---

## 📊 Performance Impact

- **Index size**: Minimal (partial index on `wore_today = true` only)
- **Query performance**: Improved for filtering worn outfits
- **Storage**: +1 byte per row (BOOLEAN column)
- **Impact**: Negligible

---

## 🐛 Troubleshooting

### Migration fails: "column already exists"
```sql
-- Check if column exists
SELECT column_name 
FROM information_schema.columns
WHERE table_name = 'calendar_events' 
  AND column_name = 'wore_today';

-- If exists, just create the index:
CREATE INDEX IF NOT EXISTS calendar_events_wore_today_idx 
  ON calendar_events(wore_today) WHERE wore_today = true;
```

### Permission denied
- Ensure you have ALTER TABLE permissions
- Contact Supabase admin if using organization project

### Index creation fails
```sql
-- Check existing indexes
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'calendar_events';

-- If index exists with different name, drop and recreate
DROP INDEX existing_index_name;
CREATE INDEX calendar_events_wore_today_idx 
  ON calendar_events(wore_today) WHERE wore_today = true;
```

---

## 📚 Related Documentation

- [Outfit History Service](./src/services/outfitHistoryService.ts)
- [Smart Calendar Service](./src/services/smartCalendarService.ts)
- [Weather Picks (Morning Mode)](./src/pages/MorningMode.tsx)
- [Wore This Today Tracker](./src/components/WoreThisTodayTracker.tsx)
- [Calendar Display](./src/components/EnhancedMonthlyCalendarGrid.tsx)

---

## 🎉 Success!

After running this migration, users can:
- ✅ Track worn outfits from Weather Picks
- ✅ Upload outfit photos to calendar
- ✅ See visual "✓ Worn" badges
- ✅ Build AI-ready wear history data

**The feature is now ready to use!**
