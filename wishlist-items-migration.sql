-- Wishlist Items Migration
-- Run this in your Supabase SQL Editor to add wishlist functionality

-- Wishlist Items table (for saving desired clothing items)
create table if not exists wishlist_items (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users,
  name text not null,
  brand text not null,
  price text not null,
  currency text not null default 'USD',
  image text not null,
  url text not null,
  retailer text not null,
  notes text default '',
  original_price text,
  discount text,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Wishlist items indexes for better query performance
create index if not exists wishlist_items_user_id_idx on wishlist_items(user_id);
create index if not exists wishlist_items_created_at_idx on wishlist_items(created_at desc);
create index if not exists wishlist_items_brand_idx on wishlist_items(brand);
create index if not exists wishlist_items_retailer_idx on wishlist_items(retailer);

-- Wishlist items RLS (Row Level Security) policies
alter table wishlist_items enable row level security;

create policy "Users can view own wishlist items" on wishlist_items
  for select using (user_id = auth.uid() or true);  -- Allow anonymous

create policy "Users can insert own wishlist items" on wishlist_items
  for insert with check (user_id = auth.uid() or true);  -- Allow anonymous

create policy "Users can update own wishlist items" on wishlist_items
  for update using (user_id = auth.uid() or true);  -- Allow anonymous

create policy "Users can delete own wishlist items" on wishlist_items
  for delete using (user_id = auth.uid() or true);  -- Allow anonymous

-- Function to automatically update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to auto-update updated_at on row update
create trigger update_wishlist_items_updated_at 
  before update on wishlist_items
  for each row
  execute function update_updated_at_column();

-- Comments for documentation
comment on table wishlist_items is 'Stores user wishlist items for shopping';
comment on column wishlist_items.user_id is 'User ID from auth.users (nullable for anonymous)';
comment on column wishlist_items.price is 'Current price with currency symbol (e.g., "$65")';
comment on column wishlist_items.original_price is 'Original price before discount (optional)';
comment on column wishlist_items.discount is 'Discount text (e.g., "30% OFF")';
comment on column wishlist_items.notes is 'User notes about the item';
