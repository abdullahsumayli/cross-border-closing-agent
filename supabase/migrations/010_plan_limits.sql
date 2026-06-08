-- Story 11 [@Phase2]: freemium tier limits on the subscription (distribution-spec §3).
-- Defaults match the free plan so a row with no explicit limits is safely capped.

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS max_properties      SMALLINT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS max_channels        SMALLINT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS max_qualified_leads SMALLINT DEFAULT 5;
