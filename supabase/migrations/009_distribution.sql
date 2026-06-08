-- Story 10 [@Phase2]: global distribution — channel catalog + per-channel publish status.
-- See architecture/distribution-layer-spec.md §3.

CREATE TABLE IF NOT EXISTS distribution_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(60) NOT NULL UNIQUE,        -- properstar / themovechannel / juwai / ...
  channel_type VARCHAR(20) NOT NULL,       -- network / xml_feed / api / manual
  is_active BOOLEAN DEFAULT FALSE,         -- flipped on once live credentials exist
  config JSONB,                            -- per-channel settings (secrets stay in env)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES distribution_channels(id),
  channel_name VARCHAR(60) NOT NULL,
  broker_id UUID NOT NULL REFERENCES brokers(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending',    -- pending / published / failed / removed
  external_ref VARCHAR(160),
  last_synced_at TIMESTAMPTZ,
  error TEXT,
  retry_count SMALLINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (property_id, channel_name)
);

-- AC: link an inquiry back to the platform it came from (analytics, Story 8)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS source_channel_id UUID REFERENCES distribution_channels(id);

CREATE INDEX IF NOT EXISTS idx_distributions_property_id ON distributions(property_id);
CREATE INDEX IF NOT EXISTS idx_distributions_broker_id ON distributions(broker_id);
CREATE INDEX IF NOT EXISTS idx_distributions_status ON distributions(status);

ALTER TABLE distribution_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE distributions ENABLE ROW LEVEL SECURITY;

-- channel catalog is global + read-only to any authenticated broker
CREATE POLICY select_channels ON distribution_channels FOR SELECT USING (auth.role() = 'authenticated');

-- distributions are multi-tenant: a broker sees + writes only their own
CREATE POLICY select_own_distributions ON distributions FOR SELECT USING (broker_id = auth.uid());
CREATE POLICY write_own_distributions ON distributions FOR ALL USING (broker_id = auth.uid());
