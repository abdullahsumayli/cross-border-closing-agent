// AC-6.4: Settings page — GHL integration status (Server Component, L-004 direct Supabase)
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ ghl?: string; reason?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: connection } = await supabase
    .from('ghl_connections')
    .select('location_id, created_at')
    .eq('broker_id', user.id)
    .maybeSingle()

  const params = await searchParams
  const ghlStatus = params.ghl
  const ghlReason = params.reason

  const isConnected = !!connection

  return (
    <div dir="rtl" style={{ fontFamily: 'Cairo, Tajawal, sans-serif', maxWidth: 600 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#E2E8F0', marginBottom: 24 }}>
        الإعدادات
      </h1>

      {/* GHL Connection Card */}
      <div
        style={{
          background: '#1E293B',
          borderRadius: 12,
          padding: 24,
          border: isConnected ? '1px solid #5EEAD4' : '1px solid #334155',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <span style={{ fontSize: 20 }}>🔗</span>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#E2E8F0', margin: 0 }}>
            GoHighLevel CRM (GHL)
          </h2>
          <span
            style={{
              fontSize: 12,
              padding: '3px 10px',
              borderRadius: 20,
              background: isConnected ? '#0D3D36' : '#1E293B',
              color: isConnected ? '#5EEAD4' : '#64748B',
              border: `1px solid ${isConnected ? '#5EEAD4' : '#475569'}`,
            }}
          >
            {isConnected ? 'متصل' : 'غير متصل'}
          </span>
        </div>

        <p style={{ fontSize: 14, color: '#94A3B8', marginBottom: 20 }}>
          {isConnected
            ? `تم الربط بـ Location: ${connection.location_id}`
            : 'اربط حساب GHL لمزامنة بطاقات التأهيل تلقائياً مع CRM الخاص بك.'}
        </p>

        {/* Status messages */}
        {ghlStatus === 'connected' && (
          <p style={{ fontSize: 13, color: '#5EEAD4', marginBottom: 16 }}>
            ✅ تم الربط بنجاح
          </p>
        )}
        {ghlStatus === 'error' && (
          <p style={{ fontSize: 13, color: '#F87171', marginBottom: 16 }}>
            ❌ فشل الربط{ghlReason ? ` (${ghlReason})` : ''} — حاول مجدداً
          </p>
        )}

        {/* Action buttons */}
        {isConnected ? (
          <form action="/api/ghl/disconnect" method="POST">
            <button
              type="submit"
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                fontSize: 14,
                fontFamily: 'inherit',
                background: '#7F1D1D',
                color: '#FCA5A5',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              قطع الاتصال
            </button>
          </form>
        ) : (
          <a
            href="/api/ghl/oauth"
            style={{
              display: 'inline-block',
              padding: '10px 20px',
              borderRadius: 8,
              fontSize: 14,
              fontFamily: 'inherit',
              background: '#0D4A40',
              color: '#5EEAD4',
              textDecoration: 'none',
              border: '1px solid #5EEAD4',
            }}
          >
            ربط GHL
          </a>
        )}
      </div>
    </div>
  )
}
