-- Story 9 [@Phase2]: properties + AI-generated multilingual ad copy + images.
-- Distribution-layer entities (see architecture/distribution-layer-spec.md §3).
-- All multi-tenant tables get RLS: a broker sees only their own rows.

CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id UUID NOT NULL REFERENCES brokers(id) ON DELETE CASCADE,
  title VARCHAR(255),
  base_description TEXT,
  property_type VARCHAR(80),
  city VARCHAR(100) DEFAULT 'Riyadh',
  price_sar NUMERIC(14,2),
  area_sqm NUMERIC(10,2),
  bedrooms SMALLINT,
  features JSONB,
  status VARCHAR(20) DEFAULT 'draft',     -- draft / published / archived
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AC-9.2 / AC-9.3: one row per language, broker can edit + save each version
CREATE TABLE IF NOT EXISTS property_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  language VARCHAR(5) NOT NULL,           -- en / zh / ms / ur / ar
  title VARCHAR(255),
  description TEXT,
  generated_by_ai BOOLEAN DEFAULT TRUE,
  edited_by_broker BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (property_id, language)
);

-- AC-9.4: unlimited images per property (no count cap), UTF-8 storage path
CREATE TABLE IF NOT EXISTS property_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  sort_order SMALLINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_properties_broker_id ON properties(broker_id);
CREATE INDEX IF NOT EXISTS idx_property_translations_property_id ON property_translations(property_id);
CREATE INDEX IF NOT EXISTS idx_property_images_property_id ON property_images(property_id);

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_own_properties ON properties FOR SELECT USING (broker_id = auth.uid());
CREATE POLICY insert_own_properties ON properties FOR INSERT WITH CHECK (broker_id = auth.uid());
CREATE POLICY update_own_properties ON properties FOR UPDATE USING (broker_id = auth.uid());
CREATE POLICY delete_own_properties ON properties FOR DELETE USING (broker_id = auth.uid());

-- child tables: scope through the parent property's broker
CREATE POLICY select_own_translations ON property_translations FOR SELECT
  USING (EXISTS (SELECT 1 FROM properties p WHERE p.id = property_id AND p.broker_id = auth.uid()));
CREATE POLICY write_own_translations ON property_translations FOR ALL
  USING (EXISTS (SELECT 1 FROM properties p WHERE p.id = property_id AND p.broker_id = auth.uid()));

CREATE POLICY select_own_images ON property_images FOR SELECT
  USING (EXISTS (SELECT 1 FROM properties p WHERE p.id = property_id AND p.broker_id = auth.uid()));
CREATE POLICY write_own_images ON property_images FOR ALL
  USING (EXISTS (SELECT 1 FROM properties p WHERE p.id = property_id AND p.broker_id = auth.uid()));
