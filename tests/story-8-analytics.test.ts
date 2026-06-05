// Story 8 [@Phase2]: تحليلات وتقارير الوسيط
// TDD: هذا الملف مصدر الحقيقة — الكود يخدم هذه الاختبارات

import * as fs from 'fs'
import * as path from 'path'
import {
  computeMetrics,
  computePeriodBounds,
  QUALIFICATION_THRESHOLD,
  type AnalyticsLead,
} from '../src/lib/analytics'

const ROOT = path.resolve(__dirname, '..')

// ─── AC-8.1: computeMetrics — pure function ────────────────────────────────

describe('AC-8.1 — computeMetrics: صحة الأرقام', () => {
  it('0 leads → total=0, rate=0, avgResponse=null, alert=false @AC-8.1', () => {
    const result = computeMetrics([])
    expect(result.total).toBe(0)
    expect(result.qualifiedCount).toBe(0)
    expect(result.qualificationRate).toBe(0)
    expect(result.avgResponseHours).toBeNull()
    expect(result.alertTriggered).toBe(false)
  })

  it('3 qualified من 3 → rate=100 @AC-8.1', () => {
    const leads: AnalyticsLead[] = [
      { status: 'qualified', created_at: '2026-06-01T10:00:00Z', first_response_at: '2026-06-01T10:30:00Z' },
      { status: 'qualified', created_at: '2026-06-02T10:00:00Z', first_response_at: '2026-06-02T11:00:00Z' },
      { status: 'qualified', created_at: '2026-06-03T10:00:00Z', first_response_at: '2026-06-03T12:00:00Z' },
    ]
    const result = computeMetrics(leads)
    expect(result.total).toBe(3)
    expect(result.qualifiedCount).toBe(3)
    expect(result.qualificationRate).toBe(100)
  })

  it('1 qualified من 2 → rate=50 @AC-8.1', () => {
    const leads: AnalyticsLead[] = [
      { status: 'qualified', created_at: '2026-06-01T10:00:00Z', first_response_at: null },
      { status: 'unqualified', created_at: '2026-06-02T10:00:00Z', first_response_at: null },
    ]
    const result = computeMetrics(leads)
    expect(result.qualificationRate).toBe(50)
  })

  it('in_progress لا يُحسب qualified @AC-8.1', () => {
    const leads: AnalyticsLead[] = [
      { status: 'in_progress', created_at: '2026-06-01T10:00:00Z', first_response_at: null },
      { status: 'in_progress', created_at: '2026-06-02T10:00:00Z', first_response_at: null },
    ]
    const result = computeMetrics(leads)
    expect(result.qualifiedCount).toBe(0)
    expect(result.qualificationRate).toBe(0)
  })

  it('متوسط زمن الرد يُحسب بالساعات @AC-8.1', () => {
    // lead 1: 30 دقيقة = 0.5 ساعة, lead 2: 60 دقيقة = 1 ساعة → avg = 0.75
    const leads: AnalyticsLead[] = [
      { status: 'qualified', created_at: '2026-06-01T10:00:00Z', first_response_at: '2026-06-01T10:30:00Z' },
      { status: 'qualified', created_at: '2026-06-02T10:00:00Z', first_response_at: '2026-06-02T11:00:00Z' },
    ]
    const result = computeMetrics(leads)
    expect(result.avgResponseHours).toBeCloseTo(0.75, 1)
  })

  it('leads بدون first_response_at تُستبعَد من متوسط زمن الرد @AC-8.1', () => {
    const leads: AnalyticsLead[] = [
      { status: 'qualified', created_at: '2026-06-01T10:00:00Z', first_response_at: '2026-06-01T12:00:00Z' },
      { status: 'in_progress', created_at: '2026-06-02T10:00:00Z', first_response_at: null },
    ]
    const result = computeMetrics(leads)
    expect(result.avgResponseHours).toBeCloseTo(2, 1)
  })

  it('كل leads بدون first_response_at → avgResponseHours=null @AC-8.1', () => {
    const leads: AnalyticsLead[] = [
      { status: 'in_progress', created_at: '2026-06-01T10:00:00Z', first_response_at: null },
    ]
    const result = computeMetrics(leads)
    expect(result.avgResponseHours).toBeNull()
  })
})

// ─── AC-8.1: computePeriodBounds ───────────────────────────────────────────

describe('AC-8.1 — computePeriodBounds: نطاق الفترة الزمنية', () => {
  it('all → from=null, to=null @AC-8.1', () => {
    const { from, to } = computePeriodBounds('all')
    expect(from).toBeNull()
    expect(to).toBeNull()
  })

  it('week → from قبل 7 أيام، to اليوم @AC-8.1', () => {
    const before = Date.now()
    const { from, to } = computePeriodBounds('week')
    const after = Date.now()
    expect(from).not.toBeNull()
    expect(to).not.toBeNull()
    const fromMs = new Date(from!).getTime()
    const toMs = new Date(to!).getTime()
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000
    expect(toMs).toBeGreaterThanOrEqual(before)
    expect(toMs).toBeLessThanOrEqual(after + 1000)
    expect(toMs - fromMs).toBeCloseTo(sevenDaysMs, -4)
  })

  it('month → from قبل 30 يوم @AC-8.1', () => {
    const { from } = computePeriodBounds('month')
    expect(from).not.toBeNull()
    const diffDays = (Date.now() - new Date(from!).getTime()) / (1000 * 60 * 60 * 24)
    expect(diffDays).toBeCloseTo(30, 0)
  })

  it('from ISO string صالح @AC-8.1', () => {
    const { from } = computePeriodBounds('week')
    expect(isNaN(new Date(from!).getTime())).toBe(false)
  })
})

// ─── AC-8.3: qualification alert threshold ─────────────────────────────────

describe('AC-8.3 — تنبيه انخفاض معدل التأهيل', () => {
  it('QUALIFICATION_THRESHOLD = 50 @AC-8.3', () => {
    expect(QUALIFICATION_THRESHOLD).toBe(50)
  })

  it('rate < 50 → alertTriggered=true @AC-8.3', () => {
    const leads: AnalyticsLead[] = [
      { status: 'qualified', created_at: '2026-06-01T10:00:00Z', first_response_at: null },
      { status: 'unqualified', created_at: '2026-06-02T10:00:00Z', first_response_at: null },
      { status: 'unqualified', created_at: '2026-06-03T10:00:00Z', first_response_at: null },
    ]
    const result = computeMetrics(leads)
    expect(result.qualificationRate).toBeLessThan(50)
    expect(result.alertTriggered).toBe(true)
  })

  it('rate = 50 → alertTriggered=false (عتبة غير مُفعَّلة) @AC-8.3', () => {
    const leads: AnalyticsLead[] = [
      { status: 'qualified', created_at: '2026-06-01T10:00:00Z', first_response_at: null },
      { status: 'unqualified', created_at: '2026-06-02T10:00:00Z', first_response_at: null },
    ]
    const result = computeMetrics(leads)
    expect(result.qualificationRate).toBe(50)
    expect(result.alertTriggered).toBe(false)
  })

  it('rate > 50 → alertTriggered=false @AC-8.3', () => {
    const leads: AnalyticsLead[] = [
      { status: 'qualified', created_at: '2026-06-01T10:00:00Z', first_response_at: null },
      { status: 'qualified', created_at: '2026-06-02T10:00:00Z', first_response_at: null },
      { status: 'unqualified', created_at: '2026-06-03T10:00:00Z', first_response_at: null },
    ]
    const result = computeMetrics(leads)
    expect(result.alertTriggered).toBe(false)
  })

  it('0 leads → alertTriggered=false @AC-8.3', () => {
    expect(computeMetrics([]).alertTriggered).toBe(false)
  })
})

// ─── AC-8.1: API route ────────────────────────────────────────────────────

describe('AC-8.1 — API analytics/summary route', () => {
  it('src/app/api/analytics/summary/route.ts موجودة @AC-8.1', () => {
    expect(
      fs.existsSync(path.join(ROOT, 'src/app/api/analytics/summary/route.ts'))
    ).toBe(true)
  })

  it('route تستخدم cookie client (RLS) + leads table @AC-8.1', () => {
    const content = fs.readFileSync(
      path.join(ROOT, 'src/app/api/analytics/summary/route.ts'),
      'utf8'
    )
    expect(content).toContain('createClient')
    expect(content).toContain('leads')
  })

  it('route تُعيد 401 عند عدم المصادقة @AC-8.1', () => {
    const content = fs.readFileSync(
      path.join(ROOT, 'src/app/api/analytics/summary/route.ts'),
      'utf8'
    )
    expect(content).toContain('401')
  })

  it('route تدعم period param @AC-8.1', () => {
    const content = fs.readFileSync(
      path.join(ROOT, 'src/app/api/analytics/summary/route.ts'),
      'utf8'
    )
    expect(content).toContain('period')
  })
})

// ─── AC-8.2: PDF export ───────────────────────────────────────────────────

describe('AC-8.2 — تصدير PDF عبر browser print', () => {
  it('dashboard page تحتوي على print @AC-8.2', () => {
    const content = fs.readFileSync(
      path.join(ROOT, 'src/app/(dashboard)/page.tsx'),
      'utf8'
    )
    expect(content.toLowerCase()).toContain('print')
  })
})

// ─── AC-8.1: dashboard page real data ────────────────────────────────────

describe('AC-8.1 — dashboard page real data (L-004)', () => {
  it('dashboard page يستخدم createClient مباشرة @AC-8.1', () => {
    const content = fs.readFileSync(
      path.join(ROOT, 'src/app/(dashboard)/page.tsx'),
      'utf8'
    )
    expect(content).toContain('createClient')
    expect(content).toContain('leads')
  })

  it('dashboard page تعرض KPI: استفسارات + تأهيل + زمن الرد @AC-8.1', () => {
    const content = fs.readFileSync(
      path.join(ROOT, 'src/app/(dashboard)/page.tsx'),
      'utf8'
    )
    expect(content).toContain('الاستفسارات')
    expect(content).toContain('التأهيل')
    expect(content).toContain('زمن الرد')
  })

  it('dashboard page يدعم period filter عبر searchParams @AC-8.1', () => {
    const content = fs.readFileSync(
      path.join(ROOT, 'src/app/(dashboard)/page.tsx'),
      'utf8'
    )
    expect(content).toContain('searchParams')
    expect(content).toContain('period')
  })

  it('dashboard page يعرض alert عند alertTriggered @AC-8.3', () => {
    const content = fs.readFileSync(
      path.join(ROOT, 'src/app/(dashboard)/page.tsx'),
      'utf8'
    )
    expect(content).toContain('alertTriggered')
    expect(content).toContain('role="alert"')
  })
})
