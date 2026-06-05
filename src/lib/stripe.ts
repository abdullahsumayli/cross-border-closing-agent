import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? 'sk_test_placeholder', {
  apiVersion: '2023-10-16',
})

export const PRICING_TIERS = {
  broker: {
    nameAr: 'وسيط',
    nameEn: 'Broker',
    priceSar: 990,
    features: ['استفسارات غير محدودة/شهر', 'بطاقة تأهيل عربية', 'إشعار واتساب فوري'],
  },
  developer: {
    nameAr: 'مطوّر',
    nameEn: 'Developer',
    priceSar: 1500,
    features: ['كل ميزات وسيط', 'دعم متعدد الوحدات', 'تقارير أداء متقدمة'],
  },
} as const

export type PricingTier = keyof typeof PRICING_TIERS

export function verifyStripeSignature(
  rawBody: Buffer | string,
  signature: string,
  secret: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(rawBody, signature, secret)
}

export function buildSubscriptionPayload(
  brokerId: string,
  tier: PricingTier,
  paymentIntentId: string | undefined,
  customerId: string | undefined
) {
  return {
    broker_id: brokerId,
    tier,
    status: 'active' as const,
    price_sar: PRICING_TIERS[tier].priceSar,
    gateway_name: 'stripe' as const,
    gateway_customer_id: customerId ?? null,
    gateway_payment_id: paymentIntentId ?? null,
    updated_at: new Date().toISOString(),
  }
}

export async function createCheckoutSession(
  brokerId: string,
  tier: PricingTier,
  appUrl: string
): Promise<string> {
  const priceId =
    tier === 'broker'
      ? process.env.STRIPE_PRICE_BROKER_ID
      : process.env.STRIPE_PRICE_DEVELOPER_ID

  if (!priceId) {
    throw new Error(`STRIPE_PRICE_${tier.toUpperCase()}_ID not configured`)
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    currency: 'sar',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard?payment=success`,
    cancel_url: `${appUrl}/pricing`,
    metadata: { broker_id: brokerId, tier },
  })

  if (!session.url) throw new Error('Stripe session URL missing')
  return session.url
}
