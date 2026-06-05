// AC-8.1: Analytics summary endpoint — returns KPI metrics for the broker's leads
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { computeMetrics, computePeriodBounds, type AnalyticsPeriod } from '@/lib/analytics'

const VALID_PERIODS: AnalyticsPeriod[] = ['week', 'month', 'all']

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const rawPeriod = searchParams.get('period') ?? 'month'
  const period: AnalyticsPeriod = VALID_PERIODS.includes(rawPeriod as AnalyticsPeriod)
    ? (rawPeriod as AnalyticsPeriod)
    : 'month'

  const { from, to } = computePeriodBounds(period)

  let query = supabase
    .from('leads')
    .select('status, created_at, first_response_at')
    .eq('broker_id', user.id)

  if (from) query = query.gte('created_at', from)
  if (to) query = query.lte('created_at', to)

  const { data: leads, error } = await query

  if (error) {
    return NextResponse.json({ error: 'db error' }, { status: 500 })
  }

  const metrics = computeMetrics(leads ?? [])

  return NextResponse.json({ ...metrics, period })
}
