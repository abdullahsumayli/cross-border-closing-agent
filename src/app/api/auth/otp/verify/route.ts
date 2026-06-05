import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { otpSchema } from '@/lib/validations/auth'
import { z } from 'zod'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { phone, code } = otpSchema.parse(body)

    const supabase = createClient()

    // Find valid, unused OTP (AC-1.3: must be within 10 min)
    const { data: record } = await supabase
      .from('otp_codes')
      .select('id, expires_at, used_at')
      .eq('phone', phone)
      .eq('code', code)
      .is('used_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!record) {
      return NextResponse.json({ error: 'رمز التحقق غير صحيح' }, { status: 400 })
    }

    if (new Date(record.expires_at) < new Date()) {
      return NextResponse.json({ error: 'انتهت صلاحية الرمز — اطلب رمزاً جديداً' }, { status: 400 })
    }

    // Mark as used (idempotency guard)
    await supabase
      .from('otp_codes')
      .update({ used_at: new Date().toISOString() })
      .eq('id', record.id)

    return NextResponse.json({ verified: true })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    }
    console.error('[OTP verify]', err)
    return NextResponse.json({ error: 'حدث خطأ — حاول مجدداً' }, { status: 500 })
  }
}
