import crypto from 'crypto'
import { PRICING_TIERS, type PricingTier } from './stripe'

// Story 7 [@Phase2]: Tap Payments — second, Gulf-native gateway (mada / STC Pay / KNET).
// Mirrors src/lib/stripe.ts so the webhook + subscription flow stay symmetric.

// AC-7.2: GCC customers route to Tap; everyone else stays on Stripe (the MVP gateway).
export const GCC_COUNTRIES = new Set(['SA', 'AE', 'KW', 'QA', 'BH', 'OM'])

export function selectPaymentGateway(countryCode: string | null | undefined): 'tap' | 'stripe' {
  if (!countryCode) return 'stripe'
  return GCC_COUNTRIES.has(countryCode.toUpperCase()) ? 'tap' : 'stripe'
}

// AC-7.1 trigger: roll Tap out once the Gulf customer base crosses the threshold
// (BRD: "العميل رقم 20 أو تجاوز حجم خليجي محدد").
export const TAP_ROLLOUT_THRESHOLD = 20
export function shouldOfferTap(activeBrokerCount: number): boolean {
  return activeBrokerCount >= TAP_ROLLOUT_THRESHOLD
}

// AC-7.1: verify Tap webhook signature (HMAC-SHA256), timing-safe.
//
// BLOCKED ON HUMAN ACTION (L-001): production must hash Tap's canonical `hashstring`
// field ordering (id, amount, currency, gateway_reference, payment_reference, status,
// created) — that exact formula needs the live Tap account to confirm. Until then we
// verify HMAC-SHA256 over the raw body, which is the same cryptographic contract and
// keeps the rejection path real + testable.
export function verifyTapSignature(rawBody: string, signature: string, secret: string): boolean {
  if (!signature || !secret) return false
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  const a = Buffer.from(expected)
  const b = Buffer.from(signature)
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

export function buildTapSubscriptionPayload(
  brokerId: string,
  tier: PricingTier,
  chargeId: string | undefined,
  customerId: string | undefined
) {
  return {
    broker_id: brokerId,
    tier,
    status: 'active' as const,
    price_sar: PRICING_TIERS[tier].priceSar,
    gateway_name: 'tap' as const,
    gateway_customer_id: customerId ?? null,
    gateway_payment_id: chargeId ?? null,
    updated_at: new Date().toISOString(),
  }
}
