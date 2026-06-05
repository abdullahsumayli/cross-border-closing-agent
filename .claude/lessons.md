# Lessons — Cross-Border Closing Agent

Last pruned: 2026-06-05
Last updated: 2026-06-05 (Story 8 retro — L-006 added)

## Active lessons

### L-001: External credentials أولاً — قبل `/3-eo-code`

**القاعدة:** قبل البدء في كود أي AC يعتمد على خدمة خارجية (Stripe price IDs، Sentry DSN، Unifonic API key)، تحقق أن الـ credential موجود في `.env.local`. إذا لم يكن — وثّقه كـ "blocked on human action" في ملف الخطة وتقدّم للكود التجريبي فقط.

**لماذا:** Story 3 QA=7 (بدلاً من 9) لأن `STRIPE_PRICE_BROKER_ID` + `STRIPE_PRICE_DEVELOPER_ID` لم تُنشأ في Stripe Dashboard → لا sandbox checkout test → فقدنا نقطتين في QA.

**كيف أطبّق:** في `/2-eo-dev-plan`، أضف قسم "External Prerequisites" يُدرج كل credential مطلوب. أكمل إدراجها في `.env.local` قبل `/3-eo-code`.

---

### L-002: Browser test أثناء `/3-eo-code` (ليس بعده)

**القاعدة:** لكل ملف `.tsx` جديد، شغّل `npm run dev`، افتح في browser على 375px، وخذ screenshot قبل commit. ليس قبل الشحن — أثناء التطوير.

**لماذا:** UX cap عند 8 في Stories 3 و4 بسبب "browser لم يُفتَح فعلياً." 5 دقائق أثناء `/3-eo-code` توفّر bridge-gaps session كاملة (=30-45 دقيقة) لاحقاً.

**كيف أطبّق:** بعد كتابة أي component جديد: `npm run dev` → `localhost:3000/{route}` → DevTools → iPhone SE (375×667) → screenshot.

---

### L-003: Pattern الخدمات الخارجية — fetch مباشر بدون dependency

**القاعدة:** لأي خدمة analytics/notification/webhook خارجية في server-side route، استخدم نمط:
```typescript
await fetch(url, { method: 'POST', body: JSON.stringify(payload) }).catch(() => {})
```
لا dependency جديدة. guard على API key أولاً. fire-and-forget دائماً.

**لماذا:** نمط تحقّق في `src/lib/email.ts` (Mailgun) و`src/lib/posthog.ts` (PostHog). قابل لإعادة الاستخدام في Story 6 (GHL) وStory 7 (Tap webhook notifications).

**كيف أطبّق:** `if (!apiKey) return` → `fetch(...)` → `.catch(() => {})`. لا try/catch إضافية — fire-and-forget يعني أن الخدمة down ≠ feature down.

---

### L-004: Server Components → direct Supabase، لا HTTP self-call

**القاعدة:** في Next.js App Router، إذا كان Server Component يحتاج بيانات من Supabase، استعلم مباشرةً بـ `createClient()` من `@/lib/supabase/server`. لا تستدعِ API route الخاص بك عبر `fetch(${baseUrl}/api/...)`.

**لماذا:** self-referencing HTTP call يضيف round-trip زيادي (localhost → localhost) + يحتاج `NEXT_PUBLIC_APP_URL` كـ env var + يعقّد error handling + يُضيف latency. الـ cookie client يعمل مباشرةً في Server Components وRLS مُطبَّق تلقائياً.

**كيف أطبّق:** `const supabase = await createClient()` داخل Server Component مباشرةً. الاستثناء الوحيد: Client Components لا تستطيع الوصول لـ cookies server-side — هناك تحتاج API route.

---

### L-005: undefined→null mismatch عند حدود التكامل

**القاعدة:** عند تمرير بيانات من qualification engine (يُعيد `undefined`) إلى أي interface تتوقع `null`، أضف `?? null` على كل حقل nullable في نقطة الاتصال.

**لماذا:** `ts-jest` يجتاز الـ type mismatch أحياناً، لكن `tsc` في `npm run build` يفشل. Bug ظهر في Story 6 عند ربط `result.seriousnessScore` (type: `number | undefined`) بـ `GhlCardInput.seriousnessScore` (type: `number | null`) — الاختبارات اجتازت لكن البناء فشل.

**كيف أطبّق:** في كل استدعاء لـ service function خارجية تأخذ typed interface:
```typescript
void syncService(id, {
  field: result.field ?? null,   // ← دائماً ?? null على الحقول الاختيارية
})
```
ابحث عن `result.` في كل مكان يُمرَّر فيه لـ interface خارجية — تحقق من compatibility.

---

### L-006: ux-reference artifact قبل كل قصة UI — يرفع UX cap من 8 → 9+

**القاعدة:** لكل قصة تحتوي ملف `.tsx` جديداً، أنشئ `docs/ux-reference/story-N-*.html` (wireframe نصي أو stub HTML) قبل `/3-eo-code`. حتى stub بسيط يُعدّ artifact ويرفع سقف UX hat.

**لماذا:** Stories 5, 6, 8 — UX cap عند 8 في جميعها بسبب "لا ux-reference artifact للقصص v2". إنشاء stub قبل التطوير يمنع الـ cap ويرفع UX Q7 (ux-reference match) من 0 → 8+.

**كيف أطبّق:** في `/2-eo-dev-plan`، إذا كان الـ plan يتضمن `.tsx` جديد → أضف "إنشاء `docs/ux-reference/story-N-layout.html`" كأول خطوة قبل `/3-eo-code`. Stub بسيط بـ dir="rtl" والعناصر الرئيسية يكفي.

---

## Archived lessons

None.
