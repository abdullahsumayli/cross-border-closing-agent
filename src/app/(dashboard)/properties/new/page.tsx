'use client'

// Story 9 AC-9.1 / AC-9.2: property input form → generate multilingual ad copy.
import { useState } from 'react'

const PROPERTY_TYPES = ['فيلا', 'شقة', 'أرض', 'تجاري', 'دوبلكس']
const AD_LANG_LABELS: Record<string, string> = {
  en: 'إنجليزي', zh: 'صيني', ms: 'ملايو', ur: 'أردو', ar: 'عربي',
}

export default function NewPropertyPage() {
  const [form, setForm] = useState({
    propertyType: 'فيلا', city: 'الرياض', priceSar: '', areaSqm: '', bedrooms: '', features: '',
  })
  const [status, setStatus] = useState<'idle' | 'saving' | 'generating' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')
  const [translations, setTranslations] = useState<Record<string, { title: string; description: string }> | null>(null)

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setStatus('saving')
    try {
      const payload = {
        propertyType: form.propertyType,
        city: form.city,
        priceSar: Number(form.priceSar),
        areaSqm: Number(form.areaSqm),
        bedrooms: form.bedrooms ? Number(form.bedrooms) : undefined,
        features: form.features ? form.features.split('،').map((s) => s.trim()).filter(Boolean) : [],
      }
      const res = await fetch('/api/properties', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'فشل حفظ العقار')
      const { id } = await res.json()

      setStatus('generating')
      const gen = await fetch(`/api/properties/${id}/generate`, { method: 'POST' })
      if (!gen.ok) throw new Error((await gen.json()).error ?? 'فشل توليد الإعلان')
      const { translations } = await gen.json()
      setTranslations(translations)
      setStatus('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ')
      setStatus('error')
    }
  }

  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px' }}>
      <h1 style={{ fontFamily: 'Cairo, sans-serif', fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
        إعلان جديد بالـ AI
      </h1>
      <p style={{ color: '#64748B', marginBottom: 24 }}>
        أدخل بيانات العقار مرة، والنظام يكتب الإعلان بلغات المشترين الأجانب.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>نوع العقار</span>
          <select value={form.propertyType} onChange={set('propertyType')} style={inputStyle}>
            {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>المدينة</span>
          <input value={form.city} onChange={set('city')} style={inputStyle} required />
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label style={{ display: 'grid', gap: 6 }}>
            <span>السعر (ريال)</span>
            <input type="number" min="1" value={form.priceSar} onChange={set('priceSar')} style={inputStyle} required />
          </label>
          <label style={{ display: 'grid', gap: 6 }}>
            <span>المساحة (م²)</span>
            <input type="number" min="1" value={form.areaSqm} onChange={set('areaSqm')} style={inputStyle} required />
          </label>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label style={{ display: 'grid', gap: 6 }}>
            <span>غرف النوم</span>
            <input type="number" min="0" value={form.bedrooms} onChange={set('bedrooms')} style={inputStyle} />
          </label>
          <label style={{ display: 'grid', gap: 6 }}>
            <span>مميزات (افصل بفاصلة ،)</span>
            <input value={form.features} onChange={set('features')} style={inputStyle} placeholder="مسبح، حديقة" />
          </label>
        </div>

        {error && <p role="alert" style={{ color: '#DC2626' }}>{error}</p>}

        <button
          type="submit"
          disabled={status === 'saving' || status === 'generating'}
          style={{
            background: '#0F766E', color: '#fff', padding: '12px 20px', borderRadius: 8,
            fontWeight: 700, border: 'none', cursor: 'pointer', opacity: status === 'saving' || status === 'generating' ? 0.6 : 1,
          }}
        >
          {status === 'saving' ? 'جارٍ الحفظ…' : status === 'generating' ? 'جارٍ توليد الإعلان…' : 'ولّد الإعلان'}
        </button>
      </form>

      {translations && (
        <section style={{ marginTop: 32, display: 'grid', gap: 16 }}>
          <h2 style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}>الإعلانات المولّدة</h2>
          {Object.entries(translations).map(([lang, copy]) => (
            <article key={lang} style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 12, color: '#0F766E', fontWeight: 700, marginBottom: 4 }}>
                {AD_LANG_LABELS[lang] ?? lang}
              </div>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{copy.title}</div>
              <p style={{ color: '#334155', margin: 0 }}>{copy.description}</p>
            </article>
          ))}
        </section>
      )}
    </main>
  )
}

const inputStyle: React.CSSProperties = {
  padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 16,
}
