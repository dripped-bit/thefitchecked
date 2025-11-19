-- Create trip_insights table for caching AI analysis results
CREATE TABLE IF NOT EXISTS trip_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  insights_data JSONB NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_trip_insights UNIQUE(trip_id)
);

-- Add RLS policies
ALTER TABLE trip_insights ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own insights
CREATE POLICY "Users can view own trip insights"
  ON trip_insights
  FOR SELECT
  USING (
    trip_id IN (
      SELECT id FROM trips WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can insert their own insights
CREATE POLICY "Users can insert own trip insights"
  ON trip_insights
  FOR INSERT
  WITH CHECK (
    trip_id IN (
      SELECT id FROM trips WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can update their own insights
CREATE POLICY "Users can update own trip insights"
  ON trip_insights
  FOR UPDATE
  USING (
    trip_id IN (
      SELECT id FROM trips WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can delete their own insights
CREATE POLICY "Users can delete own trip insights"
  ON trip_insights
  FOR DELETE
  USING (
    trip_id IN (
      SELECT id FROM trips WHERE user_id = auth.uid()
    )
  );

-- Create index for faster queries
CREATE INDEX idx_trip_insights_trip_id ON trip_insights(trip_id);
CREATE INDEX idx_trip_insights_expires_at ON trip_insights(expires_at);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_trip_insights_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trip_insights_updated_at
  BEFORE UPDATE ON trip_insights
  FOR EACH ROW
  EXECUTE FUNCTION update_trip_insights_updated_at();
