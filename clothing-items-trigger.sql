-- Ensure clothing_items table has proper user_id handling
-- Run this in Supabase SQL Editor if upload is still failing

-- Create trigger function to automatically set user_id from auth
CREATE OR REPLACE FUNCTION set_clothing_item_user_id()
RETURNS TRIGGER AS $$
BEGIN
  -- If user_id is not provided, set it from the authenticated user
  IF NEW.user_id IS NULL THEN
    NEW.user_id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on clothing_items table
DROP TRIGGER IF EXISTS set_user_id_on_insert ON clothing_items;
CREATE TRIGGER set_user_id_on_insert
  BEFORE INSERT ON clothing_items
  FOR EACH ROW
  EXECUTE FUNCTION set_clothing_item_user_id();

-- Update RLS policies to allow authenticated users to manage their items
-- (Make sure these policies exist and are correct)

-- View own items
DROP POLICY IF EXISTS "Users can view own clothing items" ON clothing_items;
CREATE POLICY "Users can view own clothing items" 
  ON clothing_items FOR SELECT 
  USING (auth.uid() = user_id);

-- Insert own items
DROP POLICY IF EXISTS "Users can insert own clothing items" ON clothing_items;
CREATE POLICY "Users can insert own clothing items" 
  ON clothing_items FOR INSERT 
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Update own items
DROP POLICY IF EXISTS "Users can update own clothing items" ON clothing_items;
CREATE POLICY "Users can update own clothing items" 
  ON clothing_items FOR UPDATE 
  USING (auth.uid() = user_id);

-- Delete own items
DROP POLICY IF EXISTS "Users can delete own clothing items" ON clothing_items;
CREATE POLICY "Users can delete own clothing items" 
  ON clothing_items FOR DELETE 
  USING (auth.uid() = user_id);
