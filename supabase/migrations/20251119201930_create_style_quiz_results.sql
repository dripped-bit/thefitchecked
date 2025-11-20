-- Create style_quiz_results table
-- Stores user style quiz answers and AI-generated results

CREATE TABLE IF NOT EXISTS style_quiz_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Quiz answers (raw)
  visual_style TEXT[] NOT NULL DEFAULT '{}',
  weekend_outfit TEXT NOT NULL DEFAULT '',
  shopping_trigger TEXT[] NOT NULL DEFAULT '{}',
  color_palette TEXT NOT NULL DEFAULT '',
  fit_priority TEXT[] NOT NULL DEFAULT '{}',
  style_icons TEXT[] NOT NULL DEFAULT '{}',
  
  -- AI Analysis results
  style_type TEXT NOT NULL DEFAULT '',
  style_description TEXT NOT NULL DEFAULT '',
  personality TEXT NOT NULL DEFAULT '',
  shopping_behavior TEXT NOT NULL DEFAULT '',
  priorities TEXT[] NOT NULL DEFAULT '{}',
  recommended_palette JSONB NOT NULL DEFAULT '[]',
  recommended_brands TEXT[] NOT NULL DEFAULT '{}',
  styling_tips TEXT[] NOT NULL DEFAULT '{}',
  ai_insights TEXT NOT NULL DEFAULT '',
  
  -- Metadata
  quiz_version INTEGER DEFAULT 1,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT one_quiz_per_user UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE style_quiz_results ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read own results
CREATE POLICY "Users can read own quiz results"
  ON style_quiz_results FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert own results
CREATE POLICY "Users can insert own quiz results"
  ON style_quiz_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update own results
CREATE POLICY "Users can update own quiz results"
  ON style_quiz_results FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete own results
CREATE POLICY "Users can delete own quiz results"
  ON style_quiz_results FOR DELETE
  USING (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_style_quiz_user ON style_quiz_results(user_id);
CREATE INDEX IF NOT EXISTS idx_style_quiz_completed ON style_quiz_results(completed_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_style_quiz_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_style_quiz_timestamp
  BEFORE UPDATE ON style_quiz_results
  FOR EACH ROW
  EXECUTE FUNCTION update_style_quiz_updated_at();

COMMENT ON TABLE style_quiz_results IS 'Stores user style quiz answers and AI-generated personalized style profiles';
