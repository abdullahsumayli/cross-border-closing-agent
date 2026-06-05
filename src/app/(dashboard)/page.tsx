// AC-8.1, AC-8.2, AC-8.3: Analytics dashboard — Server Component (L-004 direct Supabase)
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { computeMetrics, computePeriodBounds, QUALIFICATION_THRESHOLD, type AnalyticsPeriod } from '@/lib/analytics'
import PrintButton from '@/components/PrintButton'

const PERIODS: { value: AnalyticsPeriod; label: string }[] = [
  { value: 'week', label: 'آخر 7 أيام' },
  { value: 'month', label: 'آخر 30 يوم' },
  { value: 'all', label: 'كل الوقت' },
]

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const rawPeriod = params.period ?? 'month'
  const period: AnalyticsPeriod = ['week', 'month', 'all'].includes(rawPeriod)
    ? (rawPeriod as AnalyticsPeriod)
    : 'month'

  const { from, to } = computePeriodBounds(period)

  let query = supabase
    .from('leads')
    .select('status, created_at, first_response_at')
    .eq('broker_id', user.id)

  if (from) query = query.gte('created_at', from)
  if (to) query = query.lte('created_at', to)

  const { data: leads } = await query
  const metrics = computeMetrics(leads ?? [])

  const kpis = [
    { label: 'الاستفسارات', value: String(metrics.total), accent: false },
    { label: 'نسبة التأهيل', value: metrics.total > 0 ? `${metrics.qualificationRate}%` : '—', accent: true },
    { label: 'متوسط زمن الرد', value: metrics.avgResponseHours != null ? `${metrics.avgResponseHours.toFixed(1)} س` : '—', accent: false },
    { label: 'ليدات جاهزة', value: String(metrics.qualifiedCount), accent: true },
  ]

  return (
    <div dir="rtl" style={{ fontFamily: 'Cairo, Tajawal, sans-serif' }}>
      {/* Print-only header */}
      <style>{`
        @media print {
          nav, aside, .no-print { display: none !important; }
          .print-header { display: block !important; }
          body { background: white; color: black; }
        }
        .print-header { display: none; }
      `}</style>

      <div className="print-header">
        <h2 style={{ fontSize: 18, marginBottom: 8 }}>تقرير أداء المكتب</h2>
        <p style={{ fontSize: 13, color: '#64748B' }}>
          الفترة: {PERIODS.find(p => p.value === period)?.label} — {new Date().toLocaleDateString('en-GB')}
        </p>
      </div>

      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, margin: 0, color: '#E2E8F0' }}>أداء المكتب</h1>
        <div className="no-print" style={{ display: 'flex', gap: 8 }}>
          <PrintButton />
        </div>
      </div>

      {/* AC-8.3: qualification rate alert */}
      {metrics.alertTriggered && (
        <div
          role="alert"
          style={{
            background: '#7F1D1D',
            border: '1px solid #F87171',
            borderRadius: 8,
            padding: '12px 16px',
            marginBottom: 20,
            fontSize: 14,
            color: '#FCA5A5',
          }}
        >
          ⚠️ نسبة التأهيل انخفضت تحت {QUALIFICATION_THRESHOLD}% في هذه الفترة — راجع جودة الاستفسارات الواردة
        </div>
      )}

      {/* Period tabs */}
      <div className="no-print" style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {PERIODS.map(({ value, label }) => (
          <a
            key={value}
            href={`/dashboard?period=${value}`}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              fontSize: 13,
              textDecoration: 'none',
              fontFamily: 'inherit',
              background: period === value ? '#0D4A40' : '#1E293B',
              color: period === value ? '#5EEAD4' : '#94A3B8',
              border: `1px solid ${period === value ? '#5EEAD4' : '#334155'}`,
            }}
          >
            {label}
          </a>
        ))}
      </div>

      {/* KPI cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 12,
          marginBottom: 24,
        }}
      >
        {kpis.map(({ label, value, accent }) => (
          <div
            key={label}
            style={{ background: '#1E293B', borderRadius: 12, padding: 16 }}
          >
            <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: accent ? '#5EEAD4' : '#E2E8F0' }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Quick link */}
      <div
        className="no-print"
        style={{ background: '#1E293B', borderRadius: 12, padding: 16, fontSize: 14, color: '#94A3B8' }}
      >
        <a href="/dashboard/leads" style={{ color: '#5EEAD4', textDecoration: 'none' }}>
          عرض كل الاستفسارات ←
        </a>
      </div>
    </div>
  )
}
