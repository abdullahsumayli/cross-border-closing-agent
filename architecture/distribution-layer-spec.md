# مواصفات طبقة التوزيع العالمي — جاهزة للبناء

**التاريخ:** 2026-06-05 · يخدم BRD Stories 9, 10, 11 · مرحلة: التطوير المستمر (بعد إثبات الجوهر)
**لمن:** Claude Code — اقرأ هذا مع `4-Architecture/brd.md` و `global-platforms-research.md`.

---

## 1. الهدف (الصورة الكبيرة)

نحوّل المنتج من "وكيل يلتقط الاستفسار" إلى **قمع كامل**: الوسيط يُدخل العقار **مرة واحدة** → النظام يكتب الإعلان بلغات المشترين الأجانب → ينشره في المنصات العالمية → المشتري يستفسر على واتساب → الوكيل يؤهّله → بطاقة عربية للوسيط → تحليلات تربط كل منصة بنتائجها.

> **(English terms shorthand for the dev:)** "listing distribution / multi-channel syndication" via a canonical XML feed + per-platform connectors.

---

## 2. الجديد باختصار (ثلاث ميزات + كيانات بيانات جديدة)

| الميزة (Story) | باختصار |
|----------------|---------|
| **Story 9 — مولّد الإعلان بالـ AI** | يكتب وصف العقار بلغة المشتري (إنجليزي/صيني/ملايو/أردو) باحترافية موحّدة + رفع صور غير محدود |
| **Story 10 — محرك التوزيع + شبكة الموصّلات** | إدخال العقار مرة → نشر تلقائي للمنصات العالمية عبر "موصّلات" (connectors) + "feed موحّد" (XML) |
| **Story 11 — التسعير الطبقي + Freemium** | باقات (مجاني/Starter/Pro/Agency) بحدود مفروضة برمجياً |

**كيانات بيانات جديدة** (جداول): `properties` (العقار)، `property_translations` (الترجمات)، `property_images` (الصور)، `distribution_channels` (كتالوج المنصات)، `distributions` (نشر العقار في كل منصة + حالته).

---

## 3. التغييرات على قاعدة البيانات (Supabase / Postgres)

> ملاحظة للوسيط غير التقني: هذي جداول جديدة نضيفها — مثل دفاتر منظّمة، كل دفتر يحفظ نوع معلومة.

```sql
-- العقار اللي يبي الوسيط يوزّعه
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id UUID NOT NULL REFERENCES brokers(id) ON DELETE CASCADE,
  title VARCHAR(255),
  base_description TEXT,                 -- الوصف الأصلي (عربي/إنجليزي)
  property_type VARCHAR(80),             -- شقة/فيلا/أرض/تجاري
  city VARCHAR(100) DEFAULT 'Riyadh',
  price_sar NUMERIC(14,2),
  area_sqm NUMERIC(10,2),
  bedrooms SMALLINT,
  features JSONB,                        -- مميزات إضافية
  status VARCHAR(20) DEFAULT 'draft',    -- draft / published / archived
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ترجمات الإعلان المولّدة بالـ AI (Story 9)
CREATE TABLE property_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  language VARCHAR(5) NOT NULL,          -- en / zh / ms / ur / ar
  title VARCHAR(255),
  description TEXT,
  generated_by_ai BOOLEAN DEFAULT TRUE,
  edited_by_broker BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- صور العقار (غير محدودة)
CREATE TABLE property_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  url TEXT NOT NULL,                     -- Supabase Storage
  sort_order SMALLINT DEFAULT 0
);

-- كتالوج المنصات العالمية
CREATE TABLE distribution_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(60) NOT NULL,            -- properstar / themovechannel / rightmove_overseas / juwai / jamesedition / bayut
  channel_type VARCHAR(20) NOT NULL,   -- network / xml_feed / api / manual
  is_active BOOLEAN DEFAULT FALSE,
  config JSONB                          -- مفاتيح/إعدادات كل منصة (أسرار في .env لا هنا)
);

-- نشر عقار في منصة + حالته (Story 10)
CREATE TABLE distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES distribution_channels(id),
  broker_id UUID NOT NULL REFERENCES brokers(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending', -- pending / published / failed / removed
  external_ref VARCHAR(160),            -- معرّف العقار في المنصة الخارجية
  last_synced_at TIMESTAMPTZ,
  error TEXT,
  retry_count SMALLINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ربط الاستفسار بالمنصة مصدره (للتحليلات — Story 8)
ALTER TABLE leads ADD COLUMN source_channel_id UUID REFERENCES distribution_channels(id);

-- حدود الباقات (Story 11)
ALTER TABLE subscriptions
  ADD COLUMN max_properties SMALLINT,
  ADD COLUMN max_channels SMALLINT,
  ADD COLUMN max_qualified_leads SMALLINT;
```

كل الجداول الجديدة multi-tenant → فعّل **RLS** عليها (الوسيط يرى صفوفه فقط)، نفس نمط الجداول الحالية.

---

## 4. الميزات الثلاث بالتفصيل

### Story 9 — مولّد الإعلان بالـ AI
- إدخال بيانات العقار مرة → استدعاء Claude API → توليد وصف احترافي بكل لغة مستهدفة (en/zh/ms/ur) + العربية، بنبرة عقارية موحّدة، خلال ~10 ثوانٍ.
- الوسيط يعدّل أي نص ويحفظه (`edited_by_broker = true`).
- رفع صور غير محدود إلى Supabase Storage، مرتبطة بالعقار.

### Story 10 — محرك التوزيع + شبكة الموصّلات
- الوسيط يختار المنصات المستهدفة لكل عقار → نشر بضغطة.
- كل عملية نشر تُسجَّل في `distributions` بحالتها، مع **إعادة محاولة** عند الفشل.
- تحديث/حذف العقار يتزامن عبر كل المنصات المربوطة.
- **بنية موصّلات:** كل منصة = موصّل مستقل (انظر القسم 5) — إضافة منصة جديدة لا تكسر الموجود.

### Story 11 — التسعير الطبقي + Freemium
- باقة مجانية محدودة (حد للعقارات + الاستفسارات) للتجربة والانتشار.
- ترقية فورية بين الباقات تحدّث الحدود خلال ثوانٍ.
- الحدود تُفرَض برمجياً (middleware يفحص `subscriptions.max_*` قبل النشر/التأهيل).

---

## 5. البنية التقنية (الأهم لـ Claude Code)

### أ) الـ Feed الموحّد (Canonical XML Feed)
ابنِ **مولّد feed XML واحد** يُصدّر عقارات الوسيط بصيغة **متوافقة مع Rightmove V3 / BLM** (المعيار السائد). أغلب المنصات والشبكات تسحب من هذا الـ feed.
- Endpoint لكل وسيط/قناة (مثل `/api/feeds/{broker}/{channel}.xml`).
- UTF-8، مرجع فريد لكل عقار، حتى 50 صورة/عقار.

### ب) بنية الموصّلات (Connector Architecture)
واجهة موحّدة `ChannelConnector` بثلاث عمليات:
```
publish(property)  ·  update(property)  ·  remove(property)
```
كل منصة تنفّذ الواجهة حسب نوعها:
- **network** (Properstar/ListGlobally): ربط feed/CRM مرة → توزّع لـ100+ منصة.
- **xml_feed** (TheMoveChannel، Rightmove Overseas): نسلّم رابط الـ XML feed.
- **api** (Hepsiemlak مثلاً): استدعاء API مباشر.
- **manual** (Juwai): رفع عبر لوحتهم/feed بترتيب مباشر.

### ج) طابور المهام (Job Queue)
عمليات النشر/التحديث/الحذف تمر عبر طابور (queue) مع إعادة محاولة وتسجيل الأخطاء في Sentry.

### د) التحليلات (Story 8 مرتبطة)
لمّا يجي استفسار، اربطه بالمنصة مصدره (`leads.source_channel_id`) → لوحة تبيّن أي منصة جابت أجود ليد.

---

## 6. خطة المنصات (مرتّبة — لا تبنيها كلها دفعة)

| المرحلة | المنصة | النوع | لماذا أول |
|---------|--------|------|-----------|
| **A (أول تكامل)** | **Properstar / ListGlobally** | network | feed واحد → 100+ منصة + ترجمة تلقائية |
| **A** | **TheMoveChannel** | xml_feed عام | حاجز منخفض، أسرع تجربة حية |
| **B** | **Rightmove Overseas** | xml_feed + API | أقوى وصول بريطاني |
| **B** | **Juwai** | manual/feed | الأفضل للمشتري الصيني/الآسيوي |
| **C** | **JamesEdition** | xml_feed | الشريحة الفاخرة (> ~490k$) |
| **أساس** | **Bayut.sa / Property Finder** | api/feed | قاعدة محلية + مشترون خليجيون/باكستانيون |

⚠️ **لا تربط:** Kyero / Idealista / Green-Acres / Realtor.com International — **ترفض العقار السعودي** (مقفلة جغرافياً).
⚠️ **باكستان:** لا feed — الوصول عبر شبكة Bayut أو شراكات، ليس تكاملاً تقنياً.
⚠️ **تأكّد عند التسجيل** في كل منصة أنها تقبل **مصدراً سعودياً** (لا صفحة أكّدت ذلك صراحة).

---

## 7. التسلسل المقترح للبناء

1. جداول قاعدة البيانات الجديدة + RLS.
2. Story 9 (مولّد الإعلان AI + الصور) — خفيف وقيمته عالية.
3. الـ Feed الموحّد (XML) + بنية الموصّلات (واجهة فارغة + موصّل تجريبي).
4. Story 10 المرحلة A: Properstar + TheMoveChannel (تكامل حي + إعادة محاولة).
5. Story 11 (الباقات + Freemium + فرض الحدود).
6. التحليلات (ربط المنصة بالاستفسار).
7. توسيع الموصّلات (المرحلة B ثم C) منصة منصة.

---

## 8. ما تعطيه لـ Claude Code

وجّهه يقرأ هذا الملف + `brd.md` (Stories 9, 10, 11) + `global-platforms-research.md`، ثم يبني بالتسلسل أعلاه عبر السلسلة المرقّمة (`/2-eo-dev-plan story-9` → `/3-eo-code` → … → `/7-eo-ship`)، قصة قصة، بعد ما تخلص قصص الأساس (1–4).
