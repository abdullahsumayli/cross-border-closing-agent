// Story 7 AC-7.3: PDPL (Saudi Personal Data Protection Law) data-localization readiness.
//
// BLOCKED ON HUMAN ACTION (L-001): the actual staging migration of the Supabase
// database to AWS me-central-1 (UAE) or STC Cloud (KSA) needs cloud infra + a paid
// project move — that is operational, not code. What lives here is the guard that
// validates a target residency config is PDPL-compliant *before* anyone migrates,
// plus the documented runbook at 4-Architecture/pdpl-data-localization.md.

export const PDPL_ALLOWED_REGIONS = new Set([
  'me-central-1',     // AWS UAE
  'me-south-1',       // AWS Bahrain
  'stc-cloud-riyadh', // STC Cloud KSA
])

export interface DataResidencyConfig {
  region: string
  encryptionAtRest: boolean
  crossBorderTransferAllowed: boolean
}

export function validateDataResidencyConfig(cfg: DataResidencyConfig): {
  valid: boolean
  reasons: string[]
} {
  const reasons: string[] = []
  if (!PDPL_ALLOWED_REGIONS.has(cfg.region)) {
    reasons.push(`region ${cfg.region} is not in the PDPL-allowed residency list`)
  }
  if (!cfg.encryptionAtRest) {
    reasons.push('encryption at rest is required by PDPL')
  }
  if (cfg.crossBorderTransferAllowed) {
    reasons.push('cross-border transfer must be disabled for strict PDPL localization')
  }
  return { valid: reasons.length === 0, reasons }
}
