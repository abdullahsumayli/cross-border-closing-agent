// Story 7 [@Phase2]: Tap Payments (مسار خليجي ثانٍ) + توطين بيانات PDPL
// Live Tap account (TAP_SECRET_KEY) + live staging migration to AWS me-central-1
// are blocked on human action (L-001). Everything below is the buildable + testable
// contract: gateway routing, HMAC signature verification, idempotent subscription
// update, daily reconciliation, and PDPL data-residency validation.

import crypto from 'crypto'
import { existsSync } from 'fs'
import { join } from 'path'
import {
  selectPaymentGateway,
  shouldOfferTap,
  TAP_ROLLOUT_THRESHOLD,
  verifyTapSignature,
  buildTapSubscriptionPayload,
} from '../src/lib/tap'
import { reconcilePayments, type GatewayCharge, type SubscriptionRecord } from '../src/lib/reconciliation'
import { validateDataResidencyConfig, PDPL_ALLOWED_REGIONS } from '../src/lib/pdpl'
import { POST as tapWebhook } from '../src/app/api/webhooks/tap/route'

const SECRET = 'tap_test_secret'
function sign(body: string): string {
  return crypto.createHmac('sha256', SECRET).update(body).digest('hex')
}
function tapRequest(body: string, signature: string): Request {
  return new Request('http://localhost/api/webhooks/tap', {
    method: 'POST',
    headers: { 'x-tap-signature': signature, 'content-type': 'application/json' },
    body,
  })
}

describe('Story 7 [@Phase2] — Tap Payments + PDPL', () => {
  // ─── AC-7.2: gateway routing ────────────────────────────────────────────────
  it('AC-7.2 routes GCC customers to Tap and everyone else to Stripe @AC-7.2', () => {
    for (const gcc of ['SA', 'ae', 'KW', 'QA', 'BH', 'OM']) {
      expect(selectPaymentGateway(gcc)).toBe('tap')
    }
    for (const other of ['US', 'GB', 'CN', 'PK', 'MY', 'TR']) {
      expect(selectPaymentGateway(other)).toBe('stripe')
    }
    // unknown/empty → safe default Stripe (MVP gateway)
    expect(selectPaymentGateway(null)).toBe('stripe')
    expect(selectPaymentGateway(undefined)).toBe('stripe')
  })

  it('AC-7.1 Tap is offered once the Gulf customer base crosses the rollout threshold @AC-7.1', () => {
    expect(TAP_ROLLOUT_THRESHOLD).toBe(20)
    expect(shouldOfferTap(19)).toBe(false)
    expect(shouldOfferTap(20)).toBe(true)
    expect(shouldOfferTap(45)).toBe(true)
  })

  // ─── AC-7.1: signature verification ─────────────────────────────────────────
  it('AC-7.1 verifyTapSignature accepts a valid HMAC and rejects tampering @AC-7.1', () => {
    const body = JSON.stringify({ id: 'chg_1', status: 'CAPTURED' })
    expect(verifyTapSignature(body, sign(body), SECRET)).toBe(true)
    expect(verifyTapSignature(body, 'deadbeef', SECRET)).toBe(false)
    expect(verifyTapSignature(body + 'x', sign(body), SECRET)).toBe(false)
    expect(verifyTapSignature(body, '', SECRET)).toBe(false)
  })

  it('AC-7.1 buildTapSubscriptionPayload stamps gateway_name=tap with the tier price @AC-7.1', () => {
    const p = buildTapSubscriptionPayload('broker-1', 'developer', 'chg_99', 'cus_5')
    expect(p.gateway_name).toBe('tap')
    expect(p.broker_id).toBe('broker-1')
    expect(p.status).toBe('active')
    expect(p.price_sar).toBe(1500)
    expect(p.gateway_payment_id).toBe('chg_99')
  })

  // ─── AC-7.1: webhook route ──────────────────────────────────────────────────
  it('AC-7.1 webhook returns 401 for an unsigned/invalid payload @AC-7.1', async () => {
    process.env.TAP_WEBHOOK_SECRET = SECRET
    const body = JSON.stringify({ id: 'chg_1', status: 'CAPTURED' })
    const res = await tapWebhook(tapRequest(body, 'wrong-sig') as never)
    expect(res.status).toBe(401)
  })

  it('AC-7.1 webhook returns 500 when the secret is not configured @AC-7.1', async () => {
    delete process.env.TAP_WEBHOOK_SECRET
    jest.spyOn(console, 'error').mockImplementation(() => {})
    const body = JSON.stringify({ id: 'chg_1', status: 'CAPTURED' })
    const res = await tapWebhook(tapRequest(body, sign(body)) as never)
    expect(res.status).toBe(500)
  })

  it('AC-7.1 webhook ACKs a valid-signature non-charge event without touching the DB @AC-7.1', async () => {
    process.env.TAP_WEBHOOK_SECRET = SECRET
    const body = JSON.stringify({ id: 'chg_1', status: 'INITIATED' })
    const res = await tapWebhook(tapRequest(body, sign(body)) as never)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.received).toBe(true)
  })

  // ─── AC-7.4: daily reconciliation ───────────────────────────────────────────
  it('AC-7.4 reconcilePayments matches both gateways and flags gaps + amount mismatches @AC-7.4', () => {
    const charges: GatewayCharge[] = [
      { gatewayName: 'stripe', chargeId: 'pi_1', brokerId: 'b1', amountSar: 990 },
      { gatewayName: 'tap', chargeId: 'chg_2', brokerId: 'b2', amountSar: 1500 },
      { gatewayName: 'tap', chargeId: 'chg_orphan', brokerId: 'b9', amountSar: 990 }, // webhook, no sub
      { gatewayName: 'stripe', chargeId: 'pi_3', brokerId: 'b3', amountSar: 990 },     // amount mismatch
    ]
    const subs: SubscriptionRecord[] = [
      { brokerId: 'b1', gatewayName: 'stripe', gatewayPaymentId: 'pi_1', priceSar: 990 },
      { brokerId: 'b2', gatewayName: 'tap', gatewayPaymentId: 'chg_2', priceSar: 1500 },
      { brokerId: 'b3', gatewayName: 'stripe', gatewayPaymentId: 'pi_3', priceSar: 1500 }, // mismatch vs 990
      { brokerId: 'b7', gatewayName: 'tap', gatewayPaymentId: 'chg_missing', priceSar: 990 }, // sub, no webhook
    ]
    const r = reconcilePayments(charges, subs)
    expect(r.matched.map((m) => m.chargeId).sort()).toEqual(['chg_2', 'pi_1', 'pi_3'])
    expect(r.unmatchedCharges.map((c) => c.chargeId)).toEqual(['chg_orphan'])
    expect(r.unmatchedSubscriptions.map((s) => s.gatewayPaymentId)).toEqual(['chg_missing'])
    expect(r.amountMismatches).toEqual([{ chargeId: 'pi_3', chargeAmount: 990, subAmount: 1500 }])
  })

  // ─── AC-7.3: PDPL data localization ─────────────────────────────────────────
  it('AC-7.3 validateDataResidencyConfig enforces PDPL region + encryption + no cross-border @AC-7.3', () => {
    expect(PDPL_ALLOWED_REGIONS.has('me-central-1')).toBe(true)
    const ok = validateDataResidencyConfig({ region: 'me-central-1', encryptionAtRest: true, crossBorderTransferAllowed: false })
    expect(ok.valid).toBe(true)

    const bad = validateDataResidencyConfig({ region: 'us-east-1', encryptionAtRest: false, crossBorderTransferAllowed: true })
    expect(bad.valid).toBe(false)
    expect(bad.reasons.length).toBe(3)
  })

  it('AC-7.3 PDPL data-localization migration runbook is documented @AC-7.3', () => {
    // The actual staging migration is blocked on cloud infra; the runbook (the
    // "documented" half of AC-7.3) must exist and be committed.
    expect(existsSync(join(process.cwd(), 'architecture', 'pdpl-data-localization.md'))).toBe(true)
  })
})
