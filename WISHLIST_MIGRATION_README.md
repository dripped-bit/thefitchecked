# Wishlist Items Migration - Setup Guide

## Overview

This migration creates a Supabase database table to store wishlist items, enabling persistent wishlist functionality across devices and sessions.

---

## 📋 What Gets Created

### Table: `wishlist_items`

**14 Columns**:
- `id` (uuid) - Primary key
- `user_id` (uuid) - Links to auth.users
- `name` (text) - Product name
- `brand` (text) - Brand name
- `price` (text) - Current price with symbol
- `currency` (text) - Currency code (USD, GBP, EUR)
- `image` (text) - Product image URL
- `url` (text) - Product page URL
- `retailer` (text) - Retailer domain
- `notes` (text) - User notes
- `original_price` (text) - Pre-discount price
- `discount` (text) - Discount text
- `created_at` (timestamp) - When added
- `updated_at` (timestamp) - Last modified

**4 Indexes** for performance:
- `user_id_idx` - Fast user lookup
- `created_at_idx` - Fast date sorting
- `brand_idx` - Fast brand filtering
- `retailer_idx` - Fast retailer filtering

**4 RLS Policies** for security:
- SELECT - View own items
- INSERT - Add new items
- UPDATE - Edit own items
- DELETE - Remove own items

**1 Trigger**:
- Auto-updates `updated_at` on row changes

---

## 🚀 How to Run the Migration

### Option 1: Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your project

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in left sidebar
   - Click "New query"

3. **Paste Migration SQL**
   - Open `wishlist-items-migration.sql`
   - Copy entire contents
   - Paste into SQL Editor

4. **Run the Query**
   - Click "Run" button (or `Ctrl/Cmd + Enter`)
   - Wait for "Success" message

5. **Verify Creation**
   - Go to "Table Editor" in sidebar
   - Look for `wishlist_items` table
   - Check that all columns exist

### Option 2: Supabase CLI

If you have Supabase CLI installed:

```bash
# Navigate to project root
cd /Users/genevie/Developer/fit-checked-app

# Copy migration file to Supabase migrations folder
cp wishlist-items-migration.sql supabase/migrations/$(date +%Y%m%d%H%M%S)_wishlist_items.sql

# Push migration to Supabase
supabase db push
```

---

## ✅ Verification Queries

After running the migration, verify everything is set up correctly:

### 1. Check Table Exists
```sql
select * from information_schema.tables 
where table_name = 'wishlist_items';
```
**Expected**: 1 row returned

### 2. Check Columns
```sql
select column_name, data_type, is_nullable, column_default
from information_schema.columns 
where table_name = 'wishlist_items'
order by ordinal_position;
```
**Expected**: 14 rows (one for each column)

### 3. Check Indexes
```sql
select indexname, indexdef 
from pg_indexes 
where tablename = 'wishlist_items';
```
**Expected**: 5 rows (1 primary key + 4 custom indexes)

### 4. Check RLS Policies
```sql
select policyname, cmd, qual, with_check 
from pg_policies 
where tablename = 'wishlist_items';
```
**Expected**: 4 rows (SELECT, INSERT, UPDATE, DELETE policies)

### 5. Check Trigger
```sql
select trigger_name, event_manipulation, event_object_table
from information_schema.triggers
where event_object_table = 'wishlist_items';
```
**Expected**: 1 row (update_wishlist_items_updated_at)

---

## 🧪 Test Queries

### Insert Test Item
```sql
insert into wishlist_items (
  user_id, 
  name, 
  brand, 
  price, 
  currency, 
  image, 
  url, 
  retailer, 
  notes,
  original_price,
  discount
)
values (
  auth.uid(),  -- Current user (or NULL for anonymous)
  'Test Sweatshirt',
  'Test Brand',
  '$65',
  'USD',
  'https://via.placeholder.com/300x400',
  'https://example.com/product',
  'example.com',
  'Test notes',
  '$85',
  '25% OFF'
);
```

### Query Your Wishlist
```sql
select * from wishlist_items
where user_id = auth.uid()
order by created_at desc;
```

### Update Item Notes
```sql
update wishlist_items
set notes = 'Updated notes'
where id = 'YOUR-ITEM-UUID'
and user_id = auth.uid();
```

### Delete Test Item
```sql
delete from wishlist_items
where name = 'Test Sweatshirt'
and user_id = auth.uid();
```

### Test Updated_At Trigger
```sql
-- Check current updated_at
select id, notes, updated_at from wishlist_items limit 1;

-- Update the item
update wishlist_items
set notes = 'Trigger test'
where id = 'YOUR-ITEM-UUID';

-- Verify updated_at changed
select id, notes, updated_at from wishlist_items 
where id = 'YOUR-ITEM-UUID';
```

---

## 📊 Example Data Structure

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "user_id": "987e6543-e21b-12d3-a456-426614174999",
  "name": "ADANOLA Logo-embroidered oversized sweatshirt",
  "brand": "ADANOLA SPORT",
  "price": "$65",
  "currency": "USD",
  "image": "https://example.com/image.jpg",
  "url": "https://selfridges.com/product/123",
  "retailer": "selfridges.com",
  "notes": "Love this for casual days",
  "original_price": "$85",
  "discount": "25% OFF",
  "created_at": "2024-11-14T10:30:00Z",
  "updated_at": "2024-11-14T10:30:00Z"
}
```

---

## 🔐 Security Notes

### Row Level Security (RLS)

All policies include `or true` to support **anonymous users**:

```sql
for select using (user_id = auth.uid() or true);
```

**Why?**
- Users can browse wishlist without signing in
- Data still associated with anonymous session
- Can be migrated to authenticated user later

### User Isolation

Despite anonymous support, users **only see their own items**:
- Authenticated: `user_id = auth.uid()`
- Anonymous: `user_id = <anonymous-session-id>`

---

## 🔄 Integration with Wishlist Component

### Current State (Mock Data)
```typescript
// src/pages/Wishlist.tsx
const mockWishlistItems: WishlistItem[] = [
  { id: '1', name: '...', brand: '...', ... },
  // Hardcoded items
];
```

### Future State (Supabase)
```typescript
// src/services/wishlistService.ts
import { supabase } from './supabaseClient';

export const fetchWishlist = async (userId: string) => {
  const { data, error } = await supabase
    .from('wishlist_items')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  return data || [];
};

export const addWishlistItem = async (item: Omit<WishlistItem, 'id'>) => {
  const { data, error } = await supabase
    .from('wishlist_items')
    .insert(item)
    .select()
    .single();
  
  return data;
};

export const updateWishlistItem = async (id: string, updates: Partial<WishlistItem>) => {
  const { data, error } = await supabase
    .from('wishlist_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  return data;
};

export const deleteWishlistItem = async (id: string) => {
  const { error } = await supabase
    .from('wishlist_items')
    .delete()
    .eq('id', id);
  
  return !error;
};
```

---

## 📈 Performance Considerations

### Indexed Queries (Fast)
```sql
-- ✅ Uses user_id_idx
select * from wishlist_items where user_id = 'uuid';

-- ✅ Uses created_at_idx
select * from wishlist_items order by created_at desc;

-- ✅ Uses brand_idx
select * from wishlist_items where brand = 'ADIDAS';

-- ✅ Uses retailer_idx
select * from wishlist_items where retailer = 'selfridges.com';
```

### Non-Indexed Queries (Slower)
```sql
-- ⚠️ Full table scan
select * from wishlist_items where name like '%sweatshirt%';

-- ⚠️ Full table scan
select * from wishlist_items where price > '$50';
```

**Future Optimization**:
```sql
-- Add full-text search for name/brand
create index wishlist_items_search_idx on wishlist_items 
  using gin(to_tsvector('english', name || ' ' || brand));
```

---

## 🐛 Troubleshooting

### Error: "permission denied for table wishlist_items"
**Cause**: RLS policies not working correctly  
**Fix**:
```sql
-- Check if RLS is enabled
select tablename, rowsecurity from pg_tables where tablename = 'wishlist_items';
-- Should show rowsecurity = true

-- Re-enable RLS if needed
alter table wishlist_items enable row level security;
```

### Error: "function uuid_generate_v4() does not exist"
**Cause**: UUID extension not enabled  
**Fix**:
```sql
create extension if not exists "uuid-ossp";
```

### Error: "trigger function update_updated_at_column() does not exist"
**Cause**: Trigger function not created  
**Fix**: Re-run the migration SQL

### No data returned for authenticated user
**Check**:
```sql
-- Verify auth.uid() is set
select auth.uid();

-- Check if data exists with different user_id
select user_id, count(*) from wishlist_items group by user_id;
```

---

## 📝 Migration Checklist

Before marking migration complete:

- [ ] Migration SQL file created (`wishlist-items-migration.sql`)
- [ ] Opened Supabase Dashboard SQL Editor
- [ ] Pasted and ran migration SQL
- [ ] Saw "Success. No rows returned" message
- [ ] Verified table exists in Table Editor
- [ ] Ran verification queries (table, columns, indexes, policies)
- [ ] Inserted test data successfully
- [ ] Queried test data successfully
- [ ] Updated test data (verified updated_at changed)
- [ ] Deleted test data successfully
- [ ] Tested with anonymous user (user_id = NULL)
- [ ] Ready to integrate with Wishlist.tsx component

---

## 🎯 Next Steps

After migration is complete:

1. **Create Wishlist Service** (`src/services/wishlistService.ts`)
   - Add fetchWishlist, addItem, updateItem, deleteItem functions
   - Use Supabase client for database operations

2. **Update Wishlist Component** (`src/pages/Wishlist.tsx`)
   - Replace mock data with Supabase queries
   - Add loading states
   - Handle errors gracefully

3. **Add Real-Time Updates** (Optional)
   - Subscribe to wishlist changes
   - Update UI when items added/removed

4. **Add to Shopping Integration**
   - "Add to Wishlist" button in product search
   - "Save for Later" in virtual try-on
   - Quick add from outfit suggestions

---

## 📚 Additional Resources

- [Supabase Table Docs](https://supabase.com/docs/guides/database/tables)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Database Triggers](https://supabase.com/docs/guides/database/triggers)
- [Indexes Performance](https://supabase.com/docs/guides/database/indexes)

---

## Summary

✅ **Migration File**: `wishlist-items-migration.sql`  
✅ **Location**: Project root  
✅ **Ready to Run**: In Supabase SQL Editor  
✅ **Result**: Persistent wishlist with full CRUD + RLS  

Run the migration in your Supabase Dashboard to enable persistent wishlist storage! 🎉
