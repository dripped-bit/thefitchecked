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
