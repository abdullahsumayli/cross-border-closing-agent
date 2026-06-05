# Business Requirements Document (BRD)

**Product:** Cross-Border Closing Agent
**Version:** 1.0 (Weekend MVP + v2 roadmap)
**Target Users:** الوسيط/المطوّر العقاري السعودي في مناطق التملّك الأجنبي (الرياض أولاً) — "خالد"، مدير مكتب تسويق عقاري، 10 مسوّقين، تفويضات حصرية، يستقبل 10–20 استفساراً أجنبياً شهرياً ويخسر 70% منها.
**Primary GTM Motion:** محتوى سلطوي + Dream 100 + ديمو حي
**Success Metric:** زمن الرد على الاستفسار الأجنبي < 30 ثانية؛ ≥ 60% من الاستفسارات تتحوّل إلى بطاقة تأهيل مكتملة.

> Cadence (Fri eve → Sun night) lives in `_dev-progress.md`. The BRD says **what**, not **when**.

---

## EXECUTIVE SUMMARY

Cross-Border Closing Agent وكيل واتساب يعمل 24/7: يرد فورياً على الاستفسار العقاري الأجنبي بلغة المشتري (إنجليزي/صيني/ملايو/أردو)، يؤهّله بخمسة أسئلة محددة، يشرح إطار قانون يناير 2026 بحسب جنسيته، ثم يبعث الوسيط بطاقة تأهيل عربية كاملة على واتساب. المشكلة التي يحلها: 70% من الاستفسارات الأجنبية تموت خلال 48 ساعة لأن لا أحد يرد بلغتها — وكل استفسار ميت = 20–40 ألف ريال عمولة ضائعة.

المنتج يبدأ كاستشارة/بايلوت مدفوع ثم يتحول إلى SaaS. يُبنى على بنية صامل الجاهزة (WhatsApp API + منطق التأهيل) ما يختصر 2–4 أشهر تطوير. الـ Weekend MVP يشحن منتجاً حقيقياً على رابط حي، يستقبل دفعات، مراقَب، بكامل الـ 7 loops.

---

## SCOPE

### Weekend MVP — what ships in 48 hrs (Stories 1-4)

> **Weekend MVP — Stories 1–4.**
> Ship the first 4 stories in one weekend. Supabase Auth + Stripe from this BRD. No multi-tier pricing beyond 2 tiers. No full admin dashboard (Supabase Studio until 50 customers).

> **v2 Phase — Stories 5–8.**
> Everything tagged `[@Phase2]` in AC headers below is deferred. v2 entry point: `/2-eo-dev-plan story-5` after the MVP is live.

| # | Loop | Wired means |
|---|---|---|
| 1 | auth | تسجيل → تأكيد بريد أو OTP هاتف → دخول → استعادة كلمة المرور → خروج |
| 2 | domain | استقبال الاستفسار الأجنبي → الرد بلغته → التأهيل بـ5 أسئلة → بطاقة التأهيل العربية للوسيط |
| 3 | money | تسعير → checkout → webhook → تحديث الاشتراك → إيصال بريد |
| 4 | notify | بريد ترحيب عند التسجيل + رسالة واتساب عند أول بطاقة تأهيل |
| 5 | deploy | رابط حقيقي، subdomain مخصص، SSL، `/api/health` يرجّع 200 |
| 6 | observability | Sentry على الأخطاء، تحليلات signup/payment، uptime ping |
| 7 | compliance | Supabase RLS على كل جدول multi-tenant، الأسرار في 1Password، `.env.example` مشحون |

### v2 Roadmap — full product, post-weekend (Stories 5+)

- Story 5: لوحة تحكم إدارية كاملة
- Story 6: تكامل GoHighLevel (GHL)
- Story 7: Tap Payments + توطين بيانات PDPL
- Story 8: تحليلات وتقارير الوسيط

### Explicitly Out of Scope

- تطبيق جوال أصلي — كل شيء عبر واتساب وويب responsive
- سوق/marketplace عقاري عام
- بوابة API لأطراف ثالثة في الـ MVP

---

## USER STORIES & ACCEPTANCE CRITERIA

### Story 1 [@WeekendMVP] [loop:auth] [loop:compliance]: تسجيل الوسيط

**Acceptance Criteria:**
- **AC-1.1** نموذج التسجيل يقبل بريداً صالحاً (RFC-5322) ويرفض المشوّه برسالة inline خلال 200ms
- **AC-1.2** SMS 2FA عبر Unifonic يرسل OTP من 6 أرقام للهاتف خلال 60 ثانية
- **AC-1.3** التحقق من OTP ينجح للأكواد الصادرة خلال 10 دقائق وينتهي بعدها
- **AC-1.4** البريد أو الهاتف غير الصالح يظهر رسالة محددة (لا "حاول مجدداً" عامة)
- **AC-1.5** التسجيل الناجح يحوّل إلى `/dashboard` خلال ثانية واحدة
- **AC-1.6** مسار استعادة كلمة المرور يرسل رابطاً للبريد المسجّل؛ الـ token ينتهي بعد ساعة
- **AC-1.7** التخطيط responsive يعمل عند viewport 375px (iPhone SE)
- **AC-1.8** الأسماء العربية تُعرَض دون تلف (UTF-8 مخزَّن؛ العرض بخط Cairo/Tajawal)
- **AC-1.9** الخروج يمسح الجلسة والكوكيز ويحوّل إلى `/`
- **AC-1.10** سياسة Supabase RLS `select_own_rows` فعّالة على جدول `brokers`

### Story 2 [@WeekendMVP] [loop:domain] [loop:notify]: استقبال وتأهيل الاستفسار الأجنبي

**Acceptance Criteria:**
- **AC-2.1** الاستفسار الوارد على WhatsApp Business API يُكتشف وتُحدَّد لغته، ويتلقى رداً أولياً بلغة المشتري خلال 30 ثانية
- **AC-2.2** الوكيل يطرح 5 أسئلة تأهيل محددة ويخزّن كل إجابة
- **AC-2.3** عند اكتمال التأهيل، تُنشأ بطاقة تأهيل عربية وتُرسَل للوسيط على واتساب خلال 60 ثانية
- **AC-2.4** الاستفسار غير المؤهَّل يُصنَّف "غير مؤهَّل" مع سبب واضح
- **AC-2.5** مسار الخطأ يرجّع رسالة مفيدة وليس 500، ويسجّل الحدث
- **AC-2.6** سياسة RLS مُتحقَّق بها على جدول `leads` و`conversations`

### Story 3 [@WeekendMVP] [loop:money]: التسعير والاشتراك

**Acceptance Criteria:**
- **AC-3.1** صفحة التسعير تعرض 2–3 شرائح بأسعار بالريال وعناوين عربية + إنجليزية
- **AC-3.2** إعادة التوجيه لصفحة Stripe المستضافة تكتمل بنجاح (sandbox)
- **AC-3.3** نقطة الـ webhook تتحقق من التوقيع وترفض الـ payloads غير الموقّعة بـ 401
- **AC-3.4** الدفع الناجح يحدّث `subscriptions.status` خلال 5 ثوانٍ
- **AC-3.5** إيصال بالبريد يُرسَل عند حدث `payment_intent.succeeded`
- **AC-3.6** الـ webhook idempotent — آمن عند الاستقبال مرتين

### Story 4 [@WeekendMVP] [loop:deploy] [loop:observability]: النشر للإنتاج + فحص الصحة

**Acceptance Criteria:**
- **AC-4.1** التطبيق منشور على ServerFast/Contabo؛ subdomain مخصص يُحَل بشهادة SSL صالحة
- **AC-4.2** `/api/health` يرجّع 200 بجسم `{"status":"ok","db":"ok"}`
- **AC-4.3** Sentry يلتقط خطأً مُطلَقاً عمداً في staging خلال 30 ثانية
- **AC-4.4** uptime ping يفحص `/api/health` كل 5 دقائق
- **AC-4.5** سكربت النشر idempotent — التشغيل مرتين لا ينتج diff
- **AC-4.6** تحليلات أساسية (PostHog) تسجّل حدثي signup و payment

### Story 5 [@Phase2]: لوحة تحكم إدارية كاملة

**Acceptance Criteria:**
- **AC-5.1** اللوحة تعرض كل الـ leads مع فلترة بالحالة واللغة والتاريخ
- **AC-5.2** صفحة تفصيل لكل lead تعرض سجل المحادثة الكامل وبطاقة التأهيل
- **AC-5.3** تصدير الـ leads إلى CSV/Excel بنقرة واحدة
- **AC-5.4** RLS مُتحقَّق به: المالك يرى بيانات مكتبه فقط

### Story 6 [@Phase2]: تكامل GoHighLevel (GHL)

**Acceptance Criteria:**
- **AC-6.1** عند إنشاء بطاقة تأهيل، يُنشأ/يُحدَّث contact مقابل في GHL خلال 60 ثانية
- **AC-6.2** حقول البطاقة تُربَط بحقول GHL مخصصة
- **AC-6.3** فشل المزامنة يُسجَّل في Sentry ويُعاد المحاولة حتى 3 مرات
- **AC-6.4** الوسيط يربط/يفصل حساب GHL من الإعدادات عبر OAuth

### Story 7 [@Phase2]: Tap Payments + توطين بيانات PDPL

**Acceptance Criteria:**
- **AC-7.1** Tap webhook على `/api/webhooks/tap` يتحقق من التوقيع ويحدّث الاشتراك
- **AC-7.2** صفحة الدفع توجّه تلقائياً لـ Tap للعملاء الخليجيين ولـ Stripe لغيرهم
- **AC-7.3** خيار ترحيل قاعدة البيانات إلى AWS me-central-1 موثَّق ومُختبَر على staging
- **AC-7.4** تسوية المدفوعات اليومية تطابق webhooks البوابتين مع سجلات الاشتراكات

### Story 8 [@Phase2]: تحليلات وتقارير الوسيط

**Acceptance Criteria:**
- **AC-8.1** اللوحة تعرض عدد الاستفسارات، نسبة التأهيل، ومتوسط زمن الرد لكل فترة
- **AC-8.2** تقرير شهري قابل للتصدير PDF يلخّص الأداء
- **AC-8.3** تنبيه عند انخفاض معدل التأهيل تحت عتبة محددة

---

## SUCCESS METRICS

- زمن الرد على الاستفسار الأجنبي: < 30 ثانية
- نسبة الاستفسارات → بطاقة تأهيل مكتملة: ≥ 60%
- التحويل: ≥ 30% من المسجّلين → أول اشتراك مدفوع
- الاحتفاظ: ≥ 70% من الوسطاء نشطون في الأسبوع الثاني
