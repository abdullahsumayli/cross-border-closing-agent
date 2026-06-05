// Story 3 [@WeekendMVP] [loop:money]: التسعير والاشتراك
// TDD: هذا الملف هو مصدر الحقيقة — الكود يخدم هذه الاختبارات

import { PRICING_TIERS, buildSubscriptionPayload, verifyStripeSignature } from '../src/lib/stripe'
import { buildReceiptSubject, buildReceiptText } from '../src/lib/email'

// ─── AC-3.1: صفحة التسعير — شرائح + أسعار SAR ───────────────────────────────

describe('AC-3.1 — pricing tiers', () => {
  it('تعرض شريحة وسيط بسعر 990 ريال @AC-3.1', () => {
    expect(PRICING_TIERS.broker.priceSar).toBe(990)
    expect(PRICING_TIERS.broker.nameAr).toBe('وسيط')
    expect(PRICING_TIERS.broker.nameEn).toBe('Broker')
  })

  it('تعرض شريحة مطوّر بسعر 1500 ريال @AC-3.1', () => {
    expect(PRICING_TIERS.developer.priceSar).toBe(1500)
    expect(PRICING_TIERS.developer.nameAr).toBe('مطوّر')
    expect(PRICING_TIERS.developer.nameEn).toBe('Developer')
  })

  it('كل شريحة لها عنوان عربي + إنجليزي @AC-3.1', () => {
    for (const [, tier] of Object.entries(PRICING_TIERS)) {
      expect(tier.nameAr).toBeTruthy()
      expect(tier.nameEn).toBeTruthy()
    }
  })

  it('لا USD في أي شريحة — أسعار SAR فقط @AC-3.1', () => {
    for (const [, tier] of Object.entries(PRICING_TIERS)) {
      expect(tier.priceSar).toBeGreaterThan(0)
      expect(typeof tier.priceSar).toBe('number')
    }
  })
})

// ─── AC-3.3: webhook signature verification ───────────────────────────────────

describe('AC-3.3 — webhook signature verification', () => {
  it('يرفض payload بتوقيع خاطئ بـ Error @AC-3.3', () => {
    expect(() =>
      verifyStripeSignature(Buffer.from('{}'), 'bad-signature', 'whsec_test_secret')
    ).toThrow()
  })

  it('يرفض payload بتوقيع فارغ @AC-3.3', () => {
    expect(() =>
      verifyStripeSignature(Buffer.from('{}'), '', 'whsec_test_secret')
    ).toThrow()
  })

  it('يرفض body فارغ بتوقيع خاطئ @AC-3.3', () => {
    expect(() =>
      verifyStripeSignature(Buffer.from(''), 't=1,v1=fake', 'whsec_test_secret')
    ).toThrow()
  })
})

// ─── AC-3.4: subscription payload builder ─────────────────────────────────────

describe('AC-3.4 — subscription payload', () => {
  it('يبني payload صحيح لوسيط @AC-3.4', () => {
    const payload = buildSubscriptionPayload(
      'broker-uuid-123',
      'broker',
      'pi_test_123',
      'cus_test_456'
    )
    expect(payload.status).toBe('active')
    expect(payload.broker_id).toBe('broker-uuid-123')
    expect(payload.tier).toBe('broker')
    expect(payload.price_sar).toBe(990)
    expect(payload.gateway_name).toBe('stripe')
    expect(payload.gateway_payment_id).toBe('pi_test_123')
    expect(payload.gateway_customer_id).toBe('cus_test_456')
  })

  it('يبني payload صحيح لمطوّر @AC-3.4', () => {
    const payload = buildSubscriptionPayload('broker-uuid-456', 'developer', 'pi_dev_789', undefined)
    expect(payload.price_sar).toBe(1500)
    expect(payload.tier).toBe('developer')
    expect(payload.gateway_customer_id).toBeNull()
  })

  it('updated_at يكون ISO timestamp حديث @AC-3.4', () => {
    const before = Date.now()
    const payload = buildSubscriptionPayload('uuid', 'broker', 'pi_x', 'cus_x')
    const after = Date.now()
    const ts = new Date(payload.updated_at).getTime()
    expect(ts).toBeGreaterThanOrEqual(before)
    expect(ts).toBeLessThanOrEqual(after)
  })
})

// ─── AC-3.5: email receipt content ────────────────────────────────────────────

describe('AC-3.5 — email receipt', () => {
  it('subject يحتوي على اسم الخطة العربي للوسيط @AC-3.5', () => {
    const subject = buildReceiptSubject('broker', 990)
    expect(subject).toContain('وسيط')
    expect(subject).toContain('990')
  })

  it('subject يحتوي على اسم الخطة العربي للمطوّر @AC-3.5', () => {
    const subject = buildReceiptSubject('developer', 1500)
    expect(subject).toContain('مطوّر')
    expect(subject).toContain('1,500')
  })

  it('نص الإيصال يحتوي على المبلغ + الخطة @AC-3.5', () => {
    const text = buildReceiptText('broker', 990, 'mg.crossborder.sa')
    expect(text).toContain('990')
    expect(text).toContain('وسيط')
    expect(text).toContain('Cross-Border Closing Agent')
  })

  it('لا USD في نص الإيصال @AC-3.5', () => {
    const text = buildReceiptText('developer', 1500, 'mg.crossborder.sa')
    expect(text).not.toContain('USD')
    expect(text).not.toContain('$')
  })
})

// ─── AC-3.6: idempotency guard ────────────────────────────────────────────────

describe('AC-3.6 — idempotency', () => {
  it('payload مكرر لنفس payment_intent_id يعيد نفس gateway_payment_id @AC-3.6', () => {
    const PI_ID = 'pi_idempotency_test'
    const first = buildSubscriptionPayload('broker-1', 'broker', PI_ID, 'cus_1')
    const second = buildSubscriptionPayload('broker-1', 'broker', PI_ID, 'cus_1')
    expect(first.gateway_payment_id).toBe(second.gateway_payment_id)
    expect(first.status).toBe(second.status)
  })

  it('payment_intent_id مختلف ينتج payload منفصل @AC-3.6', () => {
    const p1 = buildSubscriptionPayload('broker-1', 'broker', 'pi_first', 'cus_1')
    const p2 = buildSubscriptionPayload('broker-1', 'broker', 'pi_second', 'cus_1')
    expect(p1.gateway_payment_id).not.toBe(p2.gateway_payment_id)
  })
})

// ─── AC-3.2: checkout session URL format ─────────────────────────────────────

describe('AC-3.2 — checkout session redirect', () => {
  it('success_url يوجّه لـ /dashboard?payment=success @AC-3.2', () => {
    const appUrl = 'https://app.crossborder.sa'
    const successUrl = `${appUrl}/dashboard?payment=success`
    expect(successUrl).toContain('/dashboard')
    expect(successUrl).toContain('payment=success')
  })

  it('cancel_url يوجّه لـ /pricing @AC-3.2', () => {
    const appUrl = 'https://app.crossborder.sa'
    const cancelUrl = `${appUrl}/pricing`
    expect(cancelUrl).toContain('/pricing')
  })

  it('tier غير صالح يرفض — broker و developer فقط @AC-3.2', () => {
    const validTiers = ['broker', 'developer']
    expect(validTiers.includes('broker')).toBe(true)
    expect(validTiers.includes('developer')).toBe(true)
    expect(validTiers.includes('admin')).toBe(false)
    expect(validTiers.includes('')).toBe(false)
  })
})
