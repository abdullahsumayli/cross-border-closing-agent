// AC-2.1: language detection + per-language question templates
// AC-2.4: legal eligibility by nationality (قانون يناير 2026)

export type SupportedLanguage = 'en' | 'zh' | 'ms' | 'ur' | 'ar'

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['en', 'zh', 'ms', 'ur', 'ar']

// AC-2.5: fallback for unsupported languages
export const UNSUPPORTED_LANGUAGE_FALLBACK =
  "I'm sorry, I don't support your language yet. Please contact us via email: info@crossborder.sa"

// Countries eligible under Jan 2026 Saudi foreign ownership law
// Source: قانون التملّك العقاري للأجانب يناير 2026
export const ELIGIBLE_NATIONALITIES: string[] = [
  'malaysian', 'malay', 'turkish', 'pakistani', 'indonesian',
  'chinese', 'british', 'american', 'french', 'german',
  'emirati', 'kuwaiti', 'bahraini', 'qatari', 'omani', 'jordanian',
]

export const RESTRICTED_NATIONALITIES: string[] = [
  'israeli', // restricted per law
]

export function detectLanguagePrompt(text: string): string {
  return `Detect the language of this message. Reply with ONLY one of: en, zh, ms, ur, ar.
If the language is not one of these five, reply with: unknown.
Message: "${text}"`
}

// Qualification questions per language (AC-2.2)
export const QUALIFICATION_QUESTIONS: Record<SupportedLanguage, string[]> = {
  en: [
    "What is your budget for this property? (in Saudi Riyals or your local currency)",
    "What is your timeline for purchasing? (e.g., within 3 months, 6 months, 1 year)",
    "What is your nationality? This helps us verify your eligibility under Saudi law.",
    "What type of property are you looking for? (apartment, villa, commercial)",
    "How serious are you about purchasing? (1=just browsing, 10=ready to buy now)",
  ],
  zh: [
    "您的购房预算是多少？（以沙特里亚尔或您当地货币计）",
    "您计划何时购房？（例如：3个月内、6个月内、1年内）",
    "您的国籍是什么？这将帮助我们确认您在沙特法律下的资格。",
    "您在寻找什么类型的房产？（公寓、别墅、商业地产）",
    "您购房的意向有多强烈？（1=只是浏览，10=准备立即购买）",
  ],
  ms: [
    "Apakah bajet anda untuk hartanah ini? (dalam Riyal Saudi atau mata wang tempatan anda)",
    "Apakah tempoh masa anda untuk membeli? (contoh: dalam 3 bulan, 6 bulan, 1 tahun)",
    "Apakah kewarganegaraan anda? Ini membantu kami mengesahkan kelayakan anda di bawah undang-undang Saudi.",
    "Apakah jenis hartanah yang anda cari? (pangsapuri, vila, komersial)",
    "Seberapa serius anda untuk membeli? (1=sekadar melayari, 10=bersedia beli sekarang)",
  ],
  ur: [
    "اس جائیداد کے لیے آپ کا بجٹ کیا ہے؟ (سعودی ریال یا اپنی مقامی کرنسی میں)",
    "خریداری کے لیے آپ کی ٹائم لائن کیا ہے؟ (مثلاً: 3 مہینے، 6 مہینے، 1 سال میں)",
    "آپ کی قومیت کیا ہے؟ اس سے سعودی قانون کے تحت آپ کی اہلیت تصدیق ہوگی۔",
    "آپ کس قسم کی جائیداد تلاش کر رہے ہیں؟ (اپارٹمنٹ، ولا، کمرشل)",
    "آپ خریداری کے بارے میں کتنے سنجیدہ ہیں؟ (1=صرف دیکھ رہا ہوں، 10=ابھی خریدنے کے لیے تیار)",
  ],
  ar: [
    "ما هي ميزانيتك لهذا العقار؟ (بالريال السعودي)",
    "ما هو جدولك الزمني للشراء؟ (مثل: خلال 3 أشهر، 6 أشهر، سنة)",
    "ما هي جنسيتك؟ هذا يساعدنا في التحقق من أهليتك وفق النظام السعودي.",
    "ما نوع العقار الذي تبحث عنه؟ (شقة، فيلا، تجاري)",
    "ما مدى جدية رغبتك في الشراء؟ (1=أتصفح فقط، 10=مستعد للشراء الآن)",
  ],
}

export function initialGreeting(lang: SupportedLanguage): string {
  const greetings: Record<SupportedLanguage, string> = {
    en: "Hello! I'm here to help you with property inquiries in Riyadh. I'll ask you 5 quick questions to match you with the right opportunity. Is that okay?",
    zh: "您好！我在这里帮助您了解利雅得的房产。我将询问您5个简短的问题，为您匹配合适的机会。可以吗？",
    ms: "Helo! Saya di sini untuk membantu anda dengan pertanyaan hartanah di Riyadh. Saya akan mengemukakan 5 soalan ringkas untuk memadankan anda dengan peluang yang tepat. Boleh?",
    ur: "ہیلو! میں ریاض میں جائیداد کے بارے میں آپ کی مدد کے لیے یہاں ہوں۔ میں آپ سے 5 مختصر سوالات پوچھوں گا تاکہ آپ کے لیے صحیح موقع تلاش کر سکوں۔ ٹھیک ہے؟",
    ar: "مرحباً! أنا هنا للمساعدة في استفساراتك العقارية في الرياض. سأطرح عليك 5 أسئلة سريعة لنجد لك الفرصة المناسبة. هل أنت موافق؟",
  }
  return greetings[lang]
}

export function checkLegalEligibility(nationality: string): 'eligible' | 'not_eligible' | 'unknown' {
  const lower = nationality.toLowerCase()
  if (RESTRICTED_NATIONALITIES.some((r) => lower.includes(r))) return 'not_eligible'
  if (ELIGIBLE_NATIONALITIES.some((e) => lower.includes(e))) return 'eligible'
  // Default to eligible for most nationalities under Jan 2026 law
  // except explicitly restricted
  return 'eligible'
}

export function unqualifiedMessage(lang: SupportedLanguage, reason: string): string {
  const msgs: Record<SupportedLanguage, string> = {
    en: `Thank you for your interest. Unfortunately, based on current Saudi regulations, we're unable to process this inquiry. Reason: ${reason}`,
    zh: `感谢您的关注。很遗憾，根据沙特现行法规，我们无法处理此询盘。原因：${reason}`,
    ms: `Terima kasih atas minat anda. Malangnya, berdasarkan peraturan Saudi semasa, kami tidak dapat memproses pertanyaan ini. Sebab: ${reason}`,
    ur: `آپ کی دلچسپی کا شکریہ۔ بدقسمتی سے، موجودہ سعودی ضوابط کی بنا پر ہم اس استفسار پر کارروائی نہیں کر سکتے۔ وجہ: ${reason}`,
    ar: `شكراً لاهتمامك. للأسف، بناءً على الأنظمة السعودية الحالية، لا يمكننا معالجة هذا الاستفسار. السبب: ${reason}`,
  }
  return msgs[lang]
}
