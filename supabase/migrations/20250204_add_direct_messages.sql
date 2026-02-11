-- =====================================================
-- 1:1 Direct Message Feature Tables
-- Migration: 20250204_add_direct_messages.sql
-- =====================================================

-- 1. Conversations Table (대화방)
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  participant_2_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique pairs (participant_1 always has smaller UUID)
  CONSTRAINT unique_conversation_pair UNIQUE (participant_1_id, participant_2_id),
  CONSTRAINT different_participants CHECK (participant_1_id != participant_2_id)
);

-- Indexes
CREATE INDEX idx_conversations_participant_1 ON conversations(participant_1_id);
CREATE INDEX idx_conversations_participant_2 ON conversations(participant_2_id);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC);

-- 2. Direct Messages Table (1:1 메시지)
CREATE TABLE direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT content_not_empty CHECK (length(trim(content)) > 0)
);

-- Indexes
CREATE INDEX idx_direct_messages_conversation ON direct_messages(conversation_id, created_at DESC);
CREATE INDEX idx_direct_messages_sender ON direct_messages(sender_id);
CREATE INDEX idx_direct_messages_unread ON direct_messages(conversation_id, is_read) WHERE is_read = FALSE;

-- 3. Function to get or create conversation
CREATE OR REPLACE FUNCTION get_or_create_conversation(user_1 UUID, user_2 UUID)
RETURNS UUID AS $$
DECLARE
  p1 UUID;
  p2 UUID;
  conv_id UUID;
BEGIN
  -- Order UUIDs consistently (smaller first)
  IF user_1 < user_2 THEN
    p1 := user_1;
    p2 := user_2;
  ELSE
    p1 := user_2;
    p2 := user_1;
  END IF;

  -- Try to find existing conversation
  SELECT id INTO conv_id FROM conversations
  WHERE participant_1_id = p1 AND participant_2_id = p2;

  -- Create if not exists
  IF conv_id IS NULL THEN
    INSERT INTO conversations (participant_1_id, participant_2_id)
    VALUES (p1, p2)
    RETURNING id INTO conv_id;
  END IF;

  RETURN conv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Trigger to update last_message_at
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_direct_message_insert
  AFTER INSERT ON direct_messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_timestamp();

-- 5. RLS Policies for conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their conversations"
  ON conversations FOR SELECT
  USING (
    auth.uid() = participant_1_id OR
    auth.uid() = participant_2_id
  );

CREATE POLICY "Authenticated users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (
    auth.uid() = participant_1_id OR
    auth.uid() = participant_2_id
  );

-- 6. RLS Policies for direct_messages
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their conversations"
  ON direct_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = direct_messages.conversation_id
      AND (c.participant_1_id = auth.uid() OR c.participant_2_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages to their conversations"
  ON direct_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
      AND (c.participant_1_id = auth.uid() OR c.participant_2_id = auth.uid())
    )
  );

CREATE POLICY "Users can mark messages as read"
  ON direct_messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = direct_messages.conversation_id
      AND (c.participant_1_id = auth.uid() OR c.participant_2_id = auth.uid())
    )
  );

-- 7. Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE direct_messages;
