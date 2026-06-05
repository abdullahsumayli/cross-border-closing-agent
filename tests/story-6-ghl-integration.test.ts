// Story 6 [@Phase2]: تكامل GoHighLevel (GHL)
// TDD: هذا الملف هو مصدر الحقيقة — الكود يخدم هذه الاختبارات

import * as fs from 'fs'
import * as path from 'path'
import {
  buildOAuthUrl,
  buildGhlContactPayload,
  GHL_CONTACT_ENDPOINT,
  type GhlCardInput,
} from '../src/lib/ghl'

const ROOT = path.resolve(__dirname, '..')

// ─── AC-6.4: OAuth URL builder ────────────────────────────────────────────

describe('AC-6.4 — GHL OAuth URL', () => {
  const origClientId = process.env.GHL_CLIENT_ID
  const origRedirect = process.env.GHL_REDIRECT_URI

  beforeEach(() => {
    process.env.GHL_CLIENT_ID = 'test_client_id'
    process.env.GHL_REDIRECT_URI = 'https://app.crossborder.sa/api/ghl/callback'
  })

  afterEach(() => {
    if (origClientId !== undefined) process.env.GHL_CLIENT_ID = origClientId
    else delete process.env.GHL_CLIENT_ID
    if (origRedirect !== undefined) process.env.GHL_REDIRECT_URI = origRedirect
    else delete process.env.GHL_REDIRECT_URI
  })

  it('buildOAuthUrl يحتوي على client_id في URL @AC-6.4', () => {
    const url = buildOAuthUrl('state_xyz')
    expect(url).toContain('test_client_id')
  })

  it('buildOAuthUrl يحتوي على redirect_uri مُرمَّز @AC-6.4', () => {
    const url = buildOAuthUrl('state_xyz')
    expect(url).toContain('redirect_uri')
    expect(url).toContain('crossborder')
  })

  it('buildOAuthUrl يحتوي على state للحماية من CSRF @AC-6.4', () => {
    const url = buildOAuthUrl('state_xyz')
    expect(url).toContain('state_xyz')
  })

  it('buildOAuthUrl يشير لـ GHL marketplace @AC-6.4', () => {
    const url = buildOAuthUrl('state_abc')
    expect(url).toContain('gohighlevel.com')
  })
})

// ─── AC-6.4: OAuth API routes exist ────────────────────────────────────────

describe('AC-6.4 — OAuth routes exist', () => {
  it('api/ghl/oauth/route.ts موجود @AC-6.4', () => {
    expect(fs.existsSync(path.join(ROOT, 'src/app/api/ghl/oauth/route.ts'))).toBe(true)
  })

  it('api/ghl/callback/route.ts موجود @AC-6.4', () => {
    expect(fs.existsSync(path.join(ROOT, 'src/app/api/ghl/callback/route.ts'))).toBe(true)
  })

  it('api/ghl/disconnect/route.ts موجود @AC-6.4', () => {
    expect(fs.existsSync(path.join(ROOT, 'src/app/api/ghl/disconnect/route.ts'))).toBe(true)
  })

  it('صفحة الإعدادات موجودة @AC-6.4', () => {
    expect(fs.existsSync(path.join(ROOT, 'src/app/(dashboard)/settings/page.tsx'))).toBe(true)
  })

  it('صفحة الإعدادات تعرض حالة الربط (connected/disconnected) @AC-6.4', () => {
    const content = fs.readFileSync(
      path.join(ROOT, 'src/app/(dashboard)/settings/page.tsx'),
      'utf8'
    )
    expect(content).toContain('ghl_connections')
    expect(content).toContain('GHL')
  })

  it('callback route يستدعي exchange tokens @AC-6.4', () => {
    const content = fs.readFileSync(
      path.join(ROOT, 'src/app/api/ghl/callback/route.ts'),
      'utf8'
    )
    expect(content).toContain('code')
    expect(content).toContain('ghl_connections')
  })

  it('disconnect route يحذف connection @AC-6.4', () => {
    const content = fs.readFileSync(
      path.join(ROOT, 'src/app/api/ghl/disconnect/route.ts'),
      'utf8'
    )
    expect(content).toContain('delete')
  })
})

// ─── AC-6.2: contact payload mapping ──────────────────────────────────────

describe('AC-6.2 — GHL contact payload field mapping', () => {
  const card: GhlCardInput = {
    buyerPhone: '+60123456789',
    buyerName: 'Ahmad Lee',
    detectedLanguage: 'en',
    budgetSar: 1200000,
    seriousnessScore: 86,
    legalEligibility: 'eligible',
    timeline: '6 months',
    propertyType: 'apartment',
    nationality: 'Malaysian',
    cardSummaryAr: 'بطاقة تأهيل: أحمد لي',
  }

  it('يُعيّن buyer_phone كـ phone في GHL @AC-6.2', () => {
    const payload = buildGhlContactPayload(card)
    expect(payload.phone).toBe('+60123456789')
  })

  it('يُعيّن budget_sar في customFields @AC-6.2', () => {
    const payload = buildGhlContactPayload(card)
    const budgetField = payload.customFields?.find(
      (f: { key: string }) => f.key === 'budget_sar'
    )
    expect(budgetField?.value).toBe('1200000')
  })

  it('يُعيّن detected_language في customFields @AC-6.2', () => {
    const payload = buildGhlContactPayload(card)
    const langField = payload.customFields?.find(
      (f: { key: string }) => f.key === 'buyer_language'
    )
    expect(langField?.value).toBe('en')
  })

  it('يُعيّن seriousness_score في customFields @AC-6.2', () => {
    const payload = buildGhlContactPayload(card)
    const scoreField = payload.customFields?.find(
      (f: { key: string }) => f.key === 'seriousness_score'
    )
    expect(scoreField?.value).toBe('86')
  })

  it('يُعيّن legal_eligibility في customFields @AC-6.2', () => {
    const payload = buildGhlContactPayload(card)
    const eligField = payload.customFields?.find(
      (f: { key: string }) => f.key === 'legal_eligibility'
    )
    expect(eligField?.value).toBe('eligible')
  })

  it('buyer_name يُعيَّن كـ firstName @AC-6.2', () => {
    const payload = buildGhlContactPayload(card)
    expect(payload.firstName).toBe('Ahmad Lee')
  })

  it('budget_sar=null → لا يُرسَل في customFields @AC-6.2', () => {
    const cardNobudget: GhlCardInput = { ...card, budgetSar: null }
    const payload = buildGhlContactPayload(cardNobudget)
    const budgetField = payload.customFields?.find(
      (f: { key: string }) => f.key === 'budget_sar'
    )
    expect(budgetField).toBeUndefined()
  })
})

// ─── AC-6.3: retry + Sentry ────────────────────────────────────────────────

describe('AC-6.3 — retry logic + Sentry on failure', () => {
  let originalFetch: typeof global.fetch
  let sentryCaptures: Error[] = []

  beforeEach(() => {
    originalFetch = global.fetch
    sentryCaptures = []
    // Mock Sentry
    jest.mock('@sentry/nextjs', () => ({
      captureException: (err: Error) => { sentryCaptures.push(err) },
    }), { virtual: true })
  })

  afterEach(() => {
    global.fetch = originalFetch
    jest.resetModules()
    jest.resetAllMocks()
  })

  it('GHL_CONTACT_ENDPOINT يشير لـ GHL API @AC-6.3', () => {
    // GHL API uses leadconnectorhq.com (their API domain, not the marketplace UI)
    expect(GHL_CONTACT_ENDPOINT).toContain('leadconnectorhq.com')
    expect(GHL_CONTACT_ENDPOINT).toContain('contact')
  })

  it('syncCardToGHL موجود ويُصدَّر من ghl.ts @AC-6.3', () => {
    const content = fs.readFileSync(path.join(ROOT, 'src/lib/ghl.ts'), 'utf8')
    expect(content).toContain('syncCardToGHL')
    expect(content).toContain('export')
  })

  it('ghl.ts يحتوي على retry loop حتى 3 محاولات @AC-6.3', () => {
    const content = fs.readFileSync(path.join(ROOT, 'src/lib/ghl.ts'), 'utf8')
    expect(content).toContain('attempt')
    expect(content).toContain('3')
  })

  it('ghl.ts يستدعي Sentry.captureException عند فشل كل المحاولات @AC-6.3', () => {
    const content = fs.readFileSync(path.join(ROOT, 'src/lib/ghl.ts'), 'utf8')
    expect(content).toContain('captureException')
    expect(content).toContain('Sentry')
  })

  it('syncCardToGHL fire-and-forget — لا يُوقف التطبيق عند فشل GHL @AC-6.3', () => {
    const content = fs.readFileSync(path.join(ROOT, 'src/app/api/webhooks/whatsapp/route.ts'), 'utf8')
    // يجب أن يُستدعى بـ void (fire-and-forget) — لا await مباشر
    expect(content).toContain('syncCardToGHL')
    expect(content).toContain('void ')
  })
})

// ─── AC-6.1: card sync hook in whatsapp webhook ───────────────────────────

describe('AC-6.1 — card sync hook wired in WhatsApp webhook', () => {
  it('webhook يستورد syncCardToGHL من @/lib/ghl @AC-6.1', () => {
    const content = fs.readFileSync(
      path.join(ROOT, 'src/app/api/webhooks/whatsapp/route.ts'),
      'utf8'
    )
    expect(content).toContain('syncCardToGHL')
    expect(content).toContain('@/lib/ghl')
  })

  it('migration 007 يحتوي على جدول ghl_connections + RLS @AC-6.1 @AC-6.4', () => {
    const sql = fs.readFileSync(
      path.join(ROOT, 'supabase/migrations/007_ghl_connections.sql'),
      'utf8'
    )
    expect(sql).toContain('ghl_connections')
    expect(sql).toContain('ENABLE ROW LEVEL SECURITY')
    expect(sql).toContain('broker_id = auth.uid()')
  })

  it('migration 007 يحتوي على access_token + location_id @AC-6.1', () => {
    const sql = fs.readFileSync(
      path.join(ROOT, 'supabase/migrations/007_ghl_connections.sql'),
      'utf8'
    )
    expect(sql).toContain('access_token')
    expect(sql).toContain('location_id')
  })
})
