import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildCsvRows, parseLeadFilter, type CsvLead } from '@/lib/leads'

// AC-5.3: export leads as CSV — RLS enforced, broker sees only their leads
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const filter = parseLeadFilter(request.nextUrl.searchParams)

  let query = supabase
    .from('leads')
    .select('buyer_name,buyer_phone,detected_language,status,budget_sar,seriousness_score,created_at')
    .order('created_at', { ascending: false })

  if (filter.status) query = query.eq('status', filter.status)
  if (filter.lang) query = query.eq('detected_language', filter.lang)
  if (filter.from) query = query.gte('created_at', filter.from)
  if (filter.to) query = query.lte('created_at', filter.to + 'T23:59:59Z')

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const date = new Date().toISOString().slice(0, 10)
  const csv = buildCsvRows((data ?? []) as CsvLead[])

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="leads-${date}.csv"`,
    },
  })
}
