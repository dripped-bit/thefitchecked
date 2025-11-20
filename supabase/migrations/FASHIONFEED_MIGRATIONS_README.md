# FashionFeed Database Migrations

## 📋 Overview

This document outlines the database requirements for FashionFeed (all phases).

---

## ✅ Already Completed Migrations

These migrations were created and run in previous sessions:

### 1. **add_wore_today_to_calendar_events.sql** ✅
- Adds `wore_today` BOOLEAN column to `calendar_events`
- Adds `outfit_image_url` TEXT column comments
- Creates index on `wore_today`
- **Status:** Already exists and migrated
- **Used by:** YourFitsWeekSection to track worn outfits

### 2. **add_outfit_image_url_to_calendar_events.sql** ✅
- Adds `outfit_image_url` TEXT column to `calendar_events`
- **Status:** Already exists and migrated
- **Used by:** YourFitsWeekSection to display outfit photos

---

## 🆕 New Migration (If Needed)

### 3. **create_outfit_history_table.sql** 🔍
- Creates `outfit_history` table for tracking worn outfits
- **Status:** MAY NOT EXIST - Run verification first
- **Used by:** YourFitsWeekSection timeline display

---

## 🚀 How to Run Migrations

### Step 1: Verify What Exists

Run this in **Supabase SQL Editor**:

```bash
# Copy and paste contents of:
supabase/migrations/verify_fashionfeed_tables.sql
```

**Check the results:**
- If `outfit_history_exists` = **TRUE** → All done! ✅
- If `outfit_history_exists` = **FALSE** → Run Step 2

### Step 2: Create Missing Table (If Needed)

If verification shows `outfit_history` doesn't exist:

```bash
# Copy and paste contents of:
supabase/migrations/create_outfit_history_table.sql
```

---

## 📊 Tables Used by FashionFeed

### closet_items ✅
**Columns Used:**
- `id`, `user_id`, `name`, `category`, `subcategory`
- `image_url`, `thumbnail_url`, `color`, `pattern`
- `brand`, `price`, `times_worn`, `last_worn`

**Sections:** All (Color Story, Closet Heroes, Weekly Challenge, Style Steal, AI Spotted)

---

### calendar_events ✅
**New Columns:**
- `wore_today` BOOLEAN
- `outfit_image_url` TEXT

**Sections:** YourFitsWeekSection

---

### outfit_history 🔍
**All Columns:**
- `id`, `user_id`, `worn_date`
- `outfit_items` (JSONB)
- `event_id`, `event_type`
- `weather_data` (JSONB)
- `time_of_day`, `day_of_week`
- `user_rating`, `mood`, `notes`

**Sections:** YourFitsWeekSection

---

## 🎯 Quick Start Checklist

- [ ] Run `verify_fashionfeed_tables.sql` in Supabase
- [ ] Check if `outfit_history` exists
- [ ] If missing, run `create_outfit_history_table.sql`
- [ ] Verify all migrations with verification script
- [ ] Test FashionFeed in app

---

## 💡 Notes

1. **No migrations needed for Phases 1 & 2** - They only use existing closet_items
2. **Phase 3 needs outfit_history** - For the Your Fits Week timeline
3. **All external API data** (Unsplash, Claude, OpenAI) is fetched in real-time, not stored
4. **Row Level Security** enabled on outfit_history for data privacy

---

## 🔗 Related Files

- `/src/services/outfitHistoryService.ts` - Service using outfit_history
- `/src/components/fashionfeed/YourFitsWeekSection.tsx` - Component using timeline
- `/src/pages/MorningMode.tsx` - Saves to outfit_history on "Wear This Today"
- `/src/components/WoreThisTodayTracker.tsx` - Saves to outfit_history on upload

---

**Created:** 2025-11-20  
**Last Updated:** 2025-11-20  
**Version:** Phase 3 Complete
