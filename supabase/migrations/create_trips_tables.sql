-- Trip Planning System - Database Migration
-- Run this in your Supabase SQL Editor

-- ============================================
-- TRIPS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  destination TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  trip_type TEXT NOT NULL CHECK (trip_type IN ('vacation', 'business', 'weekend', 'adventure', 'event', 'multi-destination')),
  icon TEXT,
  color TEXT,
  accommodation_type TEXT CHECK (accommodation_type IN ('hotel', 'airbnb', 'resort', 'hostel', 'camping', 'friend')),
  number_of_travelers INTEGER DEFAULT 1,
  notes TEXT,
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'packed', 'traveling', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for trips
CREATE INDEX IF NOT EXISTS trips_user_id_idx ON trips(user_id);
CREATE INDEX IF NOT EXISTS trips_start_date_idx ON trips(start_date);
CREATE INDEX IF NOT EXISTS trips_status_idx ON trips(status);
CREATE INDEX IF NOT EXISTS trips_trip_type_idx ON trips(trip_type);

-- ============================================
-- TRIP ACTIVITIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS trip_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  time_slot TEXT NOT NULL CHECK (time_slot IN ('morning', 'afternoon', 'evening')),
  activity_type TEXT CHECK (activity_type IN ('beach', 'sightseeing', 'dining', 'business', 'workout', 'nightlife', 'casual', 'formal', 'outdoor', 'shopping')),
  title TEXT NOT NULL,
  location TEXT,
  formality_level INTEGER CHECK (formality_level >= 1 AND formality_level <= 5),
  weather_consideration BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for trip_activities
CREATE INDEX IF NOT EXISTS trip_activities_trip_id_idx ON trip_activities(trip_id);
CREATE INDEX IF NOT EXISTS trip_activities_date_idx ON trip_activities(date);
CREATE INDEX IF NOT EXISTS trip_activities_time_slot_idx ON trip_activities(time_slot);

-- ============================================
-- TRIP OUTFITS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS trip_outfits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id UUID REFERENCES trip_activities(id) ON DELETE CASCADE NOT NULL,
  clothing_item_ids UUID[],
  outfit_image_url TEXT,
  is_ai_generated BOOLEAN DEFAULT FALSE,
  is_confirmed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for trip_outfits
CREATE INDEX IF NOT EXISTS trip_outfits_activity_id_idx ON trip_outfits(activity_id);

-- ============================================
-- TRIP PACKING LIST TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS trip_packing_list (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  item_name TEXT NOT NULL,
  category TEXT CHECK (category IN ('essentials', 'clothing', 'accessories', 'toiletries', 'documents', 'electronics', 'other')),
  quantity INTEGER DEFAULT 1,
  is_packed BOOLEAN DEFAULT FALSE,
  is_essential BOOLEAN DEFAULT FALSE,
  clothing_item_id UUID REFERENCES clothing_items(id) ON DELETE SET NULL,
  packed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for trip_packing_list
CREATE INDEX IF NOT EXISTS trip_packing_list_trip_id_idx ON trip_packing_list(trip_id);
CREATE INDEX IF NOT EXISTS trip_packing_list_is_packed_idx ON trip_packing_list(is_packed);
CREATE INDEX IF NOT EXISTS trip_packing_list_category_idx ON trip_packing_list(category);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_outfits ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_packing_list ENABLE ROW LEVEL SECURITY;

-- Trips policies
CREATE POLICY "Users can view their own trips"
  ON trips FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own trips"
  ON trips FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trips"
  ON trips FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trips"
  ON trips FOR DELETE
  USING (auth.uid() = user_id);

-- Trip activities policies
CREATE POLICY "Users can view activities for their trips"
  ON trip_activities FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM trips
    WHERE trips.id = trip_activities.trip_id
    AND trips.user_id = auth.uid()
  ));

CREATE POLICY "Users can create activities for their trips"
  ON trip_activities FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM trips
    WHERE trips.id = trip_activities.trip_id
    AND trips.user_id = auth.uid()
  ));

CREATE POLICY "Users can update activities for their trips"
  ON trip_activities FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM trips
    WHERE trips.id = trip_activities.trip_id
    AND trips.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete activities for their trips"
  ON trip_activities FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM trips
    WHERE trips.id = trip_activities.trip_id
    AND trips.user_id = auth.uid()
  ));

-- Trip outfits policies
CREATE POLICY "Users can view outfits for their activities"
  ON trip_outfits FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM trip_activities
    JOIN trips ON trips.id = trip_activities.trip_id
    WHERE trip_activities.id = trip_outfits.activity_id
    AND trips.user_id = auth.uid()
  ));

CREATE POLICY "Users can create outfits for their activities"
  ON trip_outfits FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM trip_activities
    JOIN trips ON trips.id = trip_activities.trip_id
    WHERE trip_activities.id = trip_outfits.activity_id
    AND trips.user_id = auth.uid()
  ));

CREATE POLICY "Users can update outfits for their activities"
  ON trip_outfits FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM trip_activities
    JOIN trips ON trips.id = trip_activities.trip_id
    WHERE trip_activities.id = trip_outfits.activity_id
    AND trips.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete outfits for their activities"
  ON trip_outfits FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM trip_activities
    JOIN trips ON trips.id = trip_activities.trip_id
    WHERE trip_activities.id = trip_outfits.activity_id
    AND trips.user_id = auth.uid()
  ));

-- Trip packing list policies
CREATE POLICY "Users can view packing list for their trips"
  ON trip_packing_list FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM trips
    WHERE trips.id = trip_packing_list.trip_id
    AND trips.user_id = auth.uid()
  ));

CREATE POLICY "Users can create packing items for their trips"
  ON trip_packing_list FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM trips
    WHERE trips.id = trip_packing_list.trip_id
    AND trips.user_id = auth.uid()
  ));

CREATE POLICY "Users can update packing items for their trips"
  ON trip_packing_list FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM trips
    WHERE trips.id = trip_packing_list.trip_id
    AND trips.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete packing items for their trips"
  ON trip_packing_list FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM trips
    WHERE trips.id = trip_packing_list.trip_id
    AND trips.user_id = auth.uid()
  ));

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for trips table
DROP TRIGGER IF EXISTS update_trips_updated_at ON trips;
CREATE TRIGGER update_trips_updated_at
  BEFORE UPDATE ON trips
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE trips IS 'Main trips table for travel planning';
COMMENT ON TABLE trip_activities IS 'Activities planned for each day of the trip';
COMMENT ON TABLE trip_outfits IS 'Outfits planned for each activity';
COMMENT ON TABLE trip_packing_list IS 'Packing checklist items for the trip';

-- Done!
-- Now you can start using the trip planning system!
