-- Migration 005: qualification_cards table + RLS
-- AC-2.3: card generated + delivered to broker

CREATE TABLE IF NOT EXISTS qualification_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  broker_id UUID NOT NULL REFERENCES brokers(id) ON DELETE CASCADE,
  budget_sar NUMERIC(14,2),
  timeline VARCHAR(50),
  property_type VARCHAR(80),
  legal_eligibility VARCHAR(20),
  seriousness_score SMALLINT,
  card_summary_ar TEXT NOT NULL,
  delivered_to_broker BOOLEAN DEFAULT FALSE,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cards_lead_id ON qualification_cards(lead_id);
CREATE INDEX IF NOT EXISTS idx_cards_broker_id ON qualification_cards(broker_id);

ALTER TABLE qualification_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_own ON qualification_cards FOR SELECT USING (broker_id = auth.uid());
CREATE POLICY insert_own ON qualification_cards FOR INSERT WITH CHECK (broker_id = auth.uid());
