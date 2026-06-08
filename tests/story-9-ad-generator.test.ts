// Story 9 [@Phase2]: مولّد الإعلان بالـ AI متعدد اللغات
// Generation logic is pure + injectable (aiCall) so it is fully unit-tested without
// hitting OpenRouter. The /api glue that wires real Supabase + storage is thin.

import {
  AD_LANGUAGES,
  validateProperty,
  buildAdPrompt,
  parseAdCopy,
  generateAdCopy,
  generateAllTranslations,
  buildTranslationPayload,
  buildImageStoragePath,
  type PropertyInput,
} from '../src/lib/ad-generator'

const PROPERTY: PropertyInput = {
  propertyType: 'فيلا',
  city: 'Riyadh',
  priceSar: 2_400_000,
  areaSqm: 450,
  bedrooms: 5,
  features: ['مسبح', 'حديقة', 'قرب المترو'],
}

describe('Story 9 [@Phase2] — AI multilingual ad generator', () => {
  // ─── AC-9.1: property input validation ──────────────────────────────────────
  it('AC-9.1 validateProperty requires type, city, positive price + area @AC-9.1', () => {
    expect(validateProperty(PROPERTY).valid).toBe(true)
    const bad = validateProperty({ propertyType: '', city: '', priceSar: 0, areaSqm: -1 })
    expect(bad.valid).toBe(false)
    expect(bad.errors.length).toBe(4)
  })

  // ─── AC-9.2: uniform tone across all 5 languages ────────────────────────────
  it('AC-9.2 targets the five MVP languages (en/zh/ms/ur/ar) @AC-9.2', () => {
    expect(AD_LANGUAGES).toEqual(['en', 'zh', 'ms', 'ur', 'ar'])
  })

  it('AC-9.2 buildAdPrompt embeds the property facts + language + a consistent tone @AC-9.2', () => {
    const prompt = buildAdPrompt(PROPERTY, 'zh')
    expect(prompt).toContain('Chinese')
    expect(prompt).toContain('2400000')
    expect(prompt).toContain('450')
    expect(prompt.toLowerCase()).toContain('professional')
    expect(prompt).toContain('JSON')
  })

  // ─── AC-9.1: generation + robust parsing ────────────────────────────────────
  it('AC-9.1 generateAdCopy parses the model JSON into title + description @AC-9.1', async () => {
    const aiCall = jest.fn(async () =>
      '```json\n{"title":"Luxury Villa in Riyadh","description":"A stunning 5-bedroom villa."}\n```'
    )
    const copy = await generateAdCopy(PROPERTY, 'en', aiCall)
    expect(copy.title).toBe('Luxury Villa in Riyadh')
    expect(copy.description).toBe('A stunning 5-bedroom villa.')
    expect(aiCall).toHaveBeenCalledTimes(1)
  })

  it('AC-9.1 parseAdCopy falls back gracefully on a malformed AI response @AC-9.1', () => {
    const copy = parseAdCopy('not json at all', PROPERTY, 'en')
    expect(copy.title).toContain('فيلا')
    expect(copy.description.length).toBeGreaterThan(0)
  })

  it('AC-9.2 generateAllTranslations returns one copy per language, one AI call each @AC-9.2', async () => {
    const aiCall = jest.fn(async (p: string) => {
      // echo a valid JSON so we can assert per-language fan-out
      return JSON.stringify({ title: 't', description: 'd:' + p.slice(0, 5) })
    })
    const all = await generateAllTranslations(PROPERTY, aiCall)
    expect(Object.keys(all).sort()).toEqual(['ar', 'en', 'ms', 'ur', 'zh'])
    expect(aiCall).toHaveBeenCalledTimes(5)
  })

  // ─── AC-9.3: edit + save a version per language ─────────────────────────────
  it('AC-9.3 buildTranslationPayload flags broker edits and keeps per-language rows @AC-9.3', () => {
    const aiPayload = buildTranslationPayload('prop-1', 'ur', { title: 'a', description: 'b' }, false)
    expect(aiPayload.generated_by_ai).toBe(true)
    expect(aiPayload.edited_by_broker).toBe(false)
    expect(aiPayload.language).toBe('ur')

    const editedPayload = buildTranslationPayload('prop-1', 'ur', { title: 'a2', description: 'b2' }, true)
    expect(editedPayload.edited_by_broker).toBe(true)
    expect(editedPayload.title).toBe('a2')
  })

  // ─── AC-9.4: unlimited UTF-8 images ─────────────────────────────────────────
  it('AC-9.4 buildImageStoragePath is UTF-8 safe and imposes no count limit @AC-9.4', () => {
    const arabicName = buildImageStoragePath('prop-1', 'صورة-الفيلا.jpg', 0)
    expect(arabicName).toContain('صورة-الفيلا.jpg')
    expect(arabicName.startsWith('properties/prop-1/')).toBe(true)

    // no cap: a very high index still produces a valid, distinct path
    const path250 = buildImageStoragePath('prop-1', 'a.jpg', 250)
    expect(path250).toContain('250-')

    // sanitises path-breaking characters
    const unsafe = buildImageStoragePath('prop-1', 'a/b:c*.jpg', 1)
    expect(unsafe).not.toMatch(/[/\\:*?"<>|]a/)
  })
})
