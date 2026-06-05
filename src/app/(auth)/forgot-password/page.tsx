'use client'
// AC-1.6: password reset email, 1-hour token (Supabase default)

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { forgotPasswordSchema } from '@/lib/validations/auth'

const TEAL = '#0D9488'
const CARD = '#1E293B'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = forgotPasswordSchema.safeParse({ email })
    if (!parsed.success) { setError(parsed.error.errors[0].message); return }

    setLoading(true)
    const supabase = createClient()
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    })
    if (err) { setError(err.message); setLoading(false); return }
    setSent(true)
    setLoading(false)
  }

  if (sent) return (
    <div dir="rtl" style={{ background: CARD, borderRadius: 16, padding: 24, fontFamily: 'Cairo, Tajawal, sans-serif', textAlign: 'center' }}>
      <p style={{ color: '#5EEAD4', fontSize: 16 }}>✓ أُرسل رابط استعادة كلمة المرور</p>
      <p style={{ color: '#94A3B8', fontSize: 14 }}>تحقق من بريدك — الرابط صالح ساعة واحدة</p>
    </div>
  )

  return (
    <div dir="rtl" style={{ background: CARD, borderRadius: 16, padding: 24, fontFamily: 'Cairo, Tajawal, sans-serif' }}>
      <h1 style={{ color: '#E2E8F0', fontSize: 18, marginBottom: 8 }}>استعادة كلمة المرور</h1>
      <p style={{ color: '#94A3B8', fontSize: 14, marginTop: 0 }}>أدخل بريدك وسنرسل لك رابط الاستعادة</p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label style={{ color: '#94A3B8', fontSize: 13 }}>البريد الإلكتروني</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="name@office.sa"
            style={{ width: '100%', boxSizing: 'border-box', background: '#0F172A', border: `1px solid ${error ? '#F87171' : '#334155'}`, borderRadius: 8, padding: '11px 14px', color: '#E2E8F0', fontSize: 14, fontFamily: 'inherit', marginTop: 4 }} />
          {error && <p style={{ color: '#F87171', fontSize: 12 }}>{error}</p>}
        </div>
        <button type="submit" disabled={loading}
          style={{ background: TEAL, color: '#fff', border: 'none', borderRadius: 10, padding: 12, fontSize: 15, cursor: 'pointer' }}>
          {loading ? 'جارٍ الإرسال...' : 'إرسال رابط الاستعادة'}
        </button>
      </form>
      <p style={{ textAlign: 'center', marginTop: 12 }}><a href="/login" style={{ color: '#5EEAD4', fontSize: 13 }}>رجوع لتسجيل الدخول</a></p>
    </div>
  )
}
