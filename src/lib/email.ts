import type { PricingTier } from './stripe'

export interface ReceiptPayload {
  to: string
  tier: PricingTier
  priceSar: number
}

export function buildReceiptSubject(tier: PricingTier, priceSar: number): string {
  const tierAr = tier === 'broker' ? 'وسيط' : 'مطوّر'
  const formatted = priceSar.toLocaleString('en-US') // Western numerals for email compat
  return `إيصال الاشتراك — ${tierAr} | ${formatted} ريال/شهر`
}

export function buildReceiptText(tier: PricingTier, priceSar: number, domain: string): string {
  const tierAr = tier === 'broker' ? 'وسيط' : 'مطوّر'
  const formatted = priceSar.toLocaleString('en-US')
  return [
    'شكراً على اشتراكك في Cross-Border Closing Agent.',
    '',
    `الخطة: ${tierAr}`,
    `المبلغ: ${formatted} ريال/شهر`,
    '',
    `للدعم: support@${domain}`,
  ].join('\n')
}

export async function sendReceiptEmail(
  to: string,
  priceSar: number,
  tier: PricingTier
): Promise<void> {
  const domain = process.env.MAILGUN_DOMAIN
  const apiKey = process.env.MAILGUN_API_KEY

  if (!domain || !apiKey) {
    throw new Error('MAILGUN_DOMAIN and MAILGUN_API_KEY are required to send email receipts')
  }

  const body = new URLSearchParams({
    from: `Cross-Border Closing Agent <noreply@${domain}>`,
    to,
    subject: buildReceiptSubject(tier, priceSar),
    text: buildReceiptText(tier, priceSar, domain),
  })

  const res = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  })

  if (!res.ok) {
    throw new Error(`Mailgun error ${res.status}: ${await res.text()}`)
  }
}
