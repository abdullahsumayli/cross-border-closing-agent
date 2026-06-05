'use client'

// AC-5.1: leads list with status/lang/date filters + CSV export link
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatLeadStatus, formatLanguage } from '@/lib/leads'

interface Lead {
  id: string
  buyer_name: string | null
  buyer_phone: string
  detected_language: string | null
  status: string
  budget_sar: number | null
  seriousness_score: number | null
  created_at: string
}

const STATUS_OPTIONS = [
  { value: '', label: 'كل الحالات' },
  { value: 'qualified', label: 'مؤهَّل' },
  { value: 'unqualified', label: 'غير مؤهَّل' },
  { value: 'in_progress', label: 'قيد التأهيل' },
]

const LANG_OPTIONS = [
  { value: '', label: 'كل اللغات' },
  { value: 'en', label: 'إنجليزي' },
  { value: 'zh', label: 'صيني' },
  { value: 'ms', label: 'ملايو' },
  { value: 'ur', label: 'أردو' },
  { value: 'ar', label: 'عربي' },
]

const STATUS_COLOR: Record<string, string> = {
  qualified: '#5EEAD4',
  unqualified: '#94A3B8',
  in_progress: '#FBBF24',
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [lang, setLang] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)
  const [error, setError] = useState('')

  useEffect(() => {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    if (lang) params.set('lang', lang)
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    params.set('page', String(page))

    setLoading(true)
    fetch(`/api/leads?${params}`)
      .then(r => r.json())
      .then(data => {
        setLeads(data.leads ?? [])
        setTotal(data.total ?? 0)
        setError('')
      })
      .catch(() => setError('فشل تحميل الاستفسارات'))
      .finally(() => setLoading(false))
  }, [status, lang, from, to, page])

  const exportParams = new URLSearchParams()
  if (status) exportParams.set('status', status)
  if (lang) exportParams.set('lang', lang)
  if (from) exportParams.set('from', from)
  if (to) exportParams.set('to', to)

  const selectStyle = {
    background: '#1E293B',
    color: '#E2E8F0',
    border: '1px solid #334155',
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: 13,
    fontFamily: 'Cairo, Tajawal, sans-serif',
    cursor: 'pointer',
  }

  const inputStyle = {
    ...selectStyle,
    width: 140,
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 18, margin: 0 }}>الاستفسارات ({total})</h1>
        <a
          href={`/api/leads/export?${exportParams}`}
          download
          style={{
            background: '#0D9488',
            color: '#fff',
            padding: '8px 16px',
            borderRadius: 8,
            textDecoration: 'none',
            fontSize: 13,
            fontFamily: 'inherit',
          }}
        >
          تصدير CSV
        </a>
      </div>

      {/* filters */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <select
          value={status}
          onChange={e => { setStatus(e.target.value); setPage(1) }}
          style={selectStyle}
          aria-label="فلتر الحالة"
        >
          {STATUS_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <select
          value={lang}
          onChange={e => { setLang(e.target.value); setPage(1) }}
          style={selectStyle}
          aria-label="فلتر اللغة"
        >
          {LANG_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <input
          type="date"
          value={from}
          onChange={e => { setFrom(e.target.value); setPage(1) }}
          style={inputStyle}
          aria-label="من تاريخ"
        />
        <input
          type="date"
          value={to}
          onChange={e => { setTo(e.target.value); setPage(1) }}
          style={inputStyle}
          aria-label="إلى تاريخ"
        />
      </div>

      {error && (
        <div role="alert" style={{ color: '#F87171', marginBottom: 12, fontSize: 13 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ color: '#64748B', padding: '24px 0' }}>جاري التحميل…</div>
      ) : leads.length === 0 ? (
        <div style={{ color: '#64748B', padding: '24px 0', textAlign: 'center' }}>
          لا توجد استفسارات تطابق الفلاتر المحددة
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {leads.map(lead => (
            <Link
              key={lead.id}
              href={`/dashboard/leads/${lead.id}`}
              style={{
                background: '#1E293B',
                borderRadius: 10,
                padding: '14px 16px',
                textDecoration: 'none',
                color: 'inherit',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              {/* row 1: dot + name + status */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', flexWrap: 'wrap' }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: STATUS_COLOR[lead.status] ?? '#64748B',
                    flexShrink: 0,
                  }}
                />
                <span style={{ flex: 1, fontSize: 14, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {lead.buyer_name ?? lead.buyer_phone}
                </span>
                <span style={{ fontSize: 12, color: STATUS_COLOR[lead.status] ?? '#94A3B8', flexShrink: 0 }}>
                  {formatLeadStatus(lead.status)}
                </span>
              </div>
              {/* row 2: meta — lang + budget + date */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', paddingRight: 18 }}>
                <span style={{ fontSize: 11, color: '#94A3B8' }}>
                  {formatLanguage(lead.detected_language ?? '')}
                </span>
                {lead.budget_sar != null && (
                  <span style={{ fontSize: 11, color: '#94A3B8' }}>
                    {lead.budget_sar.toLocaleString('en-US')} ريال
                  </span>
                )}
                <span style={{ fontSize: 11, color: '#475569' }}>
                  {new Date(lead.created_at).toLocaleDateString('en-GB')}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* pagination */}
      {total > 20 && (
        <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'center' }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              ...selectStyle,
              opacity: page === 1 ? 0.4 : 1,
              cursor: page === 1 ? 'default' : 'pointer',
            }}
          >
            السابق
          </button>
          <span style={{ padding: '8px 12px', fontSize: 13, color: '#94A3B8' }}>
            {page} / {Math.ceil(total / 20)}
          </span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page * 20 >= total}
            style={{
              ...selectStyle,
              opacity: page * 20 >= total ? 0.4 : 1,
              cursor: page * 20 >= total ? 'default' : 'pointer',
            }}
          >
            التالي
          </button>
        </div>
      )}
    </div>
  )
}
