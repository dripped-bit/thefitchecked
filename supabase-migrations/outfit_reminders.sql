-- =====================================================
-- OUTFIT REMINDER SYSTEM - DATABASE SCHEMA
-- =====================================================
-- This migration creates tables for outfit reminders with push notifications
-- Run this in your Supabase SQL Editor

-- 1. Create occasions table
CREATE TABLE IF NOT EXISTS occasions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  type VARCHAR(100) NOT NULL, -- 'wedding', 'party', 'business', 'date', 'interview', etc.
  reminder_days INTEGER[] DEFAULT ARRAY[7, 3, 1], -- Days before event to send reminders
  outfit_purchased BOOLEAN DEFAULT false,
  outfit_notes TEXT, -- Optional notes about outfit requirements
  location VARCHAR(255), -- Event location
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create device_tokens table for APNs
CREATE TABLE IF NOT EXISTS device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_token VARCHAR(512) NOT NULL UNIQUE, -- APNs device token
  platform VARCHAR(50) DEFAULT 'ios', -- 'ios' or 'android'
  app_version VARCHAR(50),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- 3. Create notification_history table (optional, for tracking)
CREATE TABLE IF NOT EXISTS notification_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  occasion_id UUID REFERENCES occasions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type VARCHAR(50), -- 'reminder', 'day_before', 'week_before'
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered BOOLEAN DEFAULT false,
  opened BOOLEAN DEFAULT false,
  days_before_event INTEGER
);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_occasions_user_id ON occasions(user_id);
CREATE INDEX IF NOT EXISTS idx_occasions_date ON occasions(date);
CREATE INDEX IF NOT EXISTS idx_occasions_outfit_purchased ON occasions(outfit_purchased);
CREATE INDEX IF NOT EXISTS idx_device_tokens_user_id ON device_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_device_tokens_token ON device_tokens(device_token);
CREATE INDEX IF NOT EXISTS idx_notification_history_user_id ON notification_history(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_history_occasion_id ON notification_history(occasion_id);

-- 5. Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Add trigger to occasions table
DROP TRIGGER IF EXISTS update_occasions_updated_at ON occasions;
CREATE TRIGGER update_occasions_updated_at
  BEFORE UPDATE ON occasions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7. Row Level Security (RLS) Policies
-- Enable RLS
ALTER TABLE occasions ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;

-- Occasions policies
CREATE POLICY "Users can view their own occasions"
  ON occasions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own occasions"
  ON occasions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own occasions"
  ON occasions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own occasions"
  ON occasions FOR DELETE
  USING (auth.uid() = user_id);

-- Device tokens policies
CREATE POLICY "Users can view their own device tokens"
  ON device_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own device tokens"
  ON device_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own device tokens"
  ON device_tokens FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own device tokens"
  ON device_tokens FOR DELETE
  USING (auth.uid() = user_id);

-- Notification history policies
CREATE POLICY "Users can view their own notification history"
  ON notification_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create notification history"
  ON notification_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 8. Create function to get upcoming reminders (for cron job)
CREATE OR REPLACE FUNCTION get_occasions_needing_reminders()
RETURNS TABLE (
  occasion_id UUID,
  occasion_name VARCHAR,
  occasion_date TIMESTAMPTZ,
  occasion_type VARCHAR,
  user_id UUID,
  device_token VARCHAR,
  days_until_event INTEGER,
  reminder_message TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.id AS occasion_id,
    o.name AS occasion_name,
    o.date AS occasion_date,
    o.type AS occasion_type,
    o.user_id,
    dt.device_token,
    EXTRACT(DAY FROM (o.date - NOW()))::INTEGER AS days_until_event,
    CASE
      WHEN EXTRACT(DAY FROM (o.date - NOW()))::INTEGER = 1
      THEN 'Your ' || o.name || ' is tomorrow! Have you purchased your outfit?'
      ELSE 'Your ' || o.name || ' is in ' || EXTRACT(DAY FROM (o.date - NOW()))::INTEGER || ' days! Time to plan your outfit.'
    END AS reminder_message
  FROM occasions o
  INNER JOIN device_tokens dt ON o.user_id = dt.user_id
  WHERE
    o.outfit_purchased = false
    AND o.date > NOW()
    AND dt.is_active = true
    AND dt.platform = 'ios'
    AND EXTRACT(DAY FROM (o.date - NOW()))::INTEGER = ANY(o.reminder_days);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Grant execute permission on function
GRANT EXECUTE ON FUNCTION get_occasions_needing_reminders() TO authenticated;
GRANT EXECUTE ON FUNCTION get_occasions_needing_reminders() TO service_role;

-- 10. Sample data for testing (optional - remove in production)
-- INSERT INTO occasions (user_id, name, date, type, reminder_days, outfit_purchased)
-- VALUES (
--   auth.uid(),
--   'Summer Wedding',
--   NOW() + INTERVAL '10 days',
--   'wedding',
--   ARRAY[7, 3, 1],
--   false
-- );

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Tables created:
--   ✓ occasions
--   ✓ device_tokens
--   ✓ notification_history
--
-- RLS enabled and policies created
-- Indexes created for performance
-- Helper function created for cron jobs
-- =====================================================
