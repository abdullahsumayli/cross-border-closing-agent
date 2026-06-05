// AC-2.3: Arabic qualification card generator
// Card is sent to broker via WhatsApp template

export interface LeadData {
  buyerName?: string
  detectedLanguage?: string
  budgetSar?: number | null
  timeline?: string | null
  legalEligibility?: string
  seriousnessScore?: number | null
  propertyType?: string | null
  nationality?: string | null
}

export function generateArabicCard(lead: LeadData): string {
  const lang = LANGUAGE_NAMES[lead.detectedLanguage ?? 'en'] ?? (lead.detectedLanguage ?? 'غير محدد')
  const budget = lead.budgetSar ? `${lead.budgetSar.toLocaleString('ar-SA')} ريال` : 'لم يُحدَّد'
  const eligibility = ELIGIBILITY_LABELS[lead.legalEligibility ?? 'unknown'] ?? 'غير معروف'
  const score = lead.seriousnessScore != null ? `${lead.seriousnessScore}/100` : 'لم يُقيَّم'

  return `🟢 بطاقة تأهيل جديدة

الاسم: ${lead.buyerName ?? 'غير محدد'}
اللغة: ${lang}
الجنسية: ${lead.nationality ?? 'لم تُذكَر'}
الميزانية: ${budget}
الجدول الزمني: ${lead.timeline ?? 'لم يُحدَّد'}
نوع العقار: ${lead.propertyType ?? 'لم يُحدَّد'}
الأهلية القانونية: ${eligibility}
درجة الجدية: ${score}

📲 تواصل مع المشتري — اللغة: ${lang}`
}

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'إنجليزي',
  zh: 'صيني',
  ms: 'ملايو',
  ur: 'أردو',
  ar: 'عربي',
}

const ELIGIBILITY_LABELS: Record<string, string> = {
  eligible: 'مؤهَّل قانونياً ✓',
  not_eligible: 'غير مؤهَّل ✗',
  unknown: 'يحتاج تحقق',
}

export function validateCard(card: string): { valid: boolean; missing: string[] } {
  const missing: string[] = []
  if (!card.includes('بطاقة تأهيل')) missing.push('header')
  if (!card.includes('الميزانية')) missing.push('budget')
  if (!card.includes('الأهلية')) missing.push('eligibility')
  if (!card.includes('الجدية')) missing.push('seriousness')
  return { valid: missing.length === 0, missing }
}
