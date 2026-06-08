# PDPL Data-Localization Runbook — Story 7 AC-7.3

**الحالة:** موثَّق ✅ · التنفيذ على staging **محجوب على إجراء بشري** (نقل مشروع سحابي مدفوع) — L-001.
**يخدم:** AC-7.3 · يرتبط بـ `src/lib/pdpl.ts` (فحص الجاهزية)

---

## 1. لماذا

نظام حماية البيانات الشخصية السعودي (PDPL) قد يُلزم بعض العملاء (جهات حكومية/شبه حكومية) بتوطين بياناتهم داخل المنطقة. الـ MVP يعمل على Supabase (منطقة افتراضية خارج الخليج) — مقبول للعملاء الخاصين، لكن نحتاج مساراً جاهزاً للنقل عند دخول عميل يشترط التوطين.

## 2. مناطق التوطين المسموحة (PDPL-compliant)

| المنطقة | المزوّد | الكود |
|---------|---------|-------|
| الإمارات | AWS me-central-1 | `me-central-1` |
| البحرين | AWS me-south-1 | `me-south-1` |
| الرياض | STC Cloud | `stc-cloud-riyadh` |

هذه القائمة مفروضة برمجياً في `PDPL_ALLOWED_REGIONS` ويُتحقَّق منها عبر `validateDataResidencyConfig()` قبل أي نقل (region + تشفير عند السكون + منع النقل عبر الحدود).

## 3. خيارات النقل

1. **Supabase Region Move** — Supabase يدعم مناطق متعددة؛ نقل المشروع لمنطقة شرق أوسطية عند توفّرها. الأبسط، لا تغيير كود.
2. **Self-host Supabase على AWS me-central-1** — Postgres + GoTrue + Storage على VPC إماراتي. تحكّم كامل، تشغيل أعلى.
3. **STC Cloud (الرياض)** — Postgres مُدار داخل المملكة. الأقوى امتثالاً، الأعلى كلفة.

## 4. Runbook النقل (staging أولاً)

```
1. validateDataResidencyConfig({ region, encryptionAtRest:true, crossBorderTransferAllowed:false }) → valid
2. pg_dump من المصدر (مع RLS policies + الأدوار)
3. توفير Postgres في المنطقة الهدف + تفعيل encryption-at-rest
4. pg_restore + تطبيق كل migrations (supabase/migrations/*)
5. تحديث DATABASE_URL / SUPABASE_URL في secrets النشر
6. فحص دخان: /api/health → {status:ok, db:ok} + RLS smoke test (الوسيط يرى صفوفه فقط)
7. تبديل DNS/الإعدادات للإنتاج بعد نجاح staging
8. الاحتفاظ بالمصدر للقراءة 7 أيام ثم الإطفاء
```

## 5. ما هو محجوب (L-001)

- توفير حساب/مشروع في المنطقة الهدف (كلفة + اعتماد بشري).
- تشغيل الـ runbook فعلياً على staging والتحقق منه (نصف "مُختبَر على staging" من AC-7.3).

**عند توفّر المنطقة الهدف:** شغّل الـ runbook أعلاه، وحدّث هذا الملف بنتيجة فحص الدخان وعلامة "مُختبَر على staging ✅".
