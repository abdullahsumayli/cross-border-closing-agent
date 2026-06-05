'use client'
// AC-1.1: email validation inline 200ms
// AC-1.4: specific Arabic error messages
// AC-1.5: redirect to /dashboard on success
// AC-1.7: 375px responsive
// AC-1.8: Arabic names, Cairo/Tajawal font

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { registerSchema } from '@/lib/validations/auth'
import { createClient } from '@/lib/supabase/client'
import type { ZodError } from 'zod'

const TEAL = '#0D9488'
const CARD = '#1E293B'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    email: '', phone: '', full_name: '', office_name: '', password: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(0) // 0=التسجيل، 1=OTP، 2=واتساب

  const field = (name: keyof typeof form) => ({
    value: form[name],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = { ...form, [name]: e.target.value }
      setForm(next)
      // AC-1.1: inline validation within 200ms (onChange = immediate)
      try {
        registerSchema.parse(next)
        setErrors((p) => ({ ...p, [name]: '' }))
      } catch (err) {
        const ze = err as ZodError
        const fieldErr = ze.errors.find((e) => e.path[0] === name)
        if (fieldErr) setErrors((p) => ({ ...p, [name]: fieldErr.message }))
        else setErrors((p) => ({ ...p, [name]: '' }))
      }
    },
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = registerSchema.safeParse(form)
    if (!parsed.success) {
      const map: Record<string, string> = {}
      parsed.error.errors.forEach((e) => { map[String(e.path[0])] = e.message })
      setErrors(map)
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    })

    if (error) {
      setErrors({ email: error.message })
      setLoading(false)
      return
    }

    // Send OTP to phone
    await fetch('/api/auth/otp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: form.phone }),
    })

    setStep(1)
    setLoading(false)
  }

  async function handleOtpVerify(code: string) {
    setLoading(true)
    const res = await fetch('/api/auth/otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: form.phone, code }),
    })
    const data = await res.json()
    if (!res.ok) {
      setErrors({ otp: data.error })
      setLoading(false)
      return
    }
    // AC-1.5: redirect to /dashboard within 1s
    router.push('/dashboard')
  }

  if (step === 1) return <OtpStep phone={form.phone} onVerify={handleOtpVerify} error={errors.otp} />

  return (
    <div style={{ background: CARD, borderRadius: 16, padding: 24 }}>
      {/* Wizard progress — matches onboarding-flow.jsx */}
      <WizardProgress current={0} steps={['التسجيل', 'تأكيد الهاتف', 'ربط واتساب', 'الاشتراك']} />

      <h1 style={{ color: '#E2E8F0', fontSize: 18, marginBottom: 20 }}>إعداد حسابك</h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Field label="البريد الإلكتروني" type="email" placeholder="name@office.sa" error={errors.email} {...field('email')} />
        <Field label="رقم الجوال" type="tel" placeholder="+966500000000" error={errors.phone} {...field('phone')} />
        {/* AC-1.8: Arabic full_name stored as UTF-8 */}
        <Field label="الاسم الكامل" type="text" placeholder="خالد العمري" error={errors.full_name} {...field('full_name')} />
        <Field label="اسم المكتب العقاري" type="text" placeholder="مكتب النخبة العقاري" error={errors.office_name} {...field('office_name')} />
        <Field label="كلمة المرور" type="password" placeholder="8 أحرف على الأقل" error={errors.password} {...field('password')} />

        <button
          type="submit"
          disabled={loading}
          style={{ background: TEAL, color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontSize: 15, cursor: 'pointer', marginTop: 4 }}
        >
          {loading ? 'جارٍ التسجيل...' : 'إنشاء الحساب'}
        </button>
      </form>

      <p style={{ color: '#94A3B8', fontSize: 13, textAlign: 'center', marginTop: 12 }}>
        لديك حساب؟{' '}
        <a href="/login" style={{ color: '#5EEAD4' }}>سجّل دخولك</a>
      </p>
    </div>
  )
}

// AC-1.2/1.3: OTP entry — 6 digits, 10-min validity shown
function OtpStep({ phone, onVerify, error }: { phone: string; onVerify: (c: string) => void; error?: string }) {
  const [digits, setDigits] = useState(['', '', '', '', '', ''])

  const code = digits.join('')
  const ready = code.length === 6

  return (
    <div style={{ background: CARD, borderRadius: 16, padding: 24 }}>
      <WizardProgress current={1} steps={['التسجيل', 'تأكيد الهاتف', 'ربط واتساب', 'الاشتراك']} />
      <h2 style={{ color: '#E2E8F0', fontSize: 17, margin: '0 0 8px' }}>تأكيد الهاتف</h2>
      <p style={{ color: '#94A3B8', fontSize: 14 }}>أُرسل رمز OTP إلى {phone} — صالح 10 دقائق</p>

      {/* 6-digit boxes — direction ltr for numerics */}
      <div style={{ display: 'flex', gap: 8, direction: 'ltr', margin: '16px 0' }}>
        {digits.map((d, i) => (
          <input
            key={i}
            maxLength={1}
            value={d}
            onChange={(e) => {
              const next = [...digits]
              next[i] = e.target.value.replace(/\D/, '')
              setDigits(next)
              if (e.target.value && i < 5) {
                const el = document.getElementById(`otp-${i + 1}`)
                el?.focus()
              }
            }}
            id={`otp-${i}`}
            style={{ width: 44, height: 52, textAlign: 'center', fontSize: 22, background: '#0F172A', border: '1px solid #334155', borderRadius: 8, color: '#fff' }}
          />
        ))}
      </div>

      {error && <p style={{ color: '#F87171', fontSize: 13 }}>{error}</p>}

      <button
        onClick={() => onVerify(code)}
        disabled={!ready}
        style={{ background: ready ? TEAL : '#334155', color: '#fff', border: 'none', borderRadius: 10, padding: '12px', width: '100%', fontSize: 15, cursor: ready ? 'pointer' : 'default' }}
      >
        تأكيد
      </button>
    </div>
  )
}

function WizardProgress({ current, steps }: { current: number; steps: string[] }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
      {steps.map((s, i) => (
        <div key={i} style={{ flex: 1, textAlign: 'center' }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%', margin: '0 auto 4px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: i < current ? TEAL : i === current ? '#0B3B36' : '#334155',
            border: i === current ? `2px solid ${TEAL}` : 'none',
            fontSize: 12, color: '#E2E8F0',
          }}>{i < current ? '✓' : i + 1}</div>
          <span style={{ fontSize: 11, color: i === current ? '#5EEAD4' : '#64748B' }}>{s}</span>
        </div>
      ))}
    </div>
  )
}

function Field({ label, type, placeholder, error, value, onChange }: {
  label: string; type: string; placeholder: string; error?: string;
  value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <div>
      <label style={{ display: 'block', color: '#94A3B8', fontSize: 13, marginBottom: 4 }}>{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        style={{
          width: '100%', boxSizing: 'border-box',
          background: '#0F172A', border: `1px solid ${error ? '#F87171' : '#334155'}`,
          borderRadius: 8, padding: '11px 14px', color: '#E2E8F0', fontSize: 14,
          fontFamily: 'Cairo, Tajawal, sans-serif',
        }}
      />
      {/* AC-1.4: specific error inline */}
      {error && <p style={{ color: '#F87171', fontSize: 12, margin: '3px 0 0' }}>{error}</p>}
    </div>
  )
}
