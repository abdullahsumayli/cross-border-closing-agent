import type { SupportedLanguage } from './qualification/prompts'

// Story 9 [@Phase2]: AI multilingual real-estate ad generator.
// Reuses the same 5 MVP languages as the qualification engine (Story 2) so a buyer's
// inquiry language and the listing they saw stay aligned.

export const AD_LANGUAGES: SupportedLanguage[] = ['en', 'zh', 'ms', 'ur', 'ar']

const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  en: 'English',
  zh: 'Chinese (Simplified)',
  ms: 'Malay',
  ur: 'Urdu',
  ar: 'Arabic',
}

export interface PropertyInput {
  propertyType: string
  city: string
  priceSar: number
  areaSqm: number
  bedrooms?: number
  features?: string[]
}

export interface AdCopy {
  title: string
  description: string
}

// AC-9.1: the input the broker fills once before generation.
export function validateProperty(p: Partial<PropertyInput>): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  if (!p.propertyType) errors.push('propertyType required')
  if (!p.city) errors.push('city required')
  if (p.priceSar == null || p.priceSar <= 0) errors.push('priceSar must be positive')
  if (p.areaSqm == null || p.areaSqm <= 0) errors.push('areaSqm must be positive')
  return { valid: errors.length === 0, errors }
}

// AC-9.2: one prompt builder for every language → uniform professional tone.
export function buildAdPrompt(property: PropertyInput, language: SupportedLanguage): string {
  const langName = LANGUAGE_NAMES[language]
  const features = (property.features ?? []).join(', ')
  return [
    'You are a professional real-estate copywriter for the Saudi cross-border market.',
    `Write a compelling property listing in ${langName} for a foreign buyer.`,
    'Keep a consistent professional, trustworthy tone. Do not invent facts.',
    `Property: type=${property.propertyType}, city=${property.city}, price=${property.priceSar} SAR,`,
    `area=${property.areaSqm} sqm, bedrooms=${property.bedrooms ?? 'n/a'}, features=${features || 'none'}.`,
    `Respond ONLY as JSON: {"title": "...", "description": "..."} written in ${langName}.`,
  ].join(' ')
}

// Robustly parse the model output; never block publishing on a malformed response.
export function parseAdCopy(raw: string, property: PropertyInput, language: SupportedLanguage): AdCopy {
  try {
    const cleaned = raw.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim()
    const obj = JSON.parse(cleaned)
    if (typeof obj.title === 'string' && typeof obj.description === 'string') {
      return { title: obj.title.trim(), description: obj.description.trim() }
    }
  } catch {
    /* fall through to deterministic fallback */
  }
  void language
  return {
    title: `${property.propertyType} — ${property.city}`,
    description:
      raw.trim() ||
      `${property.propertyType} in ${property.city}, ${property.priceSar} SAR, ${property.areaSqm} sqm.`,
  }
}

// AC-9.1: generate one language's copy. aiCall injected → unit-testable.
export async function generateAdCopy(
  property: PropertyInput,
  language: SupportedLanguage,
  aiCall: (prompt: string) => Promise<string>
): Promise<AdCopy> {
  const raw = await aiCall(buildAdPrompt(property, language))
  return parseAdCopy(raw, property, language)
}

// AC-9.2: generate all five languages with the uniform tone, in parallel.
export async function generateAllTranslations(
  property: PropertyInput,
  aiCall: (prompt: string) => Promise<string>
): Promise<Record<SupportedLanguage, AdCopy>> {
  const entries = await Promise.all(
    AD_LANGUAGES.map(async (lang) => [lang, await generateAdCopy(property, lang, aiCall)] as const)
  )
  return Object.fromEntries(entries) as Record<SupportedLanguage, AdCopy>
}

// AC-9.3: upsert payload for a per-language translation; broker edits flip the flags.
export function buildTranslationPayload(
  propertyId: string,
  language: SupportedLanguage,
  copy: AdCopy,
  editedByBroker: boolean
) {
  return {
    property_id: propertyId,
    language,
    title: copy.title,
    description: copy.description,
    generated_by_ai: !editedByBroker,
    edited_by_broker: editedByBroker,
    updated_at: new Date().toISOString(),
  }
}

// AC-9.4: UTF-8-safe storage path, no count cap (index can grow unbounded).
export function buildImageStoragePath(propertyId: string, originalName: string, index: number): string {
  const safe = originalName.normalize('NFC').replace(/[/\\?%*:|"<>]/g, '_')
  return `properties/${propertyId}/${index}-${safe}`
}
