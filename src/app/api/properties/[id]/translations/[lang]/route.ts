import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildTranslationPayload } from '@/lib/ad-generator'
import type { SupportedLanguage } from '@/lib/qualification/prompts'

// Story 9 AC-9.3: broker edits the generated copy and saves a per-language version.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; lang: string }> }
) {
  const { id, lang } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body || typeof body.title !== 'string' || typeof body.description !== 'string') {
    return NextResponse.json({ error: 'title and description required' }, { status: 400 })
  }

  const payload = buildTranslationPayload(
    id,
    lang as SupportedLanguage,
    { title: body.title, description: body.description },
    true // edited_by_broker
  )
  const { error } = await supabase
    .from('property_translations')
    .upsert(payload, { onConflict: 'property_id,language' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ saved: true, edited_by_broker: true })
}
