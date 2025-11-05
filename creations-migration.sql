-- Migration: Add creations tracking to outfits table
-- This allows us to distinguish AI-generated try-on results from regular outfits

-- Add is_creation column to flag AI-generated try-on results
ALTER TABLE outfits
ADD COLUMN IF NOT EXISTS is_creation BOOLEAN DEFAULT FALSE;

-- Add generation_prompt column to store the user's original input prompt
ALTER TABLE outfits
ADD COLUMN IF NOT EXISTS generation_prompt TEXT;

-- Add index for faster queries on creations
CREATE INDEX IF NOT EXISTS idx_outfits_is_creation ON outfits(user_id, is_creation, created_at DESC);

-- Add comment for documentation
COMMENT ON COLUMN outfits.is_creation IS 'True if this outfit was AI-generated and tried on avatar';
COMMENT ON COLUMN outfits.generation_prompt IS 'Original user prompt used to generate this outfit (e.g., "casual date night outfit")';
