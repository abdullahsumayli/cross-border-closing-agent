import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateViaOpenRouter } from '@/lib/openrouter'
import {
  generateAllTranslations,
  buildTranslationPayload,
  type PropertyInput,
} from '@/lib/ad-generator'
import type { SupportedLanguage } from '@/lib/qualification/prompts'

// Story 9 AC-9.1 / AC-9.2: generate professional ad copy in all 5 languages.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: property, error: pErr } = await supabase
    .from('properties')
    .select('property_type, city, price_sar, area_sqm, bedrooms, features')
    .eq('id', id)
    .single()
  if (pErr || !property) return NextResponse.json({ error: 'Property not found' }, { status: 404 })

  const input: PropertyInput = {
    propertyType: property.property_type,
    city: property.city,
    priceSar: Number(property.price_sar),
    areaSqm: Number(property.area_sqm),
    bedrooms: property.bedrooms ?? undefined,
    features: (property.features as string[] | null) ?? undefined,
  }

  let translations: Record<SupportedLanguage, { title: string; description: string }>
  try {
    translations = await generateAllTranslations(input, (p) => generateViaOpenRouter(p))
  } catch (err) {
    console.error('[properties/generate] AI generation failed:', err)
    return NextResponse.json({ error: 'AI generation failed, please retry' }, { status: 502 })
  }

  const rows = (Object.entries(translations) as [SupportedLanguage, { title: string; description: string }][])
    .map(([lang, copy]) => buildTranslationPayload(id, lang, copy, false))

  const { error: upErr } = await supabase
    .from('property_translations')
    .upsert(rows, { onConflict: 'property_id,language' })
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })

  return NextResponse.json({ translations })
}
