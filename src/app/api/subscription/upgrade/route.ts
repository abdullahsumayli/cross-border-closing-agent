import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { planLimitsPayload, isConversion, PLAN_TIERS, type PlanTier } from '@/lib/plans'
import { captureConversion } from '@/lib/posthog'

// Story 11 AC-11.2 / AC-11.4: instant upgrade — write the new tier limits, and if it's
// a free → paid move, fire the conversion metric.
export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const toTier = body?.tier as PlanTier
  if (!PLAN_TIERS.includes(toTier)) {
    return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
  }

  const { data: current } = await supabase
    .from('subscriptions')
    .select('tier')
    .eq('broker_id', user.id)
    .maybeSingle()
  const fromTier = (current?.tier as PlanTier) ?? 'free'

  const limits = planLimitsPayload(toTier)
  const { error } = await supabase.from('subscriptions').upsert(
    { broker_id: user.id, status: 'active', ...limits, updated_at: new Date().toISOString() },
    { onConflict: 'broker_id' }
  )
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // AC-11.4: free → paid conversion
  if (isConversion(fromTier, toTier)) {
    void captureConversion(user.id, fromTier, toTier)
  }

  return NextResponse.json({ ...limits, from_tier: fromTier })
}
