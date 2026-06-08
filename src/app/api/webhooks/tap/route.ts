import { NextRequest, NextResponse } from 'next/server'
import { verifyTapSignature, buildTapSubscriptionPayload } from '@/lib/tap'
import { PRICING_TIERS, type PricingTier } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/service'
import { sendReceiptEmail } from '@/lib/email'
import { capturePayment } from '@/lib/posthog'

// Story 7 AC-7.1: Tap webhook — verifies signature, updates subscription, idempotent.
// Symmetric with /api/webhooks/stripe so both gateways converge on the same
// subscriptions row (UNIQUE broker_id, UNIQUE gateway_payment_id).
export async function POST(req: NextRequest) {
  const signature = req.headers.get('x-tap-signature') ?? req.headers.get('hashstring') ?? ''
  const rawBody = await req.text()
  const secret = process.env.TAP_WEBHOOK_SECRET

  if (!secret) {
    console.error('[tap webhook] TAP_WEBHOOK_SECRET not configured')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  // AC-7.1: reject unsigned / tampered payloads
  if (!verifyTapSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let event: {
    id?: string
    status?: string
    metadata?: { broker_id?: string; tier?: string }
    customer?: { id?: string }
  }
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Tap fires the final, money-captured state as status=CAPTURED.
  if (event.status === 'CAPTURED') {
    const brokerId = event.metadata?.broker_id
    const tier = (event.metadata?.tier ?? 'broker') as PricingTier
    const chargeId = event.id
    const customerId = event.customer?.id

    if (!brokerId) {
      return NextResponse.json({ error: 'Missing broker_id in metadata' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // AC-7.1: idempotency — Tap retries; skip if this charge was already processed
    if (chargeId) {
      const { data: existing } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('gateway_payment_id', chargeId)
        .maybeSingle()
      if (existing) {
        return NextResponse.json({ status: 'already_processed' })
      }
    }

    const payload = buildTapSubscriptionPayload(brokerId, tier, chargeId, customerId)
    const { error: upsertError } = await supabase
      .from('subscriptions')
      .upsert(payload, { onConflict: 'broker_id' })
    if (upsertError) {
      console.error('[tap webhook] upsert failed — Tap will retry:', upsertError.message)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    void capturePayment(brokerId, tier, PRICING_TIERS[tier].priceSar)

    // best-effort receipt (same contract as the Stripe path)
    const { data: broker } = await supabase
      .from('brokers')
      .select('email')
      .eq('id', brokerId)
      .single()
    if (broker?.email) {
      await sendReceiptEmail(broker.email, PRICING_TIERS[tier].priceSar, tier)
      await supabase.from('notifications').insert({
        broker_id: brokerId,
        channel: 'email',
        template: 'payment_received',
        status: 'sent',
        payload: { amount_sar: PRICING_TIERS[tier].priceSar, tier, gateway: 'tap' },
      })
    }
  }

  return NextResponse.json({ received: true })
}
