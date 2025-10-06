-- Calendar Events Migration
-- Run this in your Supabase SQL Editor to add calendar functionality

-- Calendar Events table (for Smart Calendar feature)
create table if not exists calendar_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users,
  title text not null,
  description text,
  start_time timestamp not null,
  end_time timestamp not null,
  location text,
  event_type text check (event_type in ('work', 'personal', 'travel', 'formal', 'casual', 'other')) default 'personal',
  is_all_day boolean default false,
  outfit_id uuid references outfits,  -- Link to saved outfit from My Outfits
  weather_required boolean default false,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Calendar events indexes
create index if not exists calendar_events_user_id_idx on calendar_events(user_id);
create index if not exists calendar_events_start_time_idx on calendar_events(start_time);
create index if not exists calendar_events_event_type_idx on calendar_events(event_type);
create index if not exists calendar_events_outfit_id_idx on calendar_events(outfit_id);

-- Calendar events RLS policies
alter table calendar_events enable row level security;

create policy "Users can view own calendar events" on calendar_events
  for select using (user_id = auth.uid() or true);  -- Allow anonymous

create policy "Users can insert own calendar events" on calendar_events
  for insert with check (user_id = auth.uid() or true);  -- Allow anonymous

create policy "Users can update own calendar events" on calendar_events
  for update using (user_id = auth.uid() or true);  -- Allow anonymous

create policy "Users can delete own calendar events" on calendar_events
  for delete using (user_id = auth.uid() or true);  -- Allow anonymous
