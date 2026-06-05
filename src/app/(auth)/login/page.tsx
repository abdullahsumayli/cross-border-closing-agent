'use client'
// AC-1.9: sign out clears session + cookies → /

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { loginSchema } from '@/lib/validations/auth'
import { createClient } from '@/lib/supabase/client'

const TEAL = '#0D9488'
const CARD = '#1E293B'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = loginSchema.safeParse(form)
    if (!parsed.success) {
      const map: Record<string, string> = {}
      parsed.error.errors.forEach((e) => { map[String(e.path[0])] = e.message })
      setErrors(map)
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
    if (error) { setErrors({ email: 'بريد أو كلمة مرور غير صحيحة' }); setLoading(false); return }
    router.push('/dashboard')
  }

  // AC-1.9: sign out action
  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div dir="rtl" style={{ background: CARD, borderRadius: 16, padding: 24, fontFamily: 'Cairo, Tajawal, sans-serif' }}>
      <h1 style={{ color: '#E2E8F0', fontSize: 18, marginBottom: 20 }}>تسجيل الدخول</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label style={{ color: '#94A3B8', fontSize: 13 }}>البريد الإلكتروني</label>
          <input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            style={{ width: '100%', boxSizing: 'border-box', background: '#0F172A', border: `1px solid ${errors.email ? '#F87171' : '#334155'}`, borderRadius: 8, padding: '11px 14px', color: '#E2E8F0', fontSize: 14, fontFamily: 'inherit', marginTop: 4 }} />
          {errors.email && <p style={{ color: '#F87171', fontSize: 12 }}>{errors.email}</p>}
        </div>
        <div>
          <label style={{ color: '#94A3B8', fontSize: 13 }}>كلمة المرور</label>
          <input type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            style={{ width: '100%', boxSizing: 'border-box', background: '#0F172A', border: '1px solid #334155', borderRadius: 8, padding: '11px 14px', color: '#E2E8F0', fontSize: 14, fontFamily: 'inherit', marginTop: 4 }} />
        </div>
        <button type="submit" disabled={loading}
          style={{ background: TEAL, color: '#fff', border: 'none', borderRadius: 10, padding: 12, fontSize: 15, cursor: 'pointer' }}>
          {loading ? 'جارٍ الدخول...' : 'دخول'}
        </button>
      </form>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
        <a href="/forgot-password" style={{ color: '#5EEAD4', fontSize: 13 }}>نسيت كلمة المرور؟</a>
        <a href="/register" style={{ color: '#5EEAD4', fontSize: 13 }}>حساب جديد</a>
      </div>
      {/* AC-1.9: sign-out button visible when authenticated */}
      <button onClick={handleSignOut}
        style={{ width: '100%', marginTop: 16, background: 'transparent', color: '#64748B', border: '1px solid #334155', borderRadius: 10, padding: 10, cursor: 'pointer', fontSize: 13 }}>
        تسجيل الخروج
      </button>
    </div>
  )
}
