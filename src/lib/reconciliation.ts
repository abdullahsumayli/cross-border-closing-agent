// Story 7 AC-7.4: daily payment reconciliation — match gateway webhook charges
// (Stripe + Tap) against subscription records, so money received always ties out to
// an active subscription and vice-versa. Pure function → fully unit-testable; the
// cron/route that feeds it real data is thin glue.

export interface GatewayCharge {
  gatewayName: 'stripe' | 'tap'
  chargeId: string
  brokerId: string
  amountSar: number
}

export interface SubscriptionRecord {
  brokerId: string
  gatewayName: string
  gatewayPaymentId: string | null
  priceSar: number | null
}

export interface ReconciliationResult {
  matched: Array<{ chargeId: string; brokerId: string }>
  unmatchedCharges: GatewayCharge[]           // gateway says paid, no subscription row
  unmatchedSubscriptions: SubscriptionRecord[] // subscription row, no matching charge
  amountMismatches: Array<{ chargeId: string; chargeAmount: number; subAmount: number | null }>
}

export function reconcilePayments(
  charges: GatewayCharge[],
  subscriptions: SubscriptionRecord[]
): ReconciliationResult {
  const subByPaymentId = new Map(
    subscriptions
      .filter((s) => s.gatewayPaymentId)
      .map((s) => [s.gatewayPaymentId as string, s])
  )

  const matched: ReconciliationResult['matched'] = []
  const unmatchedCharges: GatewayCharge[] = []
  const amountMismatches: ReconciliationResult['amountMismatches'] = []
  const matchedPaymentIds = new Set<string>()

  for (const charge of charges) {
    const sub = subByPaymentId.get(charge.chargeId)
    if (!sub) {
      unmatchedCharges.push(charge)
      continue
    }
    matchedPaymentIds.add(charge.chargeId)
    matched.push({ chargeId: charge.chargeId, brokerId: charge.brokerId })
    if (sub.priceSar !== charge.amountSar) {
      amountMismatches.push({
        chargeId: charge.chargeId,
        chargeAmount: charge.amountSar,
        subAmount: sub.priceSar,
      })
    }
  }

  const unmatchedSubscriptions = subscriptions.filter(
    (s) => s.gatewayPaymentId && !matchedPaymentIds.has(s.gatewayPaymentId)
  )

  return { matched, unmatchedCharges, unmatchedSubscriptions, amountMismatches }
}
