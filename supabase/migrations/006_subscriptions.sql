-- Story 3 [loop:money]: subscriptions table
-- Each broker has one active subscription (MVP). Historical rows added in v2.
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id UUID NOT NULL REFERENCES brokers(id) ON DELETE CASCADE,
  tier VARCHAR(20) NOT NULL,                   -- broker / developer
  status VARCHAR(20) DEFAULT 'inactive',       -- active / inactive / past_due / canceled
  price_sar NUMERIC(10,2),
  gateway_name VARCHAR(20) DEFAULT 'stripe',   -- stripe (MVP) / tap (v2)
  gateway_customer_id VARCHAR(120),
  gateway_payment_id VARCHAR(120),
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (broker_id)                           -- one active subscription per broker (MVP)
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_broker_id ON subscriptions(broker_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status    ON subscriptions(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_payment_id
  ON subscriptions(gateway_payment_id)
  WHERE gateway_payment_id IS NOT NULL;

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_own_subscription ON subscriptions
  FOR SELECT USING (broker_id = auth.uid());
CREATE POLICY insert_own_subscription ON subscriptions
  FOR INSERT WITH CHECK (broker_id = auth.uid());
CREATE POLICY update_own_subscription ON subscriptions
  FOR UPDATE USING (broker_id = auth.uid());
