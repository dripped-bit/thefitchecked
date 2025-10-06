-- Supabase Database Schema for Fit Checked App
-- Run this in your Supabase SQL Editor

-- Users table (for preferences and style profile)
create table if not exists users (
  id uuid references auth.users primary key,
  preferred_style text,
  favorite_colors text[],
  gender text,
  body_type text,
  size text,
  budget_range text,
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
  favorited boolean default false,
  share_token text unique,
  rating integer check (rating >= 1 and rating <= 5),
  weather_temp integer,
  weather_condition text,
  location text,
  prompt_version text,
  prompt_text text,
  primary_colors text[],
  color_palette jsonb,
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

-- Collections table (for outfit organization)
create table if not exists collections (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users,
  name text not null,
  description text,
  created_at timestamp default now()
);

-- Collection outfits (many-to-many relationship)
create table if not exists collection_outfits (
  collection_id uuid references collections on delete cascade,
  outfit_id uuid references outfits on delete cascade,
  added_at timestamp default now(),
  primary key (collection_id, outfit_id)
);

-- Notifications table (for email reminders and weekly recaps)
create table if not exists notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users,
  type text,
  title text,
  message text,
  metadata jsonb,
  sent_at timestamp default now(),
  opened boolean default false,
  created_at timestamp default now()
);

-- Avatars table (for persistent avatar storage across devices)
create table if not exists avatars (
  id uuid primary key default uuid_generate_v4(),
  user_id text not null,  -- email or anonymous ID (not using auth.users for anonymous support)
  name text not null,
  storage_path text not null,  -- Supabase Storage path (e.g., 'avatars/user123/avatar1.png')
  original_photo_path text,  -- Path to original photo in Storage
  animated_video_path text,  -- Path to animated video in Storage
  is_default boolean default false,
  is_perfect boolean default false,  -- Flag for avatars generated with perfect avatar config
  metadata jsonb,  -- {quality, source, dimensions, fileSize, usedPerfectConfig}
  try_on_history text[],  -- Array of clothing URLs tried on this avatar
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Indexes for better query performance
create index if not exists outfits_user_id_idx on outfits(user_id);
create index if not exists outfits_created_at_idx on outfits(created_at desc);
create index if not exists outfits_style_idx on outfits(style);
create index if not exists outfits_clicked_idx on outfits(clicked);
create index if not exists outfits_favorited_idx on outfits(favorited);
create index if not exists outfits_share_token_idx on outfits(share_token);
create index if not exists outfits_rating_idx on outfits(rating);
create index if not exists outfits_purchased_idx on outfits(purchased);
create index if not exists interactions_user_id_idx on interactions(user_id);
create index if not exists interactions_action_idx on interactions(action);
create index if not exists collections_user_id_idx on collections(user_id);
create index if not exists collection_outfits_collection_id_idx on collection_outfits(collection_id);
create index if not exists collection_outfits_outfit_id_idx on collection_outfits(outfit_id);
create index if not exists outfits_prompt_version_idx on outfits(prompt_version);
create index if not exists outfits_location_idx on outfits(location);
create index if not exists notifications_user_id_idx on notifications(user_id);
create index if not exists notifications_type_idx on notifications(type);
create index if not exists notifications_opened_idx on notifications(opened);
create index if not exists outfits_primary_colors_idx on outfits using gin(primary_colors);
create index if not exists avatars_user_id_idx on avatars(user_id);
create index if not exists avatars_created_at_idx on avatars(created_at desc);
create index if not exists avatars_is_default_idx on avatars(is_default);
create index if not exists avatars_is_perfect_idx on avatars(is_perfect);

-- If you need to add columns to existing table (run only if outfits table already exists)
-- alter table outfits add column if not exists user_prompt text;
-- alter table outfits add column if not exists gender text;
-- alter table outfits add column if not exists seedream_seed integer;
-- alter table outfits add column if not exists favorited boolean default false;
-- alter table outfits add column if not exists share_token text unique;
-- alter table outfits add column if not exists rating integer check (rating >= 1 and rating <= 5);
-- alter table outfits add column if not exists weather_temp integer;
-- alter table outfits add column if not exists weather_condition text;
-- alter table outfits add column if not exists location text;
-- alter table outfits add column if not exists prompt_version text;
-- alter table outfits add column if not exists prompt_text text;
-- alter table outfits add column if not exists primary_colors text[];
-- alter table outfits add column if not exists color_palette jsonb;

-- Add columns to users table
-- alter table users add column if not exists body_type text;
-- alter table users add column if not exists size text;
-- alter table users add column if not exists budget_range text;

-- Enable Row Level Security (RLS) for security
alter table users enable row level security;
alter table outfits enable row level security;
alter table interactions enable row level security;
alter table collections enable row level security;
alter table collection_outfits enable row level security;
alter table avatars enable row level security;

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

create policy "Allow anonymous outfit updates" on outfits
  for update using (true);

-- Public sharing policy: Allow anyone to view outfits with a share_token
create policy "Allow public viewing of shared outfits" on outfits
  for select using (share_token is not null);

-- Collections policies
create policy "Users can view own collections" on collections
  for select using (user_id = auth.uid());

create policy "Users can insert own collections" on collections
  for insert with check (user_id = auth.uid());

create policy "Users can update own collections" on collections
  for update using (user_id = auth.uid());

create policy "Users can delete own collections" on collections
  for delete using (user_id = auth.uid());

-- Collection outfits policies
create policy "Users can view collection outfits" on collection_outfits
  for select using (
    exists (
      select 1 from collections
      where collections.id = collection_outfits.collection_id
      and collections.user_id = auth.uid()
    )
  );

create policy "Users can manage collection outfits" on collection_outfits
  for all using (
    exists (
      select 1 from collections
      where collections.id = collection_outfits.collection_id
      and collections.user_id = auth.uid()
    )
  );

-- Anonymous collection policies
create policy "Allow anonymous collection creation" on collections
  for insert with check (true);

create policy "Allow anonymous collection viewing" on collections
  for select using (true);

create policy "Allow anonymous collection outfit management" on collection_outfits
  for all using (true);

-- Notifications policies
create policy "Users can view own notifications" on notifications
  for select using (user_id = auth.uid());

create policy "Users can insert own notifications" on notifications
  for insert with check (user_id = auth.uid());

create policy "Users can update own notifications" on notifications
  for update using (user_id = auth.uid());

create policy "Allow anonymous notification viewing" on notifications
  for select using (true);

create policy "Allow anonymous notification insertion" on notifications
  for insert with check (true);

-- Avatars policies
create policy "Users can view own avatars" on avatars
  for select using (user_id = current_setting('app.user_id', true) or true);  -- Support anonymous

create policy "Users can insert own avatars" on avatars
  for insert with check (true);  -- Allow anonymous avatar creation

create policy "Users can update own avatars" on avatars
  for update using (true);  -- Allow anonymous avatar updates

create policy "Users can delete own avatars" on avatars
  for delete using (true);  -- Allow anonymous avatar deletion
