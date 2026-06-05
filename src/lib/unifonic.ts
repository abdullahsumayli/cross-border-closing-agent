// AC-1.2: Unifonic Saudi OTP provider
// Rate limit: 1 per 30s per phone, max 5 per day

const UNIFONIC_BASE = 'https://el.cloud.unifonic.com/rest'

export interface OtpSendResult {
  success: boolean
  messageId?: string
  error?: string
}

export async function sendOtp(phone: string, code: string): Promise<OtpSendResult> {
  const apiKey = process.env.UNIFONIC_API_KEY
  const senderId = process.env.UNIFONIC_SENDER_ID

  if (!apiKey || !senderId) {
    // Dev fallback: log OTP (never in production)
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV] OTP for ${phone}: ${code}`)
      return { success: true, messageId: 'dev-mock' }
    }
    return { success: false, error: 'Unifonic not configured' }
  }

  const res = await fetch(`${UNIFONIC_BASE}/messages/otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      AppSid: apiKey,
      SenderID: senderId,
      Body: `رمز التحقق الخاص بك: ${code}`,
      Recipient: phone,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    return { success: false, error: `Unifonic error: ${text}` }
  }

  const data = await res.json()
  return { success: true, messageId: data.data?.MessageID }
}

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}
