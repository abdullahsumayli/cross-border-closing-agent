// AC-5.2: lead detail — full conversation timeline + qualification card
// Direct Supabase query (no self-referencing HTTP call)

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatLeadStatus, formatLanguage } from '@/lib/leads'

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [leadRes, convsRes, cardRes] = await Promise.all([
    supabase.from('leads').select('*').eq('id', id).single(),
    supabase
      .from('conversations')
      .select('*')
      .eq('lead_id', id)
      .order('created_at', { ascending: true }),
    supabase.from('qualification_cards').select('*').eq('lead_id', id).maybeSingle(),
  ])

  if (leadRes.error || !leadRes.data) notFound()

  const lead = leadRes.data
  const conversations = convsRes.data ?? []
  const card = cardRes.data ?? null

  return (
    <div style={{ maxWidth: 720 }}>
      {/* breadcrumb */}
      <div style={{ fontSize: 12, color: '#64748B', marginBottom: 16 }}>
        <Link href="/dashboard/leads" style={{ color: '#5EEAD4', textDecoration: 'none' }}>
          الاستفسارات
        </Link>
        {' ← '}
        {lead.buyer_name ?? lead.buyer_phone}
      </div>

      {/* lead header */}
      <div style={{ background: '#1E293B', borderRadius: 12, padding: 20, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontSize: 18, margin: '0 0 4px' }}>
              {lead.buyer_name ?? lead.buyer_phone}
            </h2>
            <p style={{ fontSize: 13, color: '#94A3B8', margin: 0 }}>{lead.buyer_phone}</p>
          </div>
          <span
            style={{
              fontSize: 12,
              padding: '4px 10px',
              borderRadius: 20,
              background:
                lead.status === 'qualified' ? '#0D948833'
                : lead.status === 'unqualified' ? '#33415533'
                : '#D9770633',
              color:
                lead.status === 'qualified' ? '#5EEAD4'
                : lead.status === 'unqualified' ? '#94A3B8'
                : '#FBBF24',
            }}
          >
            {formatLeadStatus(lead.status)}
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: 12,
            marginTop: 16,
          }}
        >
          {[
            ['اللغة', formatLanguage(lead.detected_language ?? '')],
            ['الجنسية', lead.nationality ?? '—'],
            ['الميزانية', lead.budget_sar ? `${lead.budget_sar.toLocaleString('en-US')} ريال` : '—'],
            ['درجة الجدية', lead.seriousness_score != null ? `${lead.seriousness_score}/100` : '—'],
            ['تاريخ الاستفسار', new Date(lead.created_at).toLocaleDateString('en-GB')],
          ].map(([label, value]) => (
            <div key={label}>
              <div style={{ fontSize: 11, color: '#64748B', marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 13 }}>{value}</div>
            </div>
          ))}
        </div>

        {lead.unqualified_reason && (
          <div
            style={{
              marginTop: 12,
              padding: 12,
              background: '#0F172A',
              borderRadius: 8,
              fontSize: 13,
              color: '#94A3B8',
            }}
          >
            سبب عدم التأهيل: {lead.unqualified_reason}
          </div>
        )}
      </div>

      {/* qualification card */}
      {card && (
        <div style={{ background: '#1E293B', borderRadius: 12, padding: 20, marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, margin: '0 0 12px', color: '#5EEAD4' }}>بطاقة التأهيل</h3>
          <p style={{ fontSize: 14, lineHeight: 1.7, color: '#CBD5E1', margin: 0 }}>
            {card.card_summary_ar}
          </p>
          {card.delivered_to_broker && (
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 8 }}>✓ أُرسلت للوسيط عبر واتساب</div>
          )}
        </div>
      )}

      {/* conversation timeline */}
      <div style={{ background: '#1E293B', borderRadius: 12, padding: 20 }}>
        <h3 style={{ fontSize: 15, margin: '0 0 16px' }}>سجل المحادثة ({conversations.length} رسالة)</h3>
        {conversations.length === 0 ? (
          <p style={{ color: '#64748B', fontSize: 13 }}>لا توجد رسائل</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {conversations.map((msg: { id: string; direction: string; message_text: string | null; created_at: string }) => {
              const isInbound = msg.direction === 'inbound'
              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isInbound ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div
                    style={{
                      maxWidth: '80%',
                      padding: '10px 14px',
                      borderRadius: isInbound ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                      background: isInbound ? '#0D9488' : '#334155',
                      fontSize: 13,
                      lineHeight: 1.6,
                    }}
                  >
                    {msg.message_text ?? '—'}
                  </div>
                  <div style={{ fontSize: 11, color: '#475569', marginTop: 3 }}>
                    {isInbound ? 'المشتري (inbound)' : 'الوكيل (outbound)'} ·{' '}
                    {new Date(msg.created_at).toLocaleTimeString('en-GB', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
