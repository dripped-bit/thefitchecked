# Smart Calendar Setup Instructions

## ⚠️ IMPORTANT: Run Database Migration First

Before the Smart Calendar feature will work, you need to create the `calendar_events` table in your Supabase database.

### Steps:

1. **Go to your Supabase Dashboard**
   - Visit https://supabase.com/dashboard
   - Select your Fit Checked project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run the Migration**
   - Open the file: `calendar-events-migration.sql`
   - Copy all the SQL code
   - Paste it into the Supabase SQL Editor
   - Click "Run" button

4. **Verify Table Created**
   - Go to "Table Editor" in Supabase
   - You should see a new table called `calendar_events`
   - It should have columns: id, user_id, title, description, start_time, end_time, location, event_type, is_all_day, outfit_id, weather_required, created_at, updated_at

## What Changed

### Before (Mock System):
- Fake "Connect Google/Apple Calendar" buttons
- Hardcoded demo events
- No real data storage

### After (Real System):
- "Add Event" button to create calendar entries
- Events saved to Supabase database
- Events persist across sessions
- Can link outfits from "My Outfits" to events
- Edit/delete calendar events

## Features

- ✅ Create calendar events manually
- ✅ Set event type (work, personal, travel, formal, casual)
- ✅ Add location and description
- ✅ All-day events support
- ✅ Link saved outfits to events
- ✅ Weather integration for outdoor events
- ✅ Monthly/weekly view
- ✅ Edit and delete events

## Next Steps

After running the SQL migration, the Smart Calendar will work automatically. Users can:
1. Click "Smart Calendar" in the closet sidebar
2. Click "Add Event" to create new calendar entries
3. View all their upcoming events
4. Plan outfits for specific dates/events
