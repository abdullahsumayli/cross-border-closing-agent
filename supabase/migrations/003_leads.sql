-- Migration 003: leads table + RLS
-- AC-2.6: broker sees only their own leads

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id UUID NOT NULL REFERENCES brokers(id) ON DELETE CASCADE,
  buyer_phone VARCHAR(20) NOT NULL,
  buyer_name VARCHAR(255),
  detected_language VARCHAR(5),             -- en/zh/ms/ur/ar
  nationality VARCHAR(80),
  status VARCHAR(20) DEFAULT 'in_progress', -- in_progress/qualified/unqualified
  unqualified_reason TEXT,
  legal_eligibility VARCHAR(20),            -- eligible/not_eligible/unknown
  seriousness_score SMALLINT,               -- 0-100
  qualification_step SMALLINT DEFAULT 0,   -- 0-5
  budget_sar NUMERIC(14,2),
  timeline VARCHAR(50),
  property_type VARCHAR(80),
  first_response_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_broker_id ON leads(broker_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_buyer_phone ON leads(broker_id, buyer_phone);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_own ON leads FOR SELECT USING (broker_id = auth.uid());
CREATE POLICY insert_own ON leads FOR INSERT WITH CHECK (broker_id = auth.uid());
CREATE POLICY update_own ON leads FOR UPDATE USING (broker_id = auth.uid());
