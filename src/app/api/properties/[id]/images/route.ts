import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildImageStoragePath } from '@/lib/ad-generator'

// Story 9 AC-9.4: link an image to a property. Unlimited images per property —
// sort_order/index just grows; no count cap. Live bytes upload to Supabase Storage
// happens client-side; this records the resulting URL (or computes a storage path).
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body || (!body.url && !body.fileName)) {
    return NextResponse.json({ error: 'url or fileName required' }, { status: 400 })
  }

  const { count } = await supabase
    .from('property_images')
    .select('id', { count: 'exact', head: true })
    .eq('property_id', id)
  const index = count ?? 0
  const url: string = body.url ?? buildImageStoragePath(id, body.fileName, index)

  const { data, error } = await supabase
    .from('property_images')
    .insert({ property_id: id, url, sort_order: index })
    .select('id, url, sort_order')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ image: data }, { status: 201 })
}
