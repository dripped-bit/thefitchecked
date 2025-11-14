# Wishlist Queries - Quick Reference

Quick copy-paste queries for managing wishlist items in Supabase.

---

## 📋 Basic CRUD Operations

### Create (Insert New Item)
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
  notes
) values (
  auth.uid(),
  'Product Name Here',
  'Brand Name',
  '$99',
  'USD',
  'https://example.com/image.jpg',
  'https://example.com/product-page',
  'example.com',
  'Optional notes'
);
```

### Read (Get All Items)
```sql
select * from wishlist_items
where user_id = auth.uid()
order by created_at desc;
```

### Update (Edit Notes)
```sql
update wishlist_items
set notes = 'New notes here'
where id = 'ITEM-UUID-HERE'
and user_id = auth.uid();
```

### Delete (Remove Item)
```sql
delete from wishlist_items
where id = 'ITEM-UUID-HERE'
and user_id = auth.uid();
```

---

## 🔍 Common Queries

### Get Item Count
```sql
select count(*) as total_items
from wishlist_items
where user_id = auth.uid();
```

### Find Items by Brand
```sql
select * from wishlist_items
where user_id = auth.uid()
and brand ilike '%BRAND-NAME%'
order by created_at desc;
```

### Find Items by Retailer
```sql
select * from wishlist_items
where user_id = auth.uid()
and retailer = 'selfridges.com'
order by created_at desc;
```

### Get Items with Discounts Only
```sql
select * from wishlist_items
where user_id = auth.uid()
and discount is not null
and discount != ''
order by created_at desc;
```

### Get Recent Items (Last 7 Days)
```sql
select * from wishlist_items
where user_id = auth.uid()
and created_at >= now() - interval '7 days'
order by created_at desc;
```

### Get Items with Notes
```sql
select * from wishlist_items
where user_id = auth.uid()
and notes is not null
and notes != ''
order by created_at desc;
```

---

## 💰 Price & Currency Queries

### Group by Currency
```sql
select 
  currency,
  count(*) as item_count,
  array_agg(brand) as brands
from wishlist_items
where user_id = auth.uid()
group by currency;
```

### Items by Price Range (USD)
```sql
select * from wishlist_items
where user_id = auth.uid()
and currency = 'USD'
and price::numeric between 50 and 100  -- Note: Assumes price is stored as "$99" format
order by price::numeric asc;
```

### Calculate Total Value
```sql
-- Note: This assumes prices are stored as "$99" format
-- You'll need to strip the currency symbol first
select 
  currency,
  sum(regexp_replace(price, '[^0-9.]', '', 'g')::numeric) as total_value
from wishlist_items
where user_id = auth.uid()
group by currency;
```

---

## 📊 Analytics Queries

### Most Wishlisted Brands
```sql
select 
  brand,
  count(*) as item_count
from wishlist_items
where user_id = auth.uid()
group by brand
order by item_count desc
limit 10;
```

### Most Used Retailers
```sql
select 
  retailer,
  count(*) as item_count
from wishlist_items
where user_id = auth.uid()
group by retailer
order by item_count desc
limit 10;
```

### Wishlist Growth Over Time
```sql
select 
  date_trunc('month', created_at) as month,
  count(*) as items_added
from wishlist_items
where user_id = auth.uid()
group by month
order by month desc;
```

### Items Added Per Day (Last 30 Days)
```sql
select 
  date(created_at) as day,
  count(*) as items_added
from wishlist_items
where user_id = auth.uid()
and created_at >= now() - interval '30 days'
group by day
order by day desc;
```

---

## 🔧 Maintenance Queries

### Delete All Test Data
```sql
delete from wishlist_items
where user_id = auth.uid()
and (
  name like 'Test%'
  or brand like 'Test%'
  or url like '%example.com%'
);
```

### Update All Placeholder Images
```sql
update wishlist_items
set image = 'https://new-cdn.com/images/' || id || '.jpg'
where user_id = auth.uid()
and image like '%placeholder%';
```

### Find Duplicate Items (Same Name & Brand)
```sql
select 
  name,
  brand,
  count(*) as duplicate_count,
  array_agg(id) as item_ids
from wishlist_items
where user_id = auth.uid()
group by name, brand
having count(*) > 1;
```

### Remove Duplicates (Keep Oldest)
```sql
delete from wishlist_items
where id in (
  select id from (
    select id,
      row_number() over (
        partition by name, brand, user_id 
        order by created_at asc
      ) as rn
    from wishlist_items
  ) t
  where t.rn > 1
);
```

---

## 🔐 Admin Queries

### Count All Wishlist Items (All Users)
```sql
select count(*) as total_items
from wishlist_items;
```

### Items by User
```sql
select 
  user_id,
  count(*) as item_count
from wishlist_items
group by user_id
order by item_count desc;
```

### Most Popular Products Across All Users
```sql
select 
  name,
  brand,
  count(*) as times_wishlisted
from wishlist_items
group by name, brand
order by times_wishlisted desc
limit 20;
```

### Active Users (Added Items Last 7 Days)
```sql
select 
  user_id,
  count(*) as items_added
from wishlist_items
where created_at >= now() - interval '7 days'
group by user_id
order by items_added desc;
```

---

## 🧪 Testing Queries

### Insert Multiple Test Items
```sql
insert into wishlist_items (user_id, name, brand, price, currency, image, url, retailer, notes)
values
  (auth.uid(), 'Test Shirt', 'Test Brand A', '$50', 'USD', 'https://via.placeholder.com/300', 'https://example.com/1', 'example.com', 'Test 1'),
  (auth.uid(), 'Test Jeans', 'Test Brand B', '$80', 'USD', 'https://via.placeholder.com/300', 'https://example.com/2', 'example.com', 'Test 2'),
  (auth.uid(), 'Test Shoes', 'Test Brand C', '$120', 'USD', 'https://via.placeholder.com/300', 'https://example.com/3', 'example.com', 'Test 3');
```

### Verify Trigger Works (Updated_At)
```sql
-- 1. Insert test item
insert into wishlist_items (user_id, name, brand, price, currency, image, url, retailer)
values (auth.uid(), 'Trigger Test', 'Test', '$10', 'USD', 'img', 'url', 'retailer')
returning id, created_at, updated_at;

-- 2. Wait a moment, then update
update wishlist_items
set notes = 'Testing trigger'
where name = 'Trigger Test'
and user_id = auth.uid()
returning id, created_at, updated_at;  -- updated_at should be newer than created_at

-- 3. Clean up
delete from wishlist_items where name = 'Trigger Test' and user_id = auth.uid();
```

---

## 🚨 Emergency Queries

### Rollback - Drop Table (DESTRUCTIVE!)
```sql
-- ⚠️ WARNING: This deletes all wishlist data!
drop table if exists wishlist_items cascade;
```

### Disable RLS Temporarily (NOT RECOMMENDED)
```sql
-- ⚠️ Only for debugging, makes data accessible to all users!
alter table wishlist_items disable row level security;

-- Re-enable after debugging:
alter table wishlist_items enable row level security;
```

### Remove All Policies (DESTRUCTIVE!)
```sql
drop policy if exists "Users can view own wishlist items" on wishlist_items;
drop policy if exists "Users can insert own wishlist items" on wishlist_items;
drop policy if exists "Users can update own wishlist items" on wishlist_items;
drop policy if exists "Users can delete own wishlist items" on wishlist_items;
```

---

## 📝 Notes

### Price Format
Prices are stored as **text** (e.g., "$65", "£1490") because:
- Different currencies use different symbols
- Makes display easier (no conversion needed)
- Preserves original formatting from retailer

**To sort by price numerically**:
```sql
order by regexp_replace(price, '[^0-9.]', '', 'g')::numeric
```

### User ID
- **Authenticated users**: `auth.uid()` returns user UUID
- **Anonymous users**: Pass a session ID or device ID as user_id
- RLS policies allow both (`user_id = auth.uid() or true`)

### Image URLs
- Should be **full URLs** (starting with http:// or https://)
- Can be from Supabase Storage or external CDN
- Consider using Supabase Storage for persistence:
  ```sql
  image = 'https://YOUR-PROJECT.supabase.co/storage/v1/object/public/wishlist-images/...'
  ```

---

## 🔗 Related Files

- **Migration**: `wishlist-items-migration.sql`
- **Full Guide**: `WISHLIST_MIGRATION_README.md`
- **Component**: `src/pages/Wishlist.tsx`
- **Future Service**: `src/services/wishlistService.ts`

---

**Quick Tip**: Save this file for reference when building the wishlist service!
