-- Create table for storing user calendar connections
-- This decouples calendar providers from authentication providers
-- Allows users to connect any calendar regardless of how they logged in

CREATE TABLE IF NOT EXISTS user_calendar_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('google', 'apple', 'outlook')),

    -- OAuth tokens (encrypted at rest by Supabase)
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,

    -- Calendar-specific data
    calendar_email TEXT,
    calendar_name TEXT,

    -- Metadata
    is_active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure one connection per provider per user
    UNIQUE(user_id, provider)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_calendar_connections_user_id
    ON user_calendar_connections(user_id);

CREATE INDEX IF NOT EXISTS idx_calendar_connections_user_provider
    ON user_calendar_connections(user_id, provider)
    WHERE is_active = true;

-- Enable Row Level Security
ALTER TABLE user_calendar_connections ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own calendar connections
CREATE POLICY "Users can view own calendar connections"
    ON user_calendar_connections
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own calendar connections
CREATE POLICY "Users can insert own calendar connections"
    ON user_calendar_connections
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own calendar connections
CREATE POLICY "Users can update own calendar connections"
    ON user_calendar_connections
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own calendar connections
CREATE POLICY "Users can delete own calendar connections"
    ON user_calendar_connections
    FOR DELETE
    USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_calendar_connections_updated_at
    BEFORE UPDATE ON user_calendar_connections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON user_calendar_connections TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
