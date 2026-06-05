# CLAUDE.md — Cross-Border Closing Agent

## ما هو هذا المشروع
وكيل واتساب ذكي يرد على الاستفسارات العقارية الأجنبية بلغة المشتري، يؤهّله بـ5 أسئلة، ويبعث الوسيط بطاقة تأهيل عربية كاملة خلال 60 ثانية.

ICP: الوسيط/المطوّر العقاري السعودي في الرياض — خالد، يستقبل 10-20 استفساراً أجنبياً/شهر ويخسر 70% منها
Domain: cross-border-closing-agent
Stage: Weekend MVP (Stories 1-4) → v2 (Stories 5-8)

## Tech Stack
- Frontend: Next.js 14 App Router + TypeScript + Tailwind (RTL plugin) + React Query + Zod
- Backend: Next.js API Routes + TypeScript
- Database: PostgreSQL via Supabase (RLS على كل جدول multi-tenant)
- Auth: Supabase Auth (email/password + Google OAuth) + Unifonic OTP (SMS سعودي)
- Messaging: WhatsApp Business API (Meta) + Mailgun/Resend للبريد
- Payments: Stripe via SaaSfast (MVP) — Tap Payments مؤجَّل لـ v2 Story 7
- AI: Claude API (منطق التأهيل ومعالجة اللغات)
- Monitoring: Sentry + PostHog + PM2
- Hosting: ServerFast / Contabo

## بنية المشروع
```
architecture/brd.md          ← مصدر الحقيقة للميزات (43 AC — لا تبدأ قصة بدون قراءته)
architecture/tech-stack-decision.md  ← قرارات الـ Stack مع التبريرات
src/                         ← كود التطبيق (Next.js 14 App Router)
tests/                       ← اختبارات مُوسَمة @AC-N.N — TDD إلزامي
docs/qa-scores/              ← تاريخ الدرجات + trend.csv
docs/ux-reference/           ← UX ground truth من EO-Brain Phase 5
docs/retros/                 ← ريتروز بعد كل شحنة
.claude/lessons.md           ← حلقة التحسين الذاتي (تُحمَّل عند كل جلسة)
_dev-progress.md             ← tracker القصص يقرأه /eo-guide
```

## The 7 Pillars (non-negotiable)
1. **خطط قبل الكود** — `/2-eo-dev-plan` قبل أي ميزة
2. **Subagents للعمل المتوازي** — dispatch عند استقلالية الملفات
3. **الدروس تتراكم** — أضف لـ `.claude/lessons.md` بعد كل تصحيح
4. **تحقق قبل الإعلان** — `/4-eo-review` قبل "مكتمل"
5. **اطلب الأناقة** — elegance-pause في كل PR غير تافه
6. **تصحيح الأخطاء تلقائياً** — `/eo-debug` يجد السبب الجذري + regression test
7. **درجة + شحن** — 90+ مركّب أو لا تشحن

## سلسلة الأوامر اليومية (1-10)
| # | الأمر | متى | البوابة |
|---|-------|-----|---------|
| 1 | `/1-eo-dev-start` | مرة واحدة | موافقة plan mode |
| 2 | `/2-eo-dev-plan {story}` | بداية كل قصة | موافقة |
| 3 | `/3-eo-code` | بعد موافقة الخطة | الاختبارات تمر |
| 4 | `/4-eo-review` | بعد اخضرار الكود | لا عناصر 🔴 |
| 5 | `/5-eo-score` | بعد نظافة المراجعة | 90+ مركّب |
| 6 | `/6-eo-bridge-gaps` | درجة 80-89 | أدنى hat ≥ 8 |
| 7 | `/7-eo-ship` | درجة 90+ | فحص صحة 200 |
| 8 | `/eo-dev-repair` | scaffold انجرف | self-score ≥ 80 |
| 9 | `/eo-debug {bug}` | فشل اختبار/نشر | سبب جذري + regression test |
| 10 | `/8-eo-retro` | بعد شحن قصة | تحديث الدروس |

## بوابة الجودة
- لا PR بدون 90+ مركّب (محفوظ في `docs/qa-scores/`)
- لا hat أقل من 8
- elegance pause block في وصف الـ commit
- BRD traceability 100% للـ ACs المكتملة

## قواعد MENA (تُطبَّق دائماً — ICP الرياض)
- واجهة عربية أولاً، `dir="rtl"` مُحترَم في كل مكان
- خطوط: Cairo للعناوين، Tajawal للنص
- mobile 375px مُختبَر قبل hat UX ≥ 8
- تواريخ DD/MM/YYYY، عطلة جمعة/سبت
- عملة SAR (ريال سعودي) — لا USD في الواجهة
- أسماء عربية UTF-8 بدون تلف

## Voice (صوت المنتج)
- ابدأ بالنتيجة، مو بالميزة
- أرقام تثبت: "30 ثانية" لا "ردود سريعة"
- سياق خليجي: واتساب لا "messaging platform"
- لا مجاملات: لا leverage، ecosystem، holistic، cutting-edge

## متغيرات البيئة
انظر `.env.example`. لا تُودِع `.env.local` أبداً.

## النشر
- Server: ServerFast / Contabo
- PM2 process: cross-border-agent
- Command: `git pull && npm ci && npm run build && pm2 reload cross-border-agent`
- لا تعديل مباشر على الخادم. دائماً: local → GitHub → server pull.

## انضباط Git
- Branches: `main` (prod)، `dev` (integration)، `feat/*` (features)
- Conventional commits: feat/fix/docs/chore
- كل PR: elegance pause block، BRD ACs مُشار إليها، تقرير الدرجة مرفق
- لا تُودِع: `.env.local`، `node_modules/`، `.next/`، أسرار

## Session Bootstrap
الدروس في `.claude/lessons.md` تُحمَّل تلقائياً عبر SessionStart hook. اقرأها قبل كل خطة.

## عند التعثّر
1. راجع `.claude/lessons.md` — هل مررت بهذا من قبل؟
2. راجع `docs/qa-scores/trend.csv` — أي hat يفشل باستمرار؟
3. شغّل `/eo-debug` مع الخطأ المحدد
4. اسأل في مجتمع EO MicroSaaS

## Non-Negotiable
- لا كود بدون BRD
- لا شحن بدون 90+ درجة
- لا تصحيح خطأ بدون regression test
- لا dependency جديدة بدون bundle-size comment
- لا PR للواجهة بدون screenshots mobile + عربي

---
> Global playbook at `~/.claude/CLAUDE.md`. Project CLAUDE.md overrides global on conflict. Missing rules fall through to global.
> SaaSfast mode: M3 — Core stack | Payment: Stripe (MVP) → Tap (v2 Story 7) | Deploy: ServerFast/Contabo
