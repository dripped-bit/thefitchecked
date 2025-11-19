-- Create trip_checklist table for LIST page checklist items
CREATE TABLE IF NOT EXISTS trip_checklist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'clothing', 'toiletries', 'documents', 'electronics'
  item_count INTEGER DEFAULT 1,
  is_checked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_trip_checklist_item UNIQUE(trip_id, category, item_name)
);

-- Add RLS policies
ALTER TABLE trip_checklist ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own checklist items
CREATE POLICY "Users can view own trip checklist"
  ON trip_checklist
  FOR SELECT
  USING (
    trip_id IN (
      SELECT id FROM trips WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can insert their own checklist items
CREATE POLICY "Users can insert own trip checklist"
  ON trip_checklist
  FOR INSERT
  WITH CHECK (
    trip_id IN (
      SELECT id FROM trips WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can update their own checklist items
CREATE POLICY "Users can update own trip checklist"
  ON trip_checklist
  FOR UPDATE
  USING (
    trip_id IN (
      SELECT id FROM trips WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can delete their own checklist items
CREATE POLICY "Users can delete own trip checklist"
  ON trip_checklist
  FOR DELETE
  USING (
    trip_id IN (
      SELECT id FROM trips WHERE user_id = auth.uid()
    )
  );

-- Create index for faster queries
CREATE INDEX idx_trip_checklist_trip_id ON trip_checklist(trip_id);
CREATE INDEX idx_trip_checklist_category ON trip_checklist(category);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_trip_checklist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trip_checklist_updated_at
  BEFORE UPDATE ON trip_checklist
  FOR EACH ROW
  EXECUTE FUNCTION update_trip_checklist_updated_at();
