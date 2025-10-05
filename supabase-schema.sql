-- Supabase Database Schema for Fit Checked App
-- Run this in your Supabase SQL Editor

-- Users table (for preferences)
create table if not exists users (
  id uuid references auth.users primary key,
  preferred_style text,
  favorite_colors text[],
  gender text,
  created_at timestamp default now()
);

-- Outfits table (for history and analytics)
create table if not exists outfits (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users,
  occasion text,
  style text,
  image_url text,
  user_prompt text,
  gender text,
  seedream_seed integer,
  clicked boolean default false,
  purchased boolean default false,
  created_at timestamp default now()
);

-- Interactions table (for analytics)
create table if not exists interactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users,
  action text,
  style_variant text,
  metadata jsonb,
  created_at timestamp default now()
);

-- Indexes for better query performance
create index if not exists outfits_user_id_idx on outfits(user_id);
create index if not exists outfits_created_at_idx on outfits(created_at desc);
create index if not exists outfits_style_idx on outfits(style);
create index if not exists outfits_clicked_idx on outfits(clicked);
create index if not exists interactions_user_id_idx on interactions(user_id);
create index if not exists interactions_action_idx on interactions(action);

-- If you need to add columns to existing table (run only if outfits table already exists)
-- alter table outfits add column if not exists user_prompt text;
-- alter table outfits add column if not exists gender text;
-- alter table outfits add column if not exists seedream_seed integer;

-- Enable Row Level Security (RLS) for security
alter table users enable row level security;
alter table outfits enable row level security;
alter table interactions enable row level security;

-- RLS Policies (adjust based on your auth requirements)
-- Allow users to read their own data
create policy "Users can view own data" on users
  for select using (auth.uid() = id);

create policy "Users can update own data" on users
  for update using (auth.uid() = id);

create policy "Users can insert own data" on users
  for insert with check (auth.uid() = id);

-- Allow users to manage their own outfits
create policy "Users can view own outfits" on outfits
  for select using (user_id = auth.uid());

create policy "Users can insert own outfits" on outfits
  for insert with check (user_id = auth.uid());

create policy "Users can update own outfits" on outfits
  for update using (user_id = auth.uid());

create policy "Users can delete own outfits" on outfits
  for delete using (user_id = auth.uid());

-- Allow users to manage their own interactions
create policy "Users can view own interactions" on interactions
  for select using (user_id = auth.uid());

create policy "Users can insert own interactions" on interactions
  for insert with check (user_id = auth.uid());

-- For anonymous/unauthenticated users (optional - adjust as needed)
-- This allows the app to work without auth but still save data
-- You may want to remove these in production and require auth

create policy "Allow anonymous outfit insertion" on outfits
  for insert with check (true);

create policy "Allow anonymous interaction insertion" on interactions
  for insert with check (true);

create policy "Allow anonymous outfit viewing" on outfits
  for select using (true);
