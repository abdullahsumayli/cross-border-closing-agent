-- Migration 007: GHL OAuth connections per broker (@AC-6.1, @AC-6.4)

CREATE TABLE IF NOT EXISTS ghl_connections (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id     UUID NOT NULL REFERENCES brokers(id) ON DELETE CASCADE,
  access_token  TEXT NOT NULL,
  refresh_token TEXT,
  location_id   TEXT NOT NULL,
  expires_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (broker_id)
);

ALTER TABLE ghl_connections ENABLE ROW LEVEL SECURITY;

-- Brokers can only see/modify their own connection
CREATE POLICY "ghl_connections_select_own"
  ON ghl_connections FOR SELECT
  USING (broker_id = auth.uid());

CREATE POLICY "ghl_connections_insert_own"
  ON ghl_connections FOR INSERT
  WITH CHECK (broker_id = auth.uid());

CREATE POLICY "ghl_connections_update_own"
  ON ghl_connections FOR UPDATE
  USING (broker_id = auth.uid());

CREATE POLICY "ghl_connections_delete_own"
  ON ghl_connections FOR DELETE
  USING (broker_id = auth.uid());
