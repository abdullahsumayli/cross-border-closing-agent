// AC-2.3: WhatsApp Business API client (Meta Graph API)
// AC-2.5: all errors logged + return structured result

import crypto from 'crypto'

const WA_BASE = 'https://graph.facebook.com/v18.0'

export interface WhatsAppResult {
  success: boolean
  messageId?: string
  error?: string
}

export async function sendWhatsAppMessage(
  to: string,
  text: string
): Promise<WhatsAppResult> {
  const token = process.env.WHATSAPP_API_TOKEN
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID

  if (!token || !phoneNumberId) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV] WhatsApp to ${to}: ${text.slice(0, 80)}`)
      return { success: true, messageId: 'dev-mock-msg' }
    }
    return { success: false, error: 'WhatsApp not configured' }
  }

  try {
    const res = await fetch(`${WA_BASE}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text },
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[WhatsApp send] API error:', err)
      return { success: false, error: `WhatsApp API: ${res.status}` }
    }

    const data = await res.json()
    return { success: true, messageId: data.messages?.[0]?.id }
  } catch (err) {
    console.error('[WhatsApp send] Network error:', err)
    return { success: false, error: 'network error' }
  }
}

// AC-2.3: send qualification card via template
export async function sendQualificationCardTobroker(
  brokerPhone: string,
  cardText: string
): Promise<WhatsAppResult> {
  // In MVP: send as regular text message
  // In v2: use approved WhatsApp template for business messaging
  return sendWhatsAppMessage(brokerPhone, cardText)
}

// Verify WhatsApp webhook signature (AC-2.1 security)
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  appSecret: string
): boolean {
  const expected = crypto.createHmac('sha256', appSecret).update(payload).digest('hex')
  const received = signature.replace('sha256=', '')
  const expBuf = Buffer.from(expected, 'hex')
  const recBuf = Buffer.from(received, 'hex')
  // timingSafeEqual throws if buffers have different lengths
  if (expBuf.length !== recBuf.length) return false
  return crypto.timingSafeEqual(expBuf, recBuf)
}
