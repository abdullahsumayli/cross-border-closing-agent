# Database Architecture — Cross-Border Closing Agent

**Database:** PostgreSQL via Supabase (MVP) → ترحيل ممكن لـ AWS me-central-1 / STC Cloud في v2 (PDPL)
**ORM:** Drizzle (موصى به لـ Next.js)
**Multi-tenancy:** Postgres RLS من اليوم الأول — كل وسيط يرى بياناته فقط
**التاريخ:** 2026-06-05

> المخطط مشتق مباشرة من قصص الـ BRD. كل جدول يخدم قصة واحدة أو أكثر.

---

## SCHEMA DEFINITION

### brokers table (Story 1 — auth)

```sql
CREATE TABLE brokers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  full_name VARCHAR(255),
  office_name VARCHAR(255),
  city VARCHAR(100) DEFAULT 'Riyadh',
  whatsapp_business_number VARCHAR(20),       -- رقم واتساب المكتب المربوط
  whatsapp_connected BOOLEAN DEFAULT FALSE,
  preferred_language VARCHAR(5) DEFAULT 'ar',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_brokers_email ON brokers(email);
CREATE INDEX idx_brokers_whatsapp ON brokers(whatsapp_business_number);
```

### leads table (Story 2 — domain)

```sql
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id UUID NOT NULL REFERENCES brokers(id) ON DELETE CASCADE,
  buyer_name VARCHAR(255),
  buyer_phone VARCHAR(20) NOT NULL,
  detected_language VARCHAR(5),               -- en / zh / ms / ur / ar
  nationality VARCHAR(80),
  status VARCHAR(20) DEFAULT 'in_progress',   -- in_progress / qualified / unqualified
  unqualified_reason TEXT,
  legal_eligibility VARCHAR(20),              -- eligible / not_eligible / unknown
  seriousness_score SMALLINT,                 -- 0-100
  first_response_at TIMESTAMPTZ,              -- لقياس زمن الرد < 30s
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_leads_broker_id ON leads(broker_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created_at ON leads(created_at);
```

### conversations table (Story 2 — سجل رسائل واتساب)

```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  broker_id UUID NOT NULL REFERENCES brokers(id) ON DELETE CASCADE,
  direction VARCHAR(10) NOT NULL,             -- inbound / outbound
  message_text TEXT,                          -- UTF-8، نصوص متعددة اللغات
  language VARCHAR(5),
  wa_message_id VARCHAR(120),                 -- معرّف رسالة واتساب
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conversations_lead_id ON conversations(lead_id);
CREATE INDEX idx_conversations_broker_id ON conversations(broker_id);
```

### qualification_cards table (Story 2 — البطاقة العربية)

```sql
CREATE TABLE qualification_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  broker_id UUID NOT NULL REFERENCES brokers(id) ON DELETE CASCADE,
  budget_sar NUMERIC(14,2),
  timeline VARCHAR(50),                        -- مثل "خلال 3 أشهر"
  property_type VARCHAR(80),
  legal_eligibility VARCHAR(20),
  seriousness_score SMALLINT,
  card_summary_ar TEXT,                        -- ملخص البطاقة بالعربي
  delivered_to_broker BOOLEAN DEFAULT FALSE,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cards_lead_id ON qualification_cards(lead_id);
CREATE INDEX idx_cards_broker_id ON qualification_cards(broker_id);
```

### subscriptions table (Story 3 — money)

```sql
CREATE TABLE subscriptions (
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
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_broker_id ON subscriptions(broker_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
```

### notifications table (Story 2, 3 — notify)

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id UUID NOT NULL REFERENCES brokers(id) ON DELETE CASCADE,
  channel VARCHAR(15) NOT NULL,                -- whatsapp / email / sms
  template VARCHAR(60),                        -- new_card / payment_received / welcome
  status VARCHAR(15) DEFAULT 'sent',           -- sent / failed / retrying
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_broker_id ON notifications(broker_id);
```

---

## RELATIONSHIPS

```
brokers (1) ──< (N) leads
brokers (1) ──< (N) subscriptions
brokers (1) ──< (N) notifications
leads   (1) ──< (N) conversations
leads   (1) ──< (1) qualification_cards
```

كل شيء متجذّر في `broker_id` — هذا ما يجعل RLS بسيطاً وفعّالاً (tenant = broker).

---

## ROW-LEVEL SECURITY (RLS) — إلزامي

```sql
ALTER TABLE brokers              ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads                ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations        ENABLE ROW LEVEL SECURITY;
ALTER TABLE qualification_cards  ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications        ENABLE ROW LEVEL SECURITY;

-- مثال السياسة (تُكرَّر على كل جدول multi-tenant):
CREATE POLICY select_own_rows ON leads
  FOR SELECT USING (broker_id = auth.uid());
CREATE POLICY insert_own_rows ON leads
  FOR INSERT WITH CHECK (broker_id = auth.uid());
```

السياسة `select_own_rows` على `brokers` تُختبَر في AC-1.10، وعلى `leads`/`conversations` في AC-2.6.

---

## INDEXES (ملخص)

```sql
CREATE INDEX idx_brokers_email          ON brokers(email);
CREATE INDEX idx_leads_broker_id        ON leads(broker_id);
CREATE INDEX idx_leads_status           ON leads(status);
CREATE INDEX idx_conversations_lead_id  ON conversations(lead_id);
CREATE INDEX idx_cards_broker_id        ON qualification_cards(broker_id);
CREATE INDEX idx_subscriptions_status   ON subscriptions(status);
```

---

## MIGRATIONS

1. تعريف المخطط في Drizzle
2. توليد ملف migration
3. تشغيل: `npm run db:migrate`
4. الاختبار على staging قبل الإنتاج

---

## PDPL & DATA RESIDENCY

- **المنطقة (MVP):** Supabase (EU/US افتراضي). مقبول لعملاء وسطاء خاصين غير منظَّمين.
- **المنطقة (v2 — توطين صارم):** AWS me-central-1 (الإمارات) أو STC Cloud (السعودية) — قصة [@Phase2] Story 7.
- **بيانات العملاء:** أسماء، هواتف، استفسارات، بطاقات تأهيل، سجل محادثات.
- **الموافقة:** موافقة صريحة عند بدء المحادثة على واتساب.
- **الاحتفاظ:** 18 شهراً بعد آخر نشاط، ثم soft-delete (`is_active = false`).
- **الحق في المحو:** cascade delete عبر broker وكل السجلات المرتبطة (ON DELETE CASCADE مُعدّ أعلاه).
- **التشفير:** at-rest (Supabase) + in-transit (TLS).

---

## GROWTH PROJECTIONS (حجم 200–1000 وسيط متوقَّع)

| الوسطاء | حجم DB | الإجراء |
|---------|--------|---------|
| 10–200 | < 50MB | الإعداد الحالي كافٍ |
| 200–1k | 50–300MB | أضِف Redis (Contabo-hosted) للـ caching وحدود المعدل. راقب الـ slow queries. |
| 1k–10k | 300MB+ | read replicas على Postgres؛ أرشفة المحادثات القديمة |

---

## BACKUP STRATEGY

- نسخ احتياطي يومي تلقائي (Supabase مدمج، أو `pg_dump` cron على Contabo)
- تصدير CSV أسبوعي لبيانات العملاء
- أرشيف شهري بارد (S3 أو ما يعادله)

---

## TESTING THE SCHEMA

قبل الإطلاق:
- [ ] إنشاء broker، التحقق من الـ auth
- [ ] إدخال lead، التحقق من قيد المفتاح الأجنبي
- [ ] تشغيل cascade delete، التحقق من حذف السجلات المرتبطة
- [ ] الاختبار بأسماء عربية + نص أردو/صيني/ملايو (UTF-8)
- [ ] استعلام على عينة 1000 صف، التحقق من استخدام الـ indexes (EXPLAIN ANALYZE)
- [ ] اختبار سياسة RLS فاشلة (broker يحاول قراءة بيانات broker آخر → يُرفَض)
