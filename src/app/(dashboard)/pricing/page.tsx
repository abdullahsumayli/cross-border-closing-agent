'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PRICING_TIERS, type PricingTier } from '@/lib/stripe'

export default function PricingPage() {
  const [selectedTier, setSelectedTier] = useState<PricingTier>('broker')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubscribe() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: selectedTier }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'خطأ غير متوقع')
      if (data.url) router.push(data.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ، حاول مجدداً')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-slate-900 text-slate-100 px-4 py-10"
      style={{ fontFamily: 'Cairo, Tajawal, sans-serif' }}
    >
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <h1 className="text-2xl font-bold text-center mb-1">اختر اشتراكك</h1>
        <p className="text-center text-slate-400 text-sm mb-8">Choose your plan</p>

        {/* Tier cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {(
            Object.entries(PRICING_TIERS) as [PricingTier, (typeof PRICING_TIERS)[PricingTier]][]
          ).map(([key, tier]) => (
            <button
              key={key}
              data-testid={`tier-${key}`}
              onClick={() => setSelectedTier(key)}
              className={[
                'rounded-xl p-5 text-center border-2 transition-all cursor-pointer',
                selectedTier === key
                  ? 'bg-teal-900/40 border-teal-500'
                  : 'bg-slate-800 border-slate-700 hover:border-slate-500',
              ].join(' ')}
            >
              <div className="text-base font-semibold mb-0.5">{tier.nameAr}</div>
              <div className="text-xs text-slate-400 mb-3">{tier.nameEn}</div>
              <div className="text-3xl font-bold text-teal-400">
                {tier.priceSar.toLocaleString('en-US')}
              </div>
              <div className="text-xs text-slate-400 mt-1">ريال / شهر</div>

              <ul className="mt-4 space-y-1 text-right">
                {tier.features.map((f) => (
                  <li key={f} className="text-xs text-slate-300 flex items-start gap-1">
                    <span className="text-teal-400 mt-px">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-900/30 border border-red-700 px-4 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* CTA */}
        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="w-full bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-xl py-3 text-base font-semibold transition-colors"
        >
          {loading ? 'جارٍ التحويل لـ Stripe...' : 'اشترك الآن — ريال/شهر'}
        </button>

        <p className="text-center text-slate-500 text-xs mt-3">
          دفع آمن عبر Stripe · إيصال بالبريد فوراً · إلغاء في أي وقت
        </p>
      </div>
    </div>
  )
}
