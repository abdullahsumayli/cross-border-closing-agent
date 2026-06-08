# Retro — التطوير المستمر: إكمال المرحلة 2 · 2026-06-08

## ما شُحن هذه الجلسة

| # | القصة | الدرجة | الحالة |
|---|-------|:------:|--------|
| 1-4 | الأساس (verify + reship) | 90 | ✅ مُعاد التحقق + شُحن — أُصلح regression كشف اللغة |
| 7 | Tap Payments + PDPL | 88 | 🟡 الكود على main · +2 محجوبة على حساب Tap حي |
| 9 | مولّد الإعلان AI متعدد اللغات | 90 | ✅ شُحن |
| 10 | محرك التوزيع + الموصّلات + XML feed | 88 | 🟡 الكود على main · المنصات الحية محجوبة |
| 11 | التسعير الطبقي + Freemium | 90 | ✅ شُحن |

**الاختبارات:** 245 total (239 ناجح، 6 متخطّى = suite النشر الحي). `tsc` + `next build` نظيف على كل قصة.
**Commits:** 7f29dc5 → 17f5d71، كلها على `main` + مدفوعة لـ GitHub.

## أبرز اكتشاف
هجرة OpenRouter كانت تركت القصة 2 (نواة الـ domain) مكسورة على أي نشر نظيف — الكود يقرأ `ANTHROPIC_API_KEY` بدل `OPENROUTER_API_KEY`. هذا «القصة 2 وقفت» اللي حسّ فيه المؤسس. أُصلح + استُخرج لـ lib + 4 regression tests (L-007).

## أنماط تكرّرت
- **mock connector pattern** (Story 10): interface + registry + mock → engine مُختبَر end-to-end، الموصّل الحقيقي يُستبدَل دون تعديل. قابل لإعادة الاستخدام لكل منصة جديدة.
- **pure-function + injected IO** (Tap reconcile، ad-generator، distribution engine، plans): المنطق نقي ومُختبَر بالكامل، الـ route/cron مجرّد glue رفيع.
- **fire-and-forget vs throw**: `detectLanguage` يبتلع لـ'unknown' (inbound ما يُسقَط)، `generateViaOpenRouter` يرمي (إجراء مستخدم قابل لإعادة المحاولة) — نفس الـ lib، انقسام مقصود.

## دروس مُضافة
- **L-007**: انجراف عقد env بعد هجرة مزوّد.
- **L-008**: مصدر الحقيقة المُتتبَّع في `architecture/`؛ المجلّدات المرقّمة مُتجاهَلة.
- **L-009**: قصص الاعتماد الخارجي — ابنِ + mock + وسِّم blocked، سقف ~88، لا تزوّر 90.

## محجوب على إجراء بشري (L-001)
1. حساب Tap حي (`TAP_SECRET_KEY`/`TAP_WEBHOOK_SECRET`) → يقفل AC-7.2 redirect + AC-7.1 الحي.
2. ترحيل staging لـ AWS me-central-1/STC Cloud → يقفل AC-7.3.
3. حسابات المنصات العالمية (Properstar/Juwai/…) → يستبدل mocks بموصّلات حقيقية.
4. واجهة رفع الصور + bucket تخزين حي → نصف AC-9.4.
5. ربط أزرار طبقات Story 11 بـ Stripe/Tap checkout (price IDs).
6. تشغيل migrations 008-010 على Supabase + نشر Coolify + التحقق من `/api/health` 200 حي.

## التالي
- توحيد مفردات الطبقات (broker/developer ↔ free/starter/pro/agency).
- اختبارات route-level للفرض (403) ترفع QA لقصة 11 → 9.
- عند توفّر المفاتيح: استبدال mocks + رفع 7 و10 من 88 → 90+.
