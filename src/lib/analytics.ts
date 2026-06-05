// Story 8: Analytics pure functions (@AC-8.1, @AC-8.3)
// Zero dependencies — testable without DB or Next.js

export const QUALIFICATION_THRESHOLD = 50

export interface AnalyticsLead {
  status: 'in_progress' | 'qualified' | 'unqualified'
  created_at: string
  first_response_at: string | null
}

export interface AnalyticsMetrics {
  total: number
  qualifiedCount: number
  qualificationRate: number   // 0-100, rounded to 1 decimal
  avgResponseHours: number | null
  alertTriggered: boolean
}

export type AnalyticsPeriod = 'week' | 'month' | 'all'

// AC-8.1: compute all KPI metrics from a list of leads
export function computeMetrics(leads: AnalyticsLead[]): AnalyticsMetrics {
  if (leads.length === 0) {
    return { total: 0, qualifiedCount: 0, qualificationRate: 0, avgResponseHours: null, alertTriggered: false }
  }

  const total = leads.length
  const qualifiedCount = leads.filter(l => l.status === 'qualified').length
  const qualificationRate = Math.round((qualifiedCount / total) * 1000) / 10  // 1 decimal

  const responseTimes = leads
    .filter(l => l.first_response_at !== null)
    .map(l => {
      const createdMs = new Date(l.created_at).getTime()
      const respondedMs = new Date(l.first_response_at!).getTime()
      return (respondedMs - createdMs) / (1000 * 60 * 60)  // hours
    })
    .filter(h => h >= 0)

  const avgResponseHours = responseTimes.length > 0
    ? responseTimes.reduce((sum, h) => sum + h, 0) / responseTimes.length
    : null

  const alertTriggered = total > 0 && qualificationRate < QUALIFICATION_THRESHOLD

  return { total, qualifiedCount, qualificationRate, avgResponseHours, alertTriggered }
}

// AC-8.1: compute date bounds for a given period
export function computePeriodBounds(period: AnalyticsPeriod): {
  from: string | null
  to: string | null
} {
  if (period === 'all') return { from: null, to: null }

  const now = new Date()
  const to = now.toISOString()

  const daysBack = period === 'week' ? 7 : 30
  const from = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000).toISOString()

  return { from, to }
}
