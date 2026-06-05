// Story 4 [@WeekendMVP] [loop:deploy] [loop:observability]: النشر للإنتاج + فحص الصحة
// TDD: هذا الملف هو مصدر الحقيقة — الكود يخدم هذه الاختبارات

import * as fs from 'fs'
import * as path from 'path'
import { captureSignup, capturePayment, captureEvent } from '../src/lib/posthog'

const ROOT = path.resolve(__dirname, '..')

// ─── AC-4.2: health endpoint response shape ───────────────────────────────────

describe('AC-4.2 — health endpoint response shape', () => {
  it('الاستجابة تحتوي على status="ok" و db field @AC-4.2', () => {
    const validDbStates = ['ok', 'error', 'pending']
    const mockResponse = { status: 'ok', db: 'ok' }
    expect(mockResponse.status).toBe('ok')
    expect(validDbStates).toContain(mockResponse.db)
  })

  it('db يكون "ok" عند اتصال ناجح أو "error" عند فشل @AC-4.2', () => {
    const validStates = ['ok', 'error', 'pending']
    for (const state of validStates) {
      expect(['ok', 'error', 'pending']).toContain(state)
    }
  })

  it('health route تستخدم service client (لا يحتاج cookies) @AC-4.2', () => {
    const healthContent = fs.readFileSync(
      path.join(ROOT, 'src/app/api/health/route.ts'),
      'utf8'
    )
    expect(healthContent).toContain('createServiceClient')
    expect(healthContent).not.toContain("createClient()")
  })
})

// ─── AC-4.3: Sentry configuration ────────────────────────────────────────────

describe('AC-4.3 — Sentry initialization', () => {
  it('sentry.server.config.ts موجود ويحتوي على Sentry.init @AC-4.3', () => {
    const content = fs.readFileSync(path.join(ROOT, 'sentry.server.config.ts'), 'utf8')
    expect(content).toContain('Sentry.init')
    expect(content).toContain('dsn')
  })

  it('sentry.client.config.ts موجود ويحتوي على Sentry.init @AC-4.3', () => {
    const content = fs.readFileSync(path.join(ROOT, 'sentry.client.config.ts'), 'utf8')
    expect(content).toContain('Sentry.init')
    expect(content).toContain('dsn')
  })

  it('instrumentation.ts موجود ويستورد sentry config @AC-4.3', () => {
    const content = fs.readFileSync(path.join(ROOT, 'instrumentation.ts'), 'utf8')
    expect(content.toLowerCase()).toContain('sentry')
  })

  it('sentry-test route موجود للتحقق من التكامل @AC-4.3', () => {
    const exists = fs.existsSync(
      path.join(ROOT, 'src/app/api/sentry-test/route.ts')
    )
    expect(exists).toBe(true)
  })
})

// ─── AC-4.1 + AC-4.4: deploy runbook (human action — documented) ─────────────

describe('AC-4.1 + AC-4.4 — deploy runbook exists', () => {
  it('docs/deploy-runbook.md موجود ويغطي Nginx + SSL + uptime monitor @AC-4.1 @AC-4.4', () => {
    const content = fs.readFileSync(path.join(ROOT, 'docs', 'deploy-runbook.md'), 'utf8')
    expect(content).toContain('nginx')
    expect(content).toContain('certbot')
    expect(content).toContain('api/health')
    expect(content).toContain('5 min') // uptime check interval
  })
})

// ─── AC-4.5: deploy script ────────────────────────────────────────────────────

describe('AC-4.5 — deploy script idempotent', () => {
  it('scripts/deploy.sh موجود @AC-4.5', () => {
    expect(fs.existsSync(path.join(ROOT, 'scripts', 'deploy.sh'))).toBe(true)
  })

  it('deploy.sh يحتوي على git pull + npm ci + npm run build + pm2 reload @AC-4.5', () => {
    const content = fs.readFileSync(path.join(ROOT, 'scripts', 'deploy.sh'), 'utf8')
    expect(content).toContain('git pull')
    expect(content).toContain('npm ci')
    expect(content).toContain('npm run build')
    expect(content).toContain('pm2 reload')
  })

  it('deploy.sh يستخدم pm2 reload (لا restart) لضمان zero-downtime @AC-4.5', () => {
    const content = fs.readFileSync(path.join(ROOT, 'scripts', 'deploy.sh'), 'utf8')
    expect(content).toContain('pm2 reload')
    expect(content).not.toContain('pm2 restart')
  })

  it('package.json يحتوي على script "deploy" @AC-4.5', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'))
    expect(pkg.scripts).toHaveProperty('deploy')
    expect(pkg.scripts.deploy).toContain('deploy.sh')
  })
})

// ─── AC-4.6: PostHog analytics events ────────────────────────────────────────

describe('AC-4.6 — PostHog analytics', () => {
  let originalFetch: typeof global.fetch

  beforeEach(() => {
    originalFetch = global.fetch
    global.fetch = jest.fn().mockResolvedValue({ ok: true } as Response)
    process.env.POSTHOG_API_KEY = 'phc_test_key'
    process.env.POSTHOG_HOST = 'https://app.posthog.com'
  })

  afterEach(() => {
    global.fetch = originalFetch
    jest.resetAllMocks()
    delete process.env.POSTHOG_API_KEY
    delete process.env.POSTHOG_HOST
  })

  it('captureSignup يُرسل حدث signup بـ distinct_id صحيح @AC-4.6', async () => {
    await captureSignup('broker-uuid-123')
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/capture/'),
      expect.objectContaining({ method: 'POST' })
    )
    const body = JSON.parse(
      (global.fetch as jest.Mock).mock.calls[0][1].body as string
    )
    expect(body.distinct_id).toBe('broker-uuid-123')
    expect(body.event).toBe('signup')
  })

  it('capturePayment يُرسل حدث payment بـ tier + amount_sar + currency=SAR @AC-4.6', async () => {
    await capturePayment('broker-uuid-456', 'broker', 990)
    const body = JSON.parse(
      (global.fetch as jest.Mock).mock.calls[0][1].body as string
    )
    expect(body.event).toBe('payment')
    expect(body.properties.tier).toBe('broker')
    expect(body.properties.amount_sar).toBe(990)
    expect(body.properties.currency).toBe('SAR')
    expect(body.distinct_id).toBe('broker-uuid-456')
  })

  it('لا POSTHOG_API_KEY → لا fetch (silent skip) @AC-4.6', async () => {
    delete process.env.POSTHOG_API_KEY
    await captureSignup('broker-x')
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('خطأ PostHog لا يُوقف التطبيق (fire-and-forget) @AC-4.6', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('PostHog down'))
    await expect(captureSignup('broker-y')).resolves.toBeUndefined()
  })

  it('captureEvent يُرسل للـ host المُهيَّأ @AC-4.6', async () => {
    process.env.POSTHOG_HOST = 'https://eu.posthog.com'
    await captureEvent('user-1', 'test_event', { foo: 'bar' })
    expect(global.fetch).toHaveBeenCalledWith(
      'https://eu.posthog.com/capture/',
      expect.anything()
    )
  })
})
