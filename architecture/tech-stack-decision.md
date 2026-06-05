---
SaaSfast mode: M3 — Core stack
Rationale: SaaS loop كلاسيكي — auth → dashboard → leads → payments → admin. Next.js + Supabase + Stripe كلها موجودة في SaaSfast M3.
Payment provider: stripe (MVP via SaaSfast) — tap مؤجَّل لـ v2 Story 7 (trigger: العميل رقم 20)
Recorded: 2026-06-05
---

# قرار الـ Tech Stack — Cross-Border Closing Agent

**المنتج:** Cross-Border Closing Agent — وكيل واتساب ذكي يرد على الاستفسارات العقارية الأجنبية، يؤهّل، ويبعث الوسيط بطاقة تأهيل عربية.
**المؤسس:** عبدالله صميلي — تقني، يبني كود بنفسه، يفضّل Next.js. بنية صامل الجاهزة تختصر شهور تطوير.
**السوق المستهدف:** إقليمي MENA (إطلاق الرياض أولاً) — مفتاح اختيار بوابة الدفع.
**الإصدار:** 1.0 (Weekend MVP + v2)
**التاريخ:** 2026-06-05

> "Architecture كلمة فخمة تعني 'قرارات بتعيش معاها 6 أشهر.' خلنا ناخذها صح."

---

## ملخص القرار

stack بسيط، MENA-first، مبني على ما تملكه فعلاً (SaaSfast + ServerFast) ومتوافق مع بنية صامل. لا Kubernetes، لا microservices، لا تعقيد لا يحمله MVP. الهدف: منتج على رابط حقيقي، يستقبل دفعات، مراقَب، بكامل الـ 7 loops مربوطة — في عطلة نهاية أسبوع واحدة.

---

## الـ Stack (مع التبرير لكل قرار)

| الطبقة | الاختيار | التبرير (سطر–سطرين) |
|--------|----------|---------------------|
| **Frontend** | Next.js 14 (App Router) + TypeScript + Tailwind (RTL plugin) + React Query + Zod | تفضيلك المعلن، وتبنيه بنفسك. RTL إلزامي لأن الواجهة عربية. نبدأ من SaaSfast (boilerplate تملكه) — يختصر 22+ ساعة إعداد. |
| **Boilerplate** | SaaSfast | تملكه أصلاً. Stripe + Supabase + Mailgun + Google OAuth مربوطة مسبقاً. لا سبب لإعادة بناء auth/payments من الصفر. |
| **Backend** | Next.js API Routes + TypeScript | موروثة من SaaSfast. لا حاجة لخادم منفصل لحجم 200–1000 مستخدم. منطق التأهيل/المحادثة من صامل يُعاد استخدامه هنا. |
| **Database** | PostgreSQL via Supabase (MVP) → مسار إقامة بيانات في v2 (انظر أدناه) | Supabase = أسرع طريق + RLS مدمج + auth. ملاحظة PDPL: عميلك الأساسي (وسطاء خاصون) ليس جهة حكومية/منظَّمة، فالامتثال المعياري (موافقة + تشفير + RLS) يكفي للـ MVP. |
| **Auth** | Supabase Auth (email/password + Google) + SMS 2FA عبر Unifonic | Unifonic مزوّد سعودي لرسائل OTP — أنسب من Twilio للأرقام السعودية. 2FA إلزامي لـ B2B. |
| **Payments** | **Stripe عبر SaaSfast (MVP)** + **Tap Payments كمسار ثانٍ (v2)** | السوق إقليمي MENA مختلط → Stripe المملوك مسبقاً هو أفضل مسار للـ MVP (موثّق، webhooks جاهزة). الفوترة بالريال (SAR). انظر "trigger التبديل" أدناه. |
| **Messaging** | WhatsApp Business API (Meta) — أساسي + Resend/Mailgun للبريد | WhatsApp هو قلب المنتج (البطاقة تصل الوسيط على واتساب). بنية صامل جاهزة هنا. البريد للإيصالات ورسائل الترحيب. |
| **CRM** | GoHighLevel (GHL) — تكامل عبر API/webhooks | اخترته كتكامل. يربط الـ leads المؤهَّلة بسير عمل المتابعة. |
| **Deploy** | ServerFast / Contabo | ServerFast = control plane مُدار فوق Contabo VPS. push-to-redeploy + auto-HTTPS + تجربة 30 يوم مجانية. هاردوير MENA-first. تملكه. |
| **Monitoring** | Sentry + PostHog + PM2 + uptime ping | Sentry للأخطاء، PostHog لتحليلات signup/payment، PM2 لإدارة العملية، ping كل 5 دقائق على /api/health. |

---

## مسار النشر (Deploy Lane)

**المختار: ServerFast / Contabo** (الافتراضي لـ 90% من المؤسسين).

- **ServerFast** = طبقة النشر المُدارة: تربط GitHub repo عام → شهادة HTTPS تلقائية → push-to-redeploy.
- **Contabo** = الـ VPS تحت ServerFast، مرئي ويمكن التحكم به مباشرة عبر Contabo MCP عند الحاجة (logs, restarts, snapshots).
- **لماذا لا Vercel:** استضافة أمريكية افتراضية + تسعير غامض عند التوسّع + لا داعي له ما دام ServerFast/Contabo يغطي نفس الحالة بهاردوير محلي.

---

## بوابة الدفع — قرار مبني على Q9 (السوق إقليمي MENA)

**الأساسي للـ MVP: Stripe عبر SaaSfast** — لأنه:

- مدمج مسبقاً في SaaSfast (تملكه)، يوفّر ~22 ساعة تكامل.
- آليات الاشتراك + webhooks + customer portal + الضرائب كلها مربوطة.
- مسار الإنتاج لمؤسس غير أمريكي: Stripe via Atlas = إعداد لمرة واحدة + إدارة سنوية بسيطة.

**trigger التبديل (مطلوب — يُسجَّل كقصة [@Phase2]):**

> Stripe عبر SaaSfast هو مسار شحن الـ Weekend MVP لأنه مملوك ويوفّر ~22 ساعة. عند **العميل رقم 20** أو حين تتجاوز المبيعات الخليجية الشهرية حداً يبرّر المسار الثاني، أضِف **Tap Payments** كمسار خليجي ثانٍ — يغطي mada / STC Pay / KNET / BENEFIT بتكامل واحد عبر كامل الخليج. هذه الطرق ليست اختيارية — هي كيف يدفع عميل الخليج.

**ملاحظة الفوترة:** الأسعار بالريال (SAR) كما في نموذج الإيرادات (800–1500 ريال شهرياً). Stripe يعرض SAR كعملة تقديم؛ مع Atlas التسوية بالدولار.

---

## ملاحظة إقامة البيانات (PDPL) — مهمة

اخترت **إقامة بيانات سعودية (PDPL)** مع سوق **إقليمي MENA**. القراءة الصادقة:

- **للـ MVP (عملاء وسطاء خاصون):** ليسوا جهة منظَّمة/حكومية. الامتثال المعياري — موافقة صريحة، تشفير at-rest/in-transit، RLS على كل جدول multi-tenant، حذف عند الطلب — يكفي. اشحن على Supabase/ServerFast.
- **في v2 (إذا دخلت عملاء حكوميين أو مطوّرين كباراً يشترطون التوطين):** هاجر قاعدة البيانات إلى منطقة داخل الجغرافيا — **AWS me-central-1 (الإمارات)** أو **STC Cloud (السعودية)**. مسجَّل كقصة [@Phase2] في الـ BRD.

هذه ثغرة وعدتك أعلّمها: متطلب التوطين الصارم لا يُحل في الـ MVP، لكنه مخطَّط له بوضوح في v2.

---

## جدول التكلفة الشهرية (تقديري — ميزانية أقل من $200/شهر)

| البند | المزوّد | التكلفة الشهرية التقديرية |
|-------|---------|--------------------------|
| الاستضافة | ServerFast/Contabo (بعد التجربة المجانية) | $10–15 |
| قاعدة البيانات | Supabase (Free → Pro عند النمو) | $0–25 |
| WhatsApp Business API | Meta (تسعير بالمحادثة) | $10–40 (حسب الحجم) |
| OTP/SMS | Unifonic | $5–20 |
| البريد | Resend/Mailgun | $0–15 |
| المراقبة | Sentry + PostHog (خطط مجانية للبداية) | $0 |
| Stripe | رسوم معاملات فقط (لا اشتراك شهري) | حسب المبيعات |
| **الإجمالي التقديري** | | **~$35–130/شهر** ضمن ميزانيتك |

ملاحظة: Stripe via Atlas له إعداد لمرة واحدة (~$500) — استثمار يستحق لأول 5–20 عميل بصرف النظر عن البوابة طويلة المدى.

---

## تعديلات شرطية مطبَّقة

- **Multi-tenant:** Postgres RLS من اليوم الأول (كل وسيط يرى بياناته فقط).
- **RTL:** Tailwind RTL plugin + خطوط Cairo/Tajawal — اختبار بالعربي من اليوم الأول.
- **لوحة تحكم كاملة:** اخترت admin كامل — مخطَّط كقصة منفصلة في الـ BRD.
- **حجم 200–1000:** الإعداد الحالي كافٍ؛ Redis يُضاف عند 1k+ (انظر db-architecture.md).

---

## فحوصات الجودة التلقائية (عبر plugin microsaas-dev-os)

تُفرَض لكل PR عبر `/eo-score` — لا تُكرَّر هنا:

- `arabic-rtl-checker` — تخطيط RTL، خطوط Cairo/Tajawal، عزل BiDi
- `mena-mobile-check` — viewport 375px، عملات SAR، عطلة الجمعة/السبت، DD/MM/YYYY
- `brd-traceability` — كل `AC-N.N` له اختبار `@AC-N.N`

---

*EO MicroSaaS OS — 4-eo-tech-architect — Phase 4 · قرار الـ Tech Stack*
