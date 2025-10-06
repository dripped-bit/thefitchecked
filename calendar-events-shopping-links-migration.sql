-- Add shopping_links column to calendar_events table
-- Run this in your Supabase SQL Editor after running the initial calendar-events-migration.sql

alter table calendar_events add column if not exists shopping_links jsonb default '[]'::jsonb;

-- Add index for shopping_links
create index if not exists calendar_events_shopping_links_idx on calendar_events using gin (shopping_links);

-- shopping_links format:
-- [
--   {
--     "title": "Product Name",
--     "store": "Store Name",
--     "url": "https://...",
--     "affiliateUrl": "https://...",
--     "price": "$99.99",
--     "image": "https://..."
--   }
-- ]
