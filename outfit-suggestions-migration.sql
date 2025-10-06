-- Outfit Suggestions Table Migration
-- Stores AI-generated outfit suggestions for calendar events

-- Create outfit_suggestions table
create table if not exists outfit_suggestions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  event_id uuid references calendar_events(id) on delete set null,
  outfit_date date not null,
  outfit_items jsonb not null, -- Array of OutfitItem objects
  confidence_score integer check (confidence_score >= 0 and confidence_score <= 100),
  reasoning text,
  style_notes jsonb default '[]'::jsonb, -- Array of style tip strings
  weather_data jsonb, -- Weather conditions at time of suggestion
  time_of_day text check (time_of_day in ('morning', 'afternoon', 'evening')),
  is_selected boolean default false, -- User selected this suggestion
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Add indexes for performance
create index if not exists outfit_suggestions_user_id_idx on outfit_suggestions(user_id);
create index if not exists outfit_suggestions_event_id_idx on outfit_suggestions(event_id);
create index if not exists outfit_suggestions_outfit_date_idx on outfit_suggestions(outfit_date);
create index if not exists outfit_suggestions_created_at_idx on outfit_suggestions(created_at desc);

-- Enable Row Level Security
alter table outfit_suggestions enable row level security;

-- RLS Policies
create policy "Users can view their own outfit suggestions"
  on outfit_suggestions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own outfit suggestions"
  on outfit_suggestions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own outfit suggestions"
  on outfit_suggestions for update
  using (auth.uid() = user_id);

create policy "Users can delete their own outfit suggestions"
  on outfit_suggestions for delete
  using (auth.uid() = user_id);

-- outfit_items JSONB format:
-- [
--   {
--     "id": "item_123",
--     "name": "Blue Denim Jeans",
--     "imageUrl": "https://...",
--     "category": "bottoms",
--     "formalityLevel": 5,
--     "weatherSuitability": ["warm", "cool"]
--   },
--   ...
-- ]

-- style_notes JSONB format:
-- ["Tip 1", "Tip 2", "Tip 3"]

-- weather_data JSONB format:
-- {
--   "temperature": 72,
--   "condition": "sunny",
--   "humidity": 60,
--   "precipitationChance": 10
-- }
