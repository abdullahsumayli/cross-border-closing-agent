// AC-5.1: dashboard home — KPI cards + recent leads feed
export default async function DashboardPage() {
  return (
    <div>
      <h1 style={{ fontSize: 20, margin: '0 0 20px', color: '#E2E8F0' }}>
        أداء المكتب
      </h1>

      {/* KPI cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 12,
          marginBottom: 24,
        }}
      >
        {[
          { label: 'الاستفسارات', value: '—' },
          { label: 'نسبة التأهيل', value: '—', accent: true },
          { label: 'متوسط زمن الرد', value: '—' },
          { label: 'ليدات جاهزة', value: '—', accent: true },
        ].map(({ label, value, accent }) => (
          <div
            key={label}
            style={{
              background: '#1E293B',
              borderRadius: 12,
              padding: 16,
            }}
          >
            <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 6 }}>{label}</div>
            <div
              style={{
                fontSize: 26,
                fontWeight: 700,
                color: accent ? '#5EEAD4' : '#E2E8F0',
              }}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* quick link to leads */}
      <div
        style={{
          background: '#1E293B',
          borderRadius: 12,
          padding: 16,
          color: '#94A3B8',
          fontSize: 14,
        }}
      >
        <a
          href="/dashboard/leads"
          style={{ color: '#5EEAD4', textDecoration: 'none' }}
        >
          عرض كل الاستفسارات ←
        </a>
      </div>
    </div>
  )
}
