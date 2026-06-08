'use client'

// Story 11 AC-11.1 / AC-11.2: show tiers (incl. free) + instant upgrade.
import { useState } from 'react'
import { PLANS, PLAN_TIERS, type PlanTier } from '@/lib/plans'

function limitLabel(n: number) {
  return n === -1 ? 'غير محدود' : String(n)
}

export default function PlansPage() {
  const [busy, setBusy] = useState<PlanTier | null>(null)
  const [active, setActive] = useState<PlanTier | null>(null)

  async function upgrade(tier: PlanTier) {
    setBusy(tier)
    try {
      const res = await fetch('/api/subscription/upgrade', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tier }),
      })
      if (res.ok) setActive(tier)
    } finally {
      setBusy(null)
    }
  }

  return (
    <main style={{ maxWidth: 880, margin: '0 auto', padding: '24px 16px' }}>
      <h1 style={{ fontFamily: 'Cairo, sans-serif', fontSize: 24, fontWeight: 700, marginBottom: 4 }}>الباقات</h1>
      <p style={{ color: '#64748B', marginBottom: 24 }}>ابدأ مجاناً، ورقِّ في أي لحظة — الحدود تتحدّث فوراً.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        {PLAN_TIERS.map((tier) => {
          const p = PLANS[tier]
          const isActive = active === tier
          return (
            <article key={tier} style={{
              border: isActive ? '2px solid #0F766E' : '1px solid #E2E8F0', borderRadius: 12, padding: 16,
              display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              <div style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: 18 }}>{p.nameAr}</div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>
                {p.priceSar === 0 ? 'مجاني' : `${p.priceSar} ريال`}<span style={{ fontSize: 12, color: '#64748B' }}> / شهر</span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0', display: 'grid', gap: 4, color: '#334155', fontSize: 14 }}>
                <li>العقارات: {limitLabel(p.maxProperties)}</li>
                <li>المنصات: {limitLabel(p.maxChannels)}</li>
                <li>الاستفسارات المؤهّلة: {limitLabel(p.maxQualifiedLeads)}</li>
              </ul>
              <button
                onClick={() => upgrade(tier)}
                disabled={busy === tier || isActive}
                style={{
                  marginTop: 'auto', background: isActive ? '#94A3B8' : '#0F766E', color: '#fff',
                  padding: '10px 16px', borderRadius: 8, fontWeight: 700, border: 'none',
                  opacity: busy === tier ? 0.6 : 1,
                }}
              >
                {isActive ? 'باقتك الحالية' : busy === tier ? 'جارٍ…' : tier === 'free' ? 'ابدأ مجاناً' : 'رقِّ الآن'}
              </button>
            </article>
          )
        })}
      </div>
    </main>
  )
}
