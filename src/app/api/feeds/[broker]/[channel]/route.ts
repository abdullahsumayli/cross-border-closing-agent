import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { generateListingFeed } from '@/lib/distribution/feed'
import type { CanonicalListing } from '@/lib/distribution/connector'

// Story 10 AC-10.1: canonical XML feed per broker/channel — the pull source most
// networks + portals consume. Public read of a broker's *published* listings only.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ broker: string; channel: string }> }
) {
  const { broker, channel } = await params
  const supabase = createServiceClient()

  const { data: properties, error } = await supabase
    .from('properties')
    .select('id, property_type, city, price_sar, area_sqm, bedrooms, status')
    .eq('broker_id', broker)
    .eq('status', 'published')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const listings: CanonicalListing[] = []
  for (const p of properties ?? []) {
    const { data: tr } = await supabase
      .from('property_translations')
      .select('title, description')
      .eq('property_id', p.id)
      .eq('language', 'en')
      .maybeSingle()
    const { data: imgs } = await supabase
      .from('property_images')
      .select('url')
      .eq('property_id', p.id)
      .order('sort_order', { ascending: true })

    listings.push({
      id: p.id,
      title: tr?.title ?? `${p.property_type} — ${p.city}`,
      description: tr?.description ?? '',
      propertyType: p.property_type,
      city: p.city,
      priceSar: Number(p.price_sar),
      areaSqm: Number(p.area_sqm),
      bedrooms: p.bedrooms ?? undefined,
      images: (imgs ?? []).map((i) => i.url),
      language: 'en',
    })
  }

  const xml = generateListingFeed(listings)
  return new NextResponse(xml, {
    status: 200,
    headers: { 'Content-Type': 'application/xml; charset=utf-8', 'X-Feed-Channel': channel },
  })
}
