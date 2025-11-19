-- Calendar Events Enhancements Migration
-- Adds missing fields for enhanced calendar functionality
-- Run this in your Supabase SQL Editor

-- Add google_calendar_id if it doesn't exist
alter table calendar_events 
add column if not exists google_calendar_id text;

-- Add outfit_image_url if it doesn't exist (optional: cache outfit image for faster loading)
alter table calendar_events 
add column if not exists outfit_image_url text;

-- Add index for google_calendar_id lookups
create index if not exists calendar_events_google_calendar_id_idx 
on calendar_events(google_calendar_id);

-- Add comment to explain fields
comment on column calendar_events.google_calendar_id is 'Google Calendar event ID for syncing';
comment on column calendar_events.outfit_image_url is 'Cached outfit image URL for performance';
comment on column calendar_events.shopping_links is 'JSON array of shopping links for outfit items';
