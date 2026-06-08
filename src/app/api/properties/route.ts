import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateProperty } from '@/lib/ad-generator'
import { canAddProperty, type PlanTier } from '@/lib/plans'

// Story 9 AC-9.1: create a property (RLS scopes it to the broker via auth.uid()).
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  const { valid, errors } = validateProperty(body)
  if (!valid) return NextResponse.json({ error: 'Invalid property', details: errors }, { status: 400 })

  // Story 11 AC-11.3: enforce the plan's property cap
  const { data: sub } = await supabase.from('subscriptions').select('tier').eq('broker_id', user.id).maybeSingle()
  const tier = (sub?.tier as PlanTier) ?? 'free'
  const { count } = await supabase.from('properties').select('id', { count: 'exact', head: true }).eq('broker_id', user.id)
  if (!canAddProperty({ properties: count ?? 0 }, tier)) {
    return NextResponse.json({ error: 'plan_limit_reached', tier, limit: 'maxProperties' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('properties')
    .insert({
      broker_id: user.id,
      title: body.title ?? null,
      base_description: body.baseDescription ?? null,
      property_type: body.propertyType,
      city: body.city,
      price_sar: body.priceSar,
      area_sqm: body.areaSqm,
      bedrooms: body.bedrooms ?? null,
      features: body.features ?? null,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id }, { status: 201 })
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ properties: data ?? [] })
}
