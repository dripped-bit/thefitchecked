-- Outfit History Table Migration
-- Tracks what outfits users wore on specific dates for AI learning

-- Create outfit_history table
create table if not exists outfit_history (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  worn_date date not null,
  outfit_items jsonb not null, -- Array of OutfitItem objects worn
  event_id uuid references calendar_events(id) on delete set null,
  event_type text, -- work, personal, travel, formal, casual, other
  weather_data jsonb, -- Weather conditions when outfit was worn
  time_of_day text check (time_of_day in ('morning', 'afternoon', 'evening')),
  day_of_week text check (day_of_week in ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
  user_rating integer check (user_rating >= 1 and user_rating <= 5), -- 1-5 stars
  mood text, -- confident, comfortable, stylish, etc.
  notes text,
  photo_url text, -- Optional photo of the outfit
  location text, -- Where the outfit was worn
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Add indexes for AI learning queries
create index if not exists outfit_history_user_id_idx on outfit_history(user_id);
create index if not exists outfit_history_worn_date_idx on outfit_history(worn_date desc);
create index if not exists outfit_history_event_type_idx on outfit_history(event_type);
create index if not exists outfit_history_day_of_week_idx on outfit_history(day_of_week);
create index if not exists outfit_history_time_of_day_idx on outfit_history(time_of_day);
create index if not exists outfit_history_user_rating_idx on outfit_history(user_rating desc);

-- GIN index for weather data queries
create index if not exists outfit_history_weather_data_idx on outfit_history using gin (weather_data);

-- Enable Row Level Security
alter table outfit_history enable row level security;

-- RLS Policies
create policy "Users can view their own outfit history"
  on outfit_history for select
  using (auth.uid() = user_id);

create policy "Users can insert their own outfit history"
  on outfit_history for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own outfit history"
  on outfit_history for update
  using (auth.uid() = user_id);

create policy "Users can delete their own outfit history"
  on outfit_history for delete
  using (auth.uid() = user_id);

-- outfit_items JSONB format:
-- [
--   {
--     "id": "item_123",
--     "name": "Blue Denim Jeans",
--     "imageUrl": "https://...",
--     "category": "bottoms",
--     "formalityLevel": 5
--   },
--   ...
-- ]

-- weather_data JSONB format:
-- {
--   "temperature": 72,
--   "condition": "sunny",
--   "feels_like": 75,
--   "humidity": 60,
--   "precipitationChance": 10,
--   "windSpeed": 8,
--   "uvIndex": 6
-- }

-- Example AI learning queries:
-- What does user wear on Mondays?
-- SELECT outfit_items, COUNT(*) as frequency
-- FROM outfit_history
-- WHERE user_id = '...' AND day_of_week = 'Monday'
-- GROUP BY outfit_items;

-- What does user wear when temp is 60-70°F?
-- SELECT outfit_items, user_rating
-- FROM outfit_history
-- WHERE user_id = '...'
--   AND (weather_data->>'temperature')::int BETWEEN 60 AND 70
-- ORDER BY user_rating DESC;

-- Highest rated outfits:
-- SELECT outfit_items, user_rating, worn_date
-- FROM outfit_history
-- WHERE user_id = '...'
-- ORDER BY user_rating DESC, worn_date DESC
-- LIMIT 10;
