'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const TEAL = '#0D9488'
const CARD = '#1E293B'
const DEV_PASS = 'dev-local-password-2026'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    await fetch('/api/auth/dev-register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: DEV_PASS }),
    })

    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: DEV_PASS })
    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    router.push('/leads')
  }

  return (
    <div dir="rtl" style={{ background: CARD, borderRadius: 16, padding: 24, fontFamily: 'Cairo, Tajawal, sans-serif' }}>
      <h1 style={{ color: '#E2E8F0', fontSize: 18, marginBottom: 20 }}>دخول</h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label style={{ display: 'block', color: '#94A3B8', fontSize: 13, marginBottom: 4 }}>البريد الإلكتروني</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            placeholder="name@office.sa"
            style={{ width: '100%', boxSizing: 'border-box', background: '#0F172A', border: '1px solid #334155', borderRadius: 8, padding: '11px 14px', color: '#E2E8F0', fontSize: 14, fontFamily: 'inherit' }}
          />
        </div>

        {error && <p style={{ color: '#F87171', fontSize: 13, margin: 0 }}>{error}</p>}

        <button
          type="submit"
          disabled={loading}
          style={{ background: TEAL, color: '#fff', border: 'none', borderRadius: 10, padding: 12, fontSize: 15, cursor: 'pointer', marginTop: 4 }}
        >
          {loading ? '...' : 'دخول'}
        </button>
      </form>
    </div>
  )
}
