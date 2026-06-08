'use client'

// Story 10 AC-10.1 / AC-10.2: select target platforms + publish in one click,
// then watch per-channel status.
import { useState, useEffect, use } from 'react'

const CHANNELS = [
  { name: 'properstar', label: 'Properstar (شبكة 100+ منصة)' },
  { name: 'themovechannel', label: 'TheMoveChannel' },
  { name: 'rightmove_overseas', label: 'Rightmove Overseas' },
  { name: 'juwai', label: 'Juwai (الصين)' },
  { name: 'jamesedition', label: 'JamesEdition (فاخر)' },
  { name: 'bayut', label: 'Bayut.sa' },
]

const STATUS_COLOR: Record<string, string> = {
  published: '#16A34A', failed: '#DC2626', pending: '#FBBF24', removed: '#94A3B8',
}

interface Dist { channel_name: string; status: string; retry_count: number; error: string | null }

export default function DistributePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [selected, setSelected] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [rows, setRows] = useState<Dist[]>([])

  async function loadStatus() {
    const res = await fetch(`/api/properties/${id}/distribute`)
    if (res.ok) setRows((await res.json()).distributions ?? [])
  }
  useEffect(() => { loadStatus() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (name: string) =>
    setSelected((s) => (s.includes(name) ? s.filter((x) => x !== name) : [...s, name]))

  async function publish() {
    setBusy(true)
    try {
      await fetch(`/api/properties/${id}/distribute`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channels: selected, language: 'en' }),
      })
      await loadStatus()
    } finally {
      setBusy(false)
    }
  }

  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px' }}>
      <h1 style={{ fontFamily: 'Cairo, sans-serif', fontSize: 24, fontWeight: 700 }}>توزيع الإعلان عالمياً</h1>
      <p style={{ color: '#64748B', marginBottom: 20 }}>اختر المنصات وانشر بضغطة واحدة.</p>

      <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
        {CHANNELS.map((c) => (
          <label key={c.name} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: 10, border: '1px solid #E2E8F0', borderRadius: 8 }}>
            <input type="checkbox" checked={selected.includes(c.name)} onChange={() => toggle(c.name)} />
            <span>{c.label}</span>
          </label>
        ))}
      </div>

      <button
        onClick={publish}
        disabled={busy || selected.length === 0}
        style={{ background: '#0F766E', color: '#fff', padding: '12px 20px', borderRadius: 8, fontWeight: 700, border: 'none', opacity: busy || selected.length === 0 ? 0.6 : 1 }}
      >
        {busy ? 'جارٍ النشر…' : `انشر إلى ${selected.length} منصة`}
      </button>

      {rows.length > 0 && (
        <section style={{ marginTop: 28 }}>
          <h2 style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700, marginBottom: 8 }}>حالة النشر</h2>
          <div style={{ display: 'grid', gap: 6 }}>
            {rows.map((r) => (
              <div key={r.channel_name} style={{ display: 'flex', justifyContent: 'space-between', padding: 10, border: '1px solid #E2E8F0', borderRadius: 8 }}>
                <span>{r.channel_name}</span>
                <span style={{ color: STATUS_COLOR[r.status] ?? '#334155', fontWeight: 700 }}>
                  {r.status}{r.retry_count > 0 ? ` (${r.retry_count}↻)` : ''}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
