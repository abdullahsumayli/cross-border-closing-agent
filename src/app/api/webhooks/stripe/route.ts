import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { verifyStripeSignature, buildSubscriptionPayload, type PricingTier } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/service'
import { sendReceiptEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature') ?? ''
  const rawBody = Buffer.from(await req.arrayBuffer())
  const secret = process.env.STRIPE_WEBHOOK_SECRET

  if (!secret) {
    console.error('[stripe webhook] STRIPE_WEBHOOK_SECRET not configured')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  let event: Stripe.Event
  try {
    event = verifyStripeSignature(rawBody, sig, secret)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const supabase = createServiceClient()

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const brokerId = session.metadata?.broker_id
    const tier = (session.metadata?.tier ?? 'broker') as PricingTier
    const paymentIntentId =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : (session.payment_intent as Stripe.PaymentIntent | null)?.id
    const customerId =
      typeof session.customer === 'string'
        ? session.customer
        : (session.customer as Stripe.Customer | null)?.id

    if (!brokerId) {
      return NextResponse.json({ error: 'Missing broker_id in metadata' }, { status: 400 })
    }

    // AC-3.6: idempotency — skip if this payment was already processed
    if (paymentIntentId) {
      const { data: existing } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('gateway_payment_id', paymentIntentId)
        .maybeSingle()

      if (existing) {
        return NextResponse.json({ status: 'already_processed' })
      }
    }

    // AC-3.4: upsert subscription → active (UNIQUE broker_id ensures single row per broker)
    const payload = buildSubscriptionPayload(brokerId, tier, paymentIntentId, customerId)
    const { error: upsertError } = await supabase
      .from('subscriptions')
      .upsert(payload, { onConflict: 'broker_id' })
    if (upsertError) {
      console.error('[stripe webhook] upsert failed — Stripe will retry:', upsertError.message)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }
  }

  if (event.type === 'payment_intent.succeeded') {
    // AC-3.5: best-effort receipt email.
    // Race note: this event may fire before checkout.session.completed writes the subscription.
    // If sub is not found, we skip silently — Sentry will catch repeated misses at scale.
    const pi = event.data.object as Stripe.PaymentIntent

    const { data: sub } = await supabase
      .from('subscriptions')
      .select('broker_id, tier, price_sar')
      .eq('gateway_payment_id', pi.id)
      .maybeSingle()

    if (sub) {
      const { data: broker } = await supabase
        .from('brokers')
        .select('email')
        .eq('id', sub.broker_id)
        .single()

      if (broker?.email) {
        await sendReceiptEmail(broker.email, sub.price_sar ?? 990, sub.tier as PricingTier)

        await supabase.from('notifications').insert({
          broker_id: sub.broker_id,
          channel: 'email',
          template: 'payment_received',
          status: 'sent',
          payload: { amount_sar: sub.price_sar, tier: sub.tier },
        })
      }
    }
  }

  return NextResponse.json({ received: true })
}
