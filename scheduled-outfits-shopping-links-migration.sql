-- Add shopping_links column to scheduled_outfits table
-- Run this in your Supabase SQL Editor if you're using the scheduled_outfits table

alter table if exists scheduled_outfits add column if not exists shopping_links jsonb default '[]'::jsonb;

-- Add index for shopping_links
create index if not exists scheduled_outfits_shopping_links_idx on scheduled_outfits using gin (shopping_links);

-- shopping_links format:
-- [
--   {
--     "title": "Product Name",
--     "store": "Store Name",
--     "url": "https://...",
--     "affiliateUrl": "https://...",
--     "price": "$99.99",
--     "image": "https://...",
--     "imageUrl": "https://..."
--   }
-- ]
