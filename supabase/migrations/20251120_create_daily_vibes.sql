-- Create daily_vibes table for FashionFeed vibe tracking
CREATE TABLE IF NOT EXISTS daily_vibes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  vibe_date DATE NOT NULL,
  vibe_text TEXT,
  photos JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, vibe_date)
);

-- Index for fast lookups by user and date
CREATE INDEX IF NOT EXISTS idx_daily_vibes_user_date ON daily_vibes(user_id, vibe_date);

-- Enable Row Level Security
ALTER TABLE daily_vibes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own vibes
CREATE POLICY "Users can view own vibes" ON daily_vibes
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own vibes
CREATE POLICY "Users can insert own vibes" ON daily_vibes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own vibes
CREATE POLICY "Users can update own vibes" ON daily_vibes
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own vibes
CREATE POLICY "Users can delete own vibes" ON daily_vibes
  FOR DELETE USING (auth.uid() = user_id);

-- Comment
COMMENT ON TABLE daily_vibes IS 'Stores daily vibe text and photos for FashionFeed';
