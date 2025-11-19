# Migration Instructions: Add Activewear Category

## Issue
When trying to save items to the "activewear" category, you get this error:
```
Failed to load closet: invalid input value for enum clothing_category: "activewear"
```

This is because the Supabase database `clothing_category` enum type doesn't include 'activewear' yet.

## Solution

### Step 1: Run the Migration SQL in Supabase

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project: **TheFitChecked**

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Paste and Run the Migration**
   - Copy the contents of `add-activewear-category-migration.sql`
   - Paste into the SQL editor
   - Click "Run" or press `Cmd+Enter`

### Step 2: Verify the Migration

After running the migration, you should see output like:
```
NOTICE: Added activewear to clothing_category enum

available_categories
--------------------
accessories
activewear
bottoms
dresses
outerwear
shoes
tops
```

### Step 3: Test in the App

1. **Rebuild and sync the app**
   ```bash
   cd /Users/genevie/Developer/fit-checked-app
   npm run build
   npx cap sync ios
   ```

2. **Test adding an activewear item**
   - Open the app
   - Go to Closet tab
   - Click "+ Add Item"
   - Select "Active Wear" category
   - Save the item
   - It should now save successfully without errors

3. **Test moving existing items**
   - Select an item from another category
   - Edit it
   - Change category to "Active Wear"
   - Save
   - Should work without errors

## What This Migration Does

1. **Adds 'activewear' to the enum** - Adds the new category type to the database
2. **Migrates old 'sweaters' items** - Updates any legacy 'sweaters' items to 'outerwear' (backward compatibility)
3. **Shows available categories** - Outputs all available categories for verification

## Files Changed in This Update

### Frontend Changes (Already Applied)
- ✅ Added back button to Add Item modal (top left corner)
- ✅ Subcategory filtering system complete
- ✅ All Items page shows activewear category

### Backend Changes (You Need to Apply)
- ⚠️ **REQUIRED**: Run `add-activewear-category-migration.sql` in Supabase

## Troubleshooting

### If you still get the enum error:
1. Make sure you ran the SQL migration in the correct Supabase project
2. Clear your app cache and rebuild
3. Check Supabase logs for any migration errors

### If the migration fails:
The most common issue is trying to add a value that already exists. The migration handles this gracefully with a notice message.

## Summary of UI Changes

### ✅ Fixed: Back Button Added
- **Location**: Add Item modal (top left)
- **Action**: Returns to closet without saving
- **Style**: "← Back" text button, gray color

### ✅ Confirmed: Activewear in All Items
- Category appears in All Items view
- Shows as "Active Wear 🏃"
- Can be expanded to show subcategories
- Will work after database migration

### ✅ Fixed: Category Enum
- After running migration, 'activewear' will be a valid database value
- Existing items can be moved to Active Wear
- New items can be saved to Active Wear
- No more enum errors
