-- Migration: Add 'activewear' to clothing_category enum
-- This replaces the old 'sweaters' category with 'activewear'

-- Step 1: Add 'activewear' to the enum if it doesn't exist
DO $$ 
BEGIN
    -- Check if 'activewear' already exists in the enum
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'activewear' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'clothing_category')
    ) THEN
        -- Add 'activewear' to the enum
        ALTER TYPE clothing_category ADD VALUE 'activewear';
        RAISE NOTICE 'Added activewear to clothing_category enum';
    ELSE
        RAISE NOTICE 'activewear already exists in clothing_category enum';
    END IF;
END $$;

-- Step 2: Update any existing 'sweaters' items to 'outerwear' (backward compatibility)
-- This is already handled in the frontend with legacy mapping, but we can also do it in DB
UPDATE clothing_items 
SET category = 'outerwear'
WHERE category = 'sweaters';

-- Step 3: Verify the change
SELECT enumlabel as available_categories 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'clothing_category')
ORDER BY enumlabel;
