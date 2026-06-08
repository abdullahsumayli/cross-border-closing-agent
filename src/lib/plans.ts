// Story 11 [@Phase2]: tiered pricing + freemium. Builds on Story 3's subscription.
// Limits are enforced programmatically (AC-11.3); -1 means unlimited.

export type PlanTier = 'free' | 'starter' | 'pro' | 'agency'

export interface PlanLimits {
  maxProperties: number
  maxChannels: number
  maxQualifiedLeads: number
  priceSar: number
}

export const PLANS: Record<PlanTier, PlanLimits & { nameAr: string; nameEn: string }> = {
  // AC-11.1: free plan lets a broker try the funnel without paying.
  free:    { nameAr: 'مجاني',   nameEn: 'Free',    maxProperties: 1,  maxChannels: 1,  maxQualifiedLeads: 5,   priceSar: 0 },
  starter: { nameAr: 'مبتدئ',   nameEn: 'Starter', maxProperties: 10, maxChannels: 3,  maxQualifiedLeads: 50,  priceSar: 490 },
  pro:     { nameAr: 'احترافي', nameEn: 'Pro',     maxProperties: 50, maxChannels: 6,  maxQualifiedLeads: 300, priceSar: 990 },
  agency:  { nameAr: 'وكالة',   nameEn: 'Agency',  maxProperties: -1, maxChannels: -1, maxQualifiedLeads: -1,  priceSar: 2500 },
}

export const PLAN_TIERS = Object.keys(PLANS) as PlanTier[]

export function getPlan(tier: PlanTier) {
  return PLANS[tier]
}

export interface Usage {
  properties: number
  qualifiedLeads: number
}

function withinLimit(current: number, max: number): boolean {
  return max === -1 || current < max
}

// AC-11.3: programmatic enforcement
export function canAddProperty(usage: Pick<Usage, 'properties'>, tier: PlanTier): boolean {
  return withinLimit(usage.properties, PLANS[tier].maxProperties)
}

export function canQualifyLead(usage: Pick<Usage, 'qualifiedLeads'>, tier: PlanTier): boolean {
  return withinLimit(usage.qualifiedLeads, PLANS[tier].maxQualifiedLeads)
}

export function canDistributeTo(channelCount: number, tier: PlanTier): boolean {
  const max = PLANS[tier].maxChannels
  return max === -1 || channelCount <= max
}

// AC-11.2: the columns to write when a broker upgrades/downgrades.
export function planLimitsPayload(tier: PlanTier) {
  const p = PLANS[tier]
  return {
    tier,
    price_sar: p.priceSar,
    max_properties: p.maxProperties,
    max_channels: p.maxChannels,
    max_qualified_leads: p.maxQualifiedLeads,
  }
}

// AC-11.4: free → paid is the conversion metric.
export function isConversion(fromTier: PlanTier, toTier: PlanTier): boolean {
  return fromTier === 'free' && toTier !== 'free'
}
