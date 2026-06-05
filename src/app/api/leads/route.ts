import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseLeadFilter, PAGE_SIZE } from '@/lib/leads'

// AC-5.1: list leads with optional filters — RLS enforced via cookie client
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const filter = parseLeadFilter(request.nextUrl.searchParams)
  const page = filter.page ?? 1
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let query = supabase
    .from('leads')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (filter.status) query = query.eq('status', filter.status)
  if (filter.lang) query = query.eq('detected_language', filter.lang)
  if (filter.from) query = query.gte('created_at', filter.from)
  if (filter.to) query = query.lte('created_at', filter.to + 'T23:59:59Z')

  const { data: leads, count, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ leads: leads ?? [], total: count ?? 0, page })
}
