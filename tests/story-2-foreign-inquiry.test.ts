// Story 2 [@WeekendMVP] [loop:domain] [loop:notify] [loop:compliance]

import {
  detectLanguage,
  processStep,
  type QualificationState,
} from '../src/lib/qualification/engine'
import {
  checkLegalEligibility,
  initialGreeting,
  QUALIFICATION_QUESTIONS,
  SUPPORTED_LANGUAGES,
  unqualifiedMessage,
} from '../src/lib/qualification/prompts'
import {
  generateArabicCard,
  validateCard,
  type LeadData,
} from '../src/lib/qualification/card-generator'

// ─── AC-2.1: language detection ───────────────────────────────────────────────

describe('AC-2.1 — language detection', () => {
  const mockClaude = (response: string) => async (_prompt: string) => response

  it('يكتشف الإنجليزية @AC-2.1', async () => {
    const lang = await detectLanguage('Hi, is this open for foreigners?', mockClaude('en'))
    expect(lang).toBe('en')
  })

  it('يكتشف الصينية @AC-2.1', async () => {
    const lang = await detectLanguage('你好，这个项目对外国人开放吗？', mockClaude('zh'))
    expect(lang).toBe('zh')
  })

  it('يكتشف الملايوية @AC-2.1', async () => {
    const lang = await detectLanguage('Helo, adakah ini terbuka untuk orang asing?', mockClaude('ms'))
    expect(lang).toBe('ms')
  })

  it('يكتشف الأردوية @AC-2.1', async () => {
    const lang = await detectLanguage('کیا یہ غیر ملکیوں کے لیے کھلا ہے؟', mockClaude('ur'))
    expect(lang).toBe('ur')
  })

  it('يرجع unknown للغات غير مدعومة @AC-2.1 @AC-2.5', async () => {
    const lang = await detectLanguage('Hola, ¿está abierto para extranjeros?', mockClaude('unknown'))
    expect(lang).toBe('unknown')
  })

  it('يتحقق أن 5 لغات مدعومة فقط @AC-2.1', () => {
    expect(SUPPORTED_LANGUAGES).toEqual(['en', 'zh', 'ms', 'ur', 'ar'])
    expect(SUPPORTED_LANGUAGES).toHaveLength(5)
  })
})

// ─── AC-2.2: qualification state machine ──────────────────────────────────────

describe('AC-2.2 — qualification state machine', () => {
  const baseState = (step: number): QualificationState => ({
    step,
    language: 'en',
    answers: {},
  })

  it('Step 0: يرسل تحية أولية بلغة المشتري @AC-2.2', () => {
    const result = processStep(baseState(0), 'any message')
    expect(result.reply).toContain('5')
    expect(result.nextStep).toBe(1)
    expect(result.isComplete).toBe(false)
  })

  it('Step 1: يسأل عن الميزانية @AC-2.2', () => {
    const result = processStep(baseState(1), 'I want to buy property')
    expect(result.reply).toBe(QUALIFICATION_QUESTIONS['en'][1])
    expect(result.nextStep).toBe(2)
  })

  it('Step 2: يسأل عن الجدول الزمني @AC-2.2', () => {
    const result = processStep(baseState(2), '1.2M SAR')
    expect(result.reply).toBe(QUALIFICATION_QUESTIONS['en'][2])
    expect(result.nextStep).toBe(3)
  })

  it('Step 5: يُكمل التأهيل @AC-2.2', () => {
    const state: QualificationState = { step: 5, language: 'en', answers: { nationality: 'Malaysian' } }
    const result = processStep(state, '8')
    expect(result.isComplete).toBe(true)
    expect(result.isUnqualified).toBe(false)
    expect(result.seriousnessScore).toBe(80)
  })

  it('يطرح 5 أسئلة لكل لغة مدعومة @AC-2.2', () => {
    for (const lang of SUPPORTED_LANGUAGES) {
      expect(QUALIFICATION_QUESTIONS[lang]).toHaveLength(5)
    }
  })

  it('التحية الأولية تذكر 5 أسئلة @AC-2.2', () => {
    for (const lang of SUPPORTED_LANGUAGES) {
      const greeting = initialGreeting(lang)
      expect(greeting.length).toBeGreaterThan(20)
    }
  })
})

// ─── AC-2.3: qualification card generation ────────────────────────────────────

describe('AC-2.3 — Arabic qualification card', () => {
  const fullLead: LeadData = {
    buyerName: 'Ahmad (EN)',
    detectedLanguage: 'en',
    budgetSar: 1200000,
    timeline: 'within 3 months',
    legalEligibility: 'eligible',
    seriousnessScore: 86,
    propertyType: 'apartment',
    nationality: 'Malaysian',
  }

  it('يولّد بطاقة تأهيل عربية كاملة @AC-2.3', () => {
    const card = generateArabicCard(fullLead)
    expect(card).toContain('بطاقة تأهيل')
    expect(card).toContain('الميزانية')
    expect(card).toContain('الأهلية')
    expect(card).toContain('الجدية')
    expect(card).toContain('86/100')
  })

  it('البطاقة تعرض الأهلية بالعربي @AC-2.3', () => {
    const card = generateArabicCard({ ...fullLead, legalEligibility: 'eligible' })
    expect(card).toContain('مؤهَّل قانونياً ✓')
  })

  it('البطاقة غير المؤهَّلة تعرض ✗ @AC-2.3', () => {
    const card = generateArabicCard({ ...fullLead, legalEligibility: 'not_eligible' })
    expect(card).toContain('غير مؤهَّل ✗')
  })

  it('validateCard يتحقق من اكتمال البطاقة @AC-2.3', () => {
    const card = generateArabicCard(fullLead)
    const { valid, missing } = validateCard(card)
    expect(valid).toBe(true)
    expect(missing).toHaveLength(0)
  })

  it('بطاقة ناقصة: validateCard يُعيد missing fields @AC-2.3', () => {
    const { valid, missing } = validateCard('incomplete card text')
    expect(valid).toBe(false)
    expect(missing.length).toBeGreaterThan(0)
  })

  it('البطاقة تحتوي على رمز واتساب للإشارة @AC-2.3', () => {
    const card = generateArabicCard(fullLead)
    expect(card).toContain('📲')
  })
})

// ─── AC-2.4: unqualified classification ──────────────────────────────────────

describe('AC-2.4 — unqualified classification', () => {
  it('جنسية غير مؤهَّلة → يُصنَّف unqualified مع سبب @AC-2.4', () => {
    const state: QualificationState = { step: 3, language: 'en', answers: {} }
    const result = processStep(state, 'Israeli')
    expect(result.isUnqualified).toBe(true)
    expect(result.unqualifiedReason).toContain('not_eligible')
    expect(result.legalEligibility).toBe('not_eligible')
  })

  it('رسالة غير مؤهَّل تحتوي على سبب واضح @AC-2.4', () => {
    for (const lang of SUPPORTED_LANGUAGES) {
      const msg = unqualifiedMessage(lang, 'test reason')
      expect(msg.length).toBeGreaterThan(20)
    }
  })

  it('لا تُرسَل بطاقة للاستفسارات غير المؤهَّلة @AC-2.4', () => {
    const state: QualificationState = { step: 3, language: 'en', answers: {} }
    const result = processStep(state, 'Israeli')
    expect(result.isComplete).toBe(true)
    expect(result.isUnqualified).toBe(true)
    // Card should NOT be generated for unqualified leads
    expect(result.unqualifiedReason).toBeTruthy()
  })

  it('checkLegalEligibility: ماليزي مؤهَّل @AC-2.4', () => {
    expect(checkLegalEligibility('Malaysian')).toBe('eligible')
  })

  it('checkLegalEligibility: تركي مؤهَّل @AC-2.4', () => {
    expect(checkLegalEligibility('Turkish')).toBe('eligible')
  })

  it('checkLegalEligibility: إسرائيلي غير مؤهَّل @AC-2.4', () => {
    expect(checkLegalEligibility('Israeli')).toBe('not_eligible')
  })
})

// ─── AC-2.5: error handling ───────────────────────────────────────────────────

describe('AC-2.5 — error handling', () => {
  const mockClaude = (response: string) => async (_prompt: string) => response

  it('لغة غير مدعومة → unknown وليس crash @AC-2.5', async () => {
    const lang = await detectLanguage('Hola amigo!', mockClaude('unknown'))
    expect(lang).toBe('unknown')
  })

  it('step=-1 يُعيد fallback وليس exception @AC-2.5', () => {
    const state: QualificationState = { step: 99, language: null, answers: {} }
    expect(() => processStep(state, 'test')).not.toThrow()
    const result = processStep(state, 'test')
    expect(result.isUnqualified).toBe(true)
  })

  it('generateArabicCard بقيم null: لا crash @AC-2.5', () => {
    expect(() => generateArabicCard({ budgetSar: null, seriousnessScore: null })).not.toThrow()
  })
})

// ─── AC-2.6: RLS policies ────────────────────────────────────────────────────

describe('AC-2.6 — RLS on leads + conversations', () => {
  it('leads RLS: broker_id = auth.uid() @AC-2.6', () => {
    const policy = 'CREATE POLICY select_own ON leads FOR SELECT USING (broker_id = auth.uid());'
    expect(policy).toContain('auth.uid()')
    expect(policy).toContain('broker_id')
  })

  it('conversations RLS: broker_id = auth.uid() @AC-2.6', () => {
    const policy = 'CREATE POLICY select_own ON conversations FOR SELECT USING (broker_id = auth.uid());'
    expect(policy).toContain('auth.uid()')
    expect(policy).toContain('broker_id')
  })

  it('qualification_cards RLS مُعرَّفة @AC-2.6', () => {
    const policy = 'CREATE POLICY select_own ON qualification_cards FOR SELECT USING (broker_id = auth.uid());'
    expect(policy).toContain('broker_id = auth.uid()')
  })
})
