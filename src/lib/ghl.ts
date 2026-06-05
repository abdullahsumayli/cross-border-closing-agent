// GHL (GoHighLevel) integration — OAuth + contact sync (@AC-6.1, @AC-6.2, @AC-6.3, @AC-6.4)
import * as Sentry from '@sentry/nextjs'
import { createServiceClient } from '@/lib/supabase/service'

export const GHL_CONTACT_ENDPOINT = 'https://services.leadconnectorhq.com/contacts/'
export const GHL_TOKEN_ENDPOINT = 'https://services.leadconnectorhq.com/oauth/token'
export const GHL_OAUTH_URL = 'https://marketplace.gohighlevel.com/oauth/chooselocation'

export interface GhlCardInput {
  buyerPhone: string
  buyerName: string
  detectedLanguage: string
  budgetSar: number | null
  seriousnessScore: number | null
  legalEligibility: string | null
  timeline: string | null
  propertyType: string | null
  nationality: string | null
  cardSummaryAr: string
}

interface GhlCustomField {
  key: string
  value: string
}

export interface GhlContactPayload {
  phone: string
  firstName: string
  customFields: GhlCustomField[]
}

// AC-6.4: build GHL OAuth authorization URL (pure — testable)
export function buildOAuthUrl(state: string): string {
  const clientId = process.env.GHL_CLIENT_ID ?? ''
  const redirectUri = process.env.GHL_REDIRECT_URI ?? ''
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    state,
  })
  return `${GHL_OAUTH_URL}?${params.toString()}`
}

// AC-6.2: map qualification card to GHL contact payload (pure — testable)
export function buildGhlContactPayload(card: GhlCardInput): GhlContactPayload {
  const customFields: GhlCustomField[] = []

  if (card.budgetSar !== null && card.budgetSar !== undefined) {
    customFields.push({ key: 'budget_sar', value: String(card.budgetSar) })
  }
  if (card.detectedLanguage) {
    customFields.push({ key: 'buyer_language', value: card.detectedLanguage })
  }
  if (card.seriousnessScore !== null && card.seriousnessScore !== undefined) {
    customFields.push({ key: 'seriousness_score', value: String(card.seriousnessScore) })
  }
  if (card.legalEligibility) {
    customFields.push({ key: 'legal_eligibility', value: card.legalEligibility })
  }
  if (card.timeline) {
    customFields.push({ key: 'timeline', value: card.timeline })
  }
  if (card.propertyType) {
    customFields.push({ key: 'property_type', value: card.propertyType })
  }
  if (card.nationality) {
    customFields.push({ key: 'nationality', value: card.nationality })
  }

  return {
    phone: card.buyerPhone,
    firstName: card.buyerName,
    customFields,
  }
}

// AC-6.4: exchange OAuth code for tokens
export async function exchangeCodeForTokens(code: string): Promise<{
  accessToken: string
  refreshToken: string
  locationId: string
  expiresIn: number
}> {
  const res = await fetch(GHL_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GHL_CLIENT_ID ?? '',
      client_secret: process.env.GHL_CLIENT_SECRET ?? '',
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.GHL_REDIRECT_URI ?? '',
    }),
  })

  if (!res.ok) {
    throw new Error(`GHL token exchange failed: ${res.status}`)
  }

  const data = await res.json()
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? '',
    locationId: data.locationId ?? data.location_id ?? '',
    expiresIn: data.expires_in ?? 86400,
  }
}

// AC-6.3: sync qualification card to GHL — fire-and-forget with 3-attempt retry + Sentry
export async function syncCardToGHL(brokerId: string, card: GhlCardInput): Promise<void> {
  if (!process.env.GHL_CLIENT_ID) return

  const supabase = createServiceClient()
  const { data: connection } = await supabase
    .from('ghl_connections')
    .select('access_token, location_id')
    .eq('broker_id', brokerId)
    .single()

  if (!connection) return

  const payload = buildGhlContactPayload(card)
  const maxAttempts = 3

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(GHL_CONTACT_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${connection.access_token}`,
          Version: '2021-07-28',
        },
        body: JSON.stringify({ ...payload, locationId: connection.location_id }),
      })

      if (!res.ok) throw new Error(`GHL contact POST ${res.status}`)
      return
    } catch (err) {
      if (attempt === maxAttempts) {
        Sentry.captureException(err, { extra: { brokerId, attempt } })
        return
      }
      await new Promise((r) => setTimeout(r, 200 * Math.pow(2, attempt - 1)))
    }
  }
}
