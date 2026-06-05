-- Migration 004: conversations table + RLS
-- AC-2.6: broker sees only their own conversations

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  broker_id UUID NOT NULL REFERENCES brokers(id) ON DELETE CASCADE,
  direction VARCHAR(10) NOT NULL,   -- inbound/outbound
  message_text TEXT,
  language VARCHAR(5),
  wa_message_id VARCHAR(120),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_lead_id ON conversations(lead_id);
CREATE INDEX IF NOT EXISTS idx_conversations_broker_id ON conversations(broker_id);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_own ON conversations FOR SELECT USING (broker_id = auth.uid());
CREATE POLICY insert_own ON conversations FOR INSERT WITH CHECK (broker_id = auth.uid());
