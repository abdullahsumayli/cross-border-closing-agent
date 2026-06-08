import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { registerPlannedConnectors } from '@/lib/distribution/bootstrap'
import { publishToChannels } from '@/lib/distribution/engine'
import type { CanonicalListing } from '@/lib/distribution/connector'

// Story 10 AC-10.1 / AC-10.2: publish a property to the selected channels in one call,
// recording per-channel status (with retry) into the distributions table.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const channels: string[] = Array.isArray(body?.channels) ? body.channels : []
  const language: string = body?.language ?? 'en'
  if (channels.length === 0) {
    return NextResponse.json({ error: 'channels[] required' }, { status: 400 })
  }

  const { data: property, error: pErr } = await supabase
    .from('properties')
    .select('id, property_type, city, price_sar, area_sqm, bedrooms')
    .eq('id', id)
    .single()
  if (pErr || !property) return NextResponse.json({ error: 'Property not found' }, { status: 404 })

  const { data: translation } = await supabase
    .from('property_translations')
    .select('title, description')
    .eq('property_id', id)
    .eq('language', language)
    .maybeSingle()

  const { data: images } = await supabase
    .from('property_images')
    .select('url')
    .eq('property_id', id)
    .order('sort_order', { ascending: true })

  const listing: CanonicalListing = {
    id: property.id,
    title: translation?.title ?? `${property.property_type} — ${property.city}`,
    description: translation?.description ?? '',
    propertyType: property.property_type,
    city: property.city,
    priceSar: Number(property.price_sar),
    areaSqm: Number(property.area_sqm),
    bedrooms: property.bedrooms ?? undefined,
    images: (images ?? []).map((i) => i.url),
    language,
  }

  registerPlannedConnectors()
  const outcomes = await publishToChannels(listing, channels)

  // record each channel's status (idempotent on property_id + channel_name)
  const rows = outcomes.map((o) => ({
    property_id: id,
    broker_id: user.id,
    channel_name: o.channel,
    status: o.status,
    external_ref: o.externalRef ?? null,
    error: o.error ?? null,
    retry_count: o.retryCount,
    last_synced_at: new Date().toISOString(),
  }))
  const { error: upErr } = await supabase
    .from('distributions')
    .upsert(rows, { onConflict: 'property_id,channel_name' })
  if (upErr) console.error('[distribute] failed to record distributions:', upErr.message)

  return NextResponse.json({ outcomes })
}

// AC-10.2: current per-channel distribution status for a property.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('distributions')
    .select('channel_name, status, external_ref, error, retry_count, last_synced_at')
    .eq('property_id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ distributions: data ?? [] })
}
