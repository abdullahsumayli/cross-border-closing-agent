# Lessons — Cross-Border Closing Agent

Last pruned: 2026-06-05
Last updated: 2026-06-08 (verify+reship 1-4 + Stories 7,9,10,11 — L-007, L-008, L-009 added)

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

### L-007: انجراف عقد env بعد هجرة مزوّد — الكود يقرأ متغيّراً لا يوثّقه `.env.example`

**القاعدة:** بعد أي هجرة مزوّد (Anthropic→OpenRouter، Stripe→Tap، …)، تحقّق أن كل `process.env.X` في الكود يطابق المتغيّر الموثَّق في `.env.example`، وأن اسمه يعكس المزوّد الفعلي (endpoint OpenRouter ⇒ `OPENROUTER_API_KEY` لا `ANTHROPIC_API_KEY`).

**لماذا:** هجرة OpenRouter تركت `whatsapp/route.ts` يقرأ `ANTHROPIC_API_KEY` بينما `.env.example` يوثّق `OPENROUTER_API_KEY` → على أي نشر نظيف يتبع العقد: `Bearer undefined` → كشف اللغة يفشل صامتاً (AC-2.1 مكسور). الاختبارات مرّت لأنها تحقن mock، فالـ bug ظهر فقط في الإنتاج. هذا «القصة 2 وقفت».

**كيف أطبّق:** بعد هجرة، `grep -rn "process.env" src/` وقابِل كل مفتاح بـ `.env.example`. لأي نداء خدمة خارجية: guard على المفتاح أولاً (`if (!key) fallback`) + معالجة شكل الرد، وأضف regression test يثبت السلوك عند غياب المفتاح/فشل الرد. مرتبط بـ [[L-001]] و [[L-003]].

---

### L-008: مصدر الحقيقة المُتتبَّع في `architecture/` (lowercase) — مجلّدات EO-Brain المرقّمة مُتجاهَلة

**القاعدة:** المجلّدات المرقّمة (`0-Scorecards/`, `1-ProjectBrain/`, `4-Architecture/`, …) في `.gitignore` — هي مصدر EO-Brain المحلّي. النسخة المُتتبَّعة في git هي `architecture/` (lowercase). أي ملف يجب أن يصل GitHub (وأي test يفحص وجود ملف) لازم يكون في `architecture/` أو `docs/` لا في `4-Architecture/`.

**لماذا:** كتبت `pdpl-data-localization.md` في `4-Architecture/` فتجاهله git (والـ commit انكسر بسبب `&&` بعد `git add` فاشل)، و test AC-7.3 كان بيفشل على clone نظيف. كذلك الـ BRD المُتتبَّع كان عالقاً عند Story 8 بينما المدموج (9-11) في `4-Architecture/` المُتجاهَل.

**كيف أطبّق:** قبل أي commit لوثيقة، `git check-ignore -v <path>`. ضع وثائق المعمارية في `architecture/`، والدرجات/المراجع في `docs/`. عند بدء قصص جديدة من BRD مدموج، زامِن `4-Architecture/brd.md` → `architecture/brd.md` أولاً.

---

### L-009: قصص الاعتماد الخارجي — ابنِ البنية + mock، وسِّم الحيّ blocked، لا تزوّر 90

**القاعدة:** لقصة تعتمد على حساب/منصة خارجية لا تملكها (Tap، Properstar/Juwai)، ابنِ كل الكود القابل للبناء (interface + registry + engine + mock connector + tests + DB + UI) وأوسم نصف الـ AC الحيّ «blocked on human action». درجة هذي القصص سقفها ~88 (QA=8 cap L-001) — **لا ترفعها لـ90 بـ bridge-gaps لأن الفجوة credential مو code**.

**لماذا:** Story 7 (Tap) و Story 10 (المنصات) كلاهما 88: البنية مكتملة ومُختبَرة لكن صفر تكامل حي. التزوير لـ90 يكسر صدق trend.csv. النمط الصحيح: mock connector يثبت الـ engine end-to-end، ويُستبدَل بموصّل حقيقي دون تعديل (AC-10.4).

**كيف أطبّق:** في الخطة، صنّف كل AC: buildable الآن / blocked-credential. ابنِ الأول بـ mock + test، وثّق الثاني في `.env.example` + ملاحظة blocked. درجة code-shipped مع cap صريح. مرتبط بـ [[L-001]] و [[L-003]].

---

## Archived lessons

None.
