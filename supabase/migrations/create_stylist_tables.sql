-- ============================================
-- AI Fashion Stylist Tables
-- Chat history and saved advice
-- ============================================

-- Chat conversations table
CREATE TABLE IF NOT EXISTS stylist_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS stylist_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES stylist_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    images TEXT[], -- Array of image URLs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Saved advice/favorites table
CREATE TABLE IF NOT EXISTS stylist_saved_advice (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES stylist_conversations(id) ON DELETE SET NULL,
    message_id UUID REFERENCES stylist_messages(id) ON DELETE CASCADE,
    advice_content TEXT NOT NULL,
    tags TEXT[], -- e.g., ['wedding', 'formal', 'summer']
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_stylist_conversations_user_id ON stylist_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_stylist_conversations_updated_at ON stylist_conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_stylist_messages_conversation_id ON stylist_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_stylist_messages_created_at ON stylist_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_stylist_saved_advice_user_id ON stylist_saved_advice(user_id);

-- Enable Row Level Security
ALTER TABLE stylist_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE stylist_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE stylist_saved_advice ENABLE ROW LEVEL SECURITY;

-- Policies for stylist_conversations
CREATE POLICY "Users can view their own conversations"
    ON stylist_conversations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations"
    ON stylist_conversations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
    ON stylist_conversations FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations"
    ON stylist_conversations FOR DELETE
    USING (auth.uid() = user_id);

-- Policies for stylist_messages
CREATE POLICY "Users can view messages in their conversations"
    ON stylist_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM stylist_conversations
            WHERE stylist_conversations.id = stylist_messages.conversation_id
            AND stylist_conversations.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create messages in their conversations"
    ON stylist_messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM stylist_conversations
            WHERE stylist_conversations.id = stylist_messages.conversation_id
            AND stylist_conversations.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete messages in their conversations"
    ON stylist_messages FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM stylist_conversations
            WHERE stylist_conversations.id = stylist_messages.conversation_id
            AND stylist_conversations.user_id = auth.uid()
        )
    );

-- Policies for stylist_saved_advice
CREATE POLICY "Users can view their own saved advice"
    ON stylist_saved_advice FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own saved advice"
    ON stylist_saved_advice FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved advice"
    ON stylist_saved_advice FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved advice"
    ON stylist_saved_advice FOR DELETE
    USING (auth.uid() = user_id);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_stylist_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE stylist_conversations
    SET updated_at = NOW()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update conversation timestamp when new message is added
CREATE TRIGGER update_conversation_on_message
    AFTER INSERT ON stylist_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_stylist_conversation_timestamp();
