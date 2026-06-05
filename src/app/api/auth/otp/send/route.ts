import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendOtp, generateOtp } from '@/lib/unifonic'
import { z } from 'zod'

const schema = z.object({
  phone: z.string().regex(/^\+966[0-9]{9}$/, 'رقم هاتف سعودي غير صالح'),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { phone } = schema.parse(body)

    const supabase = createClient()

    // Rate limit: max 5 per day per phone (AC-1.2)
    const since = new Date()
    since.setHours(0, 0, 0, 0)
    const { count } = await supabase
      .from('otp_codes')
      .select('*', { count: 'exact', head: true })
      .eq('phone', phone)
      .gte('created_at', since.toISOString())

    if ((count ?? 0) >= 5) {
      return NextResponse.json(
        { error: 'تجاوزت الحد اليومي — حاول غداً' },
        { status: 429 }
      )
    }

    // Rate limit: 1 per 30s
    const thirtySecondsAgo = new Date(Date.now() - 30_000)
    const { count: recentCount } = await supabase
      .from('otp_codes')
      .select('*', { count: 'exact', head: true })
      .eq('phone', phone)
      .gte('created_at', thirtySecondsAgo.toISOString())

    if ((recentCount ?? 0) > 0) {
      return NextResponse.json(
        { error: 'انتظر 30 ثانية قبل طلب رمز جديد' },
        { status: 429 }
      )
    }

    const code = generateOtp()
    const expiresAt = new Date(Date.now() + 10 * 60_000) // AC-1.3: 10 min

    await supabase.from('otp_codes').insert({
      phone,
      code,
      expires_at: expiresAt.toISOString(),
    })

    const result = await sendOtp(phone, code)
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 502 })
    }

    return NextResponse.json({ sent: true })
  } catch (err) {
    if (err instanceof z.ZodError) {
      // AC-1.4: specific error message
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    }
    // AC-2.5 pattern: never return 500 to client
    console.error('[OTP send]', err)
    return NextResponse.json({ error: 'حدث خطأ — حاول مجدداً' }, { status: 500 })
  }
}
