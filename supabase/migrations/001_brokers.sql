-- Migration 001: brokers table + RLS
-- AC-1.10: select_own_rows policy — broker sees only their own rows
--
-- Scalability note (reviewed 2026-06-05):
--   10–200 brokers: current indexes on (email, whatsapp_business_number) sufficient.
--   200–1k brokers: add index on (is_active, city) if filtering by these becomes common.
--   1k+ brokers: add Redis caching layer for session lookups (see db-architecture.md §GROWTH PROJECTIONS).
--   Bottleneck at scale: RLS policy evaluates auth.uid() per row — acceptable up to ~100k rows/broker.
--   No action needed for Weekend MVP. Revisit at customer #50.

CREATE TABLE IF NOT EXISTS brokers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  full_name VARCHAR(255),
  office_name VARCHAR(255),
  city VARCHAR(100) DEFAULT 'Riyadh',
  whatsapp_business_number VARCHAR(20),
  whatsapp_connected BOOLEAN DEFAULT FALSE,
  preferred_language VARCHAR(5) DEFAULT 'ar',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brokers_email ON brokers(email);

-- RLS
ALTER TABLE brokers ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_own_rows ON brokers
  FOR SELECT USING (id = auth.uid());

CREATE POLICY insert_own_rows ON brokers
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY update_own_rows ON brokers
  FOR UPDATE USING (id = auth.uid());
