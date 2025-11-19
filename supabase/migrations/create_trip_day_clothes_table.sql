-- Create trip_day_clothes table for storing manually added clothes for specific trip days
-- This allows users to add extra clothes beyond what's in their activity outfits

CREATE TABLE IF NOT EXISTS trip_day_clothes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  clothing_item_id UUID NOT NULL REFERENCES clothing_items(id) ON DELETE CASCADE,
  added_manually BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate entries for the same item on the same day
  UNIQUE(trip_id, date, clothing_item_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_trip_day_clothes_trip_date ON trip_day_clothes(trip_id, date);
CREATE INDEX IF NOT EXISTS idx_trip_day_clothes_item ON trip_day_clothes(clothing_item_id);

-- Add RLS (Row Level Security) policies
ALTER TABLE trip_day_clothes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own trip day clothes
CREATE POLICY "Users can view own trip day clothes" ON trip_day_clothes
  FOR SELECT
  USING (
    trip_id IN (
      SELECT id FROM trips WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can insert their own trip day clothes
CREATE POLICY "Users can insert own trip day clothes" ON trip_day_clothes
  FOR INSERT
  WITH CHECK (
    trip_id IN (
      SELECT id FROM trips WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can delete their own trip day clothes
CREATE POLICY "Users can delete own trip day clothes" ON trip_day_clothes
  FOR DELETE
  USING (
    trip_id IN (
      SELECT id FROM trips WHERE user_id = auth.uid()
    )
  );

-- Add helpful comment
COMMENT ON TABLE trip_day_clothes IS 'Stores manually added clothing items for specific trip days, separate from activity outfits';
COMMENT ON COLUMN trip_day_clothes.added_manually IS 'Always true for manual additions; false could be used for system-generated suggestions';
