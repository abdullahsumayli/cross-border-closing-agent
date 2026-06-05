// AC-2.1 / AC-2.2 / AC-2.4: Qualification state machine
// Processes one message at a time, returns the next action

import {
  type SupportedLanguage,
  SUPPORTED_LANGUAGES,
  QUALIFICATION_QUESTIONS,
  UNSUPPORTED_LANGUAGE_FALLBACK,
  initialGreeting,
  checkLegalEligibility,
  unqualifiedMessage,
  detectLanguagePrompt,
} from './prompts'

export interface QualificationState {
  step: number            // 0=initial, 1-5=questions, 6=complete
  language: SupportedLanguage | null
  answers: Partial<{
    budget: string
    timeline: string
    nationality: string
    propertyType: string
    seriousness: string
  }>
}

export interface EngineResult {
  reply: string
  nextStep: number
  isComplete: boolean
  isUnqualified: boolean
  unqualifiedReason?: string
  legalEligibility?: 'eligible' | 'not_eligible' | 'unknown'
  seriousnessScore?: number
}

// AC-2.1: detect language from message text
// In production: calls Claude API. In tests: inject mock.
export async function detectLanguage(
  text: string,
  callClaude: (prompt: string) => Promise<string>
): Promise<SupportedLanguage | 'unknown'> {
  const prompt = detectLanguagePrompt(text)
  const result = await callClaude(prompt)
  const lang = result.trim().toLowerCase() as SupportedLanguage | 'unknown'
  if (SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage)) return lang as SupportedLanguage
  return 'unknown'
}

// AC-2.2: process one step of the qualification flow
export function processStep(
  state: QualificationState,
  incomingMessage: string
): EngineResult {
  const { step, language, answers } = state

  // Step 0: initial message — language already detected, send greeting
  if (step === 0) {
    if (!language) {
      return {
        reply: UNSUPPORTED_LANGUAGE_FALLBACK,
        nextStep: -1,
        isComplete: false,
        isUnqualified: true,
        unqualifiedReason: 'unsupported language',
      }
    }
    return {
      reply: initialGreeting(language),
      nextStep: 1,
      isComplete: false,
      isUnqualified: false,
    }
  }

  // Steps 1-5: collect answers
  if (step >= 1 && step <= 5 && language) {
    const updatedAnswers = { ...answers }

    // Store the incoming message as the answer to the previous question
    switch (step) {
      case 1: updatedAnswers.budget = incomingMessage; break
      case 2: updatedAnswers.timeline = incomingMessage; break
      case 3:
        updatedAnswers.nationality = incomingMessage
        // AC-2.4: check legal eligibility
        const eligibility = checkLegalEligibility(incomingMessage)
        if (eligibility === 'not_eligible') {
          return {
            reply: unqualifiedMessage(language, 'nationality not eligible under Jan 2026 Saudi law'),
            nextStep: -1,
            isComplete: true,
            isUnqualified: true,
            unqualifiedReason: 'nationality_not_eligible',
            legalEligibility: 'not_eligible',
          }
        }
        break
      case 4: updatedAnswers.propertyType = incomingMessage; break
      case 5:
        updatedAnswers.seriousness = incomingMessage
        // Qualification complete — generate card on next call
        const score = parseSeriousness(incomingMessage)
        return {
          reply: getCompletionMessage(language),
          nextStep: 6,
          isComplete: true,
          isUnqualified: false,
          legalEligibility: 'eligible',
          seriousnessScore: score,
        }
    }

    // Ask the next question
    const nextQ = step < 5 ? QUALIFICATION_QUESTIONS[language][step] : ''
    return {
      reply: nextQ,
      nextStep: step + 1,
      isComplete: false,
      isUnqualified: false,
    }
  }

  return {
    reply: UNSUPPORTED_LANGUAGE_FALLBACK,
    nextStep: -1,
    isComplete: false,
    isUnqualified: true,
    unqualifiedReason: 'invalid state',
  }
}

function parseSeriousness(answer: string): number {
  const num = parseInt(answer.replace(/\D/g, ''), 10)
  if (isNaN(num)) return 50
  return Math.min(100, Math.max(0, num * 10))
}

function getCompletionMessage(lang: SupportedLanguage): string {
  const msgs: Record<SupportedLanguage, string> = {
    en: "Thank you! I'm preparing your qualification summary for the broker. You'll hear back soon.",
    zh: "谢谢！我正在为经纪人准备您的资质摘要。您很快就会收到回复。",
    ms: "Terima kasih! Saya sedang menyediakan ringkasan kelayakan anda untuk broker. Anda akan segera mendapat maklum balas.",
    ur: "شکریہ! میں بروکر کے لیے آپ کی اہلیت کا خلاصہ تیار کر رہا ہوں۔ آپ کو جلد جواب ملے گا۔",
    ar: "شكراً! أقوم بإعداد ملخص تأهيلك للوسيط. ستتلقى ردًا قريبًا.",
  }
  return msgs[lang]
}
