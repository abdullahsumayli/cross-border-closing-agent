import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { verifyWebhookSignature, sendWhatsAppMessage, sendQualificationCardTobroker } from '@/lib/whatsapp'
import { detectLanguage, processStep } from '@/lib/qualification/engine'
import { generateArabicCard } from '@/lib/qualification/card-generator'
import { createServiceClient } from '@/lib/supabase/service'
import { syncCardToGHL } from '@/lib/ghl'

// GET: Meta webhook verification challenge
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 })
  }
  return NextResponse.json({ error: 'verification failed' }, { status: 403 })
}

// POST: incoming WhatsApp message
export async function POST(req: NextRequest) {
  // AC-2.1: verify signature — HMAC-SHA256
  const signature = req.headers.get('x-hub-signature-256') ?? ''
  const rawBody = await req.text()

  const appSecret = process.env.WHATSAPP_API_TOKEN ?? ''
  if (appSecret && signature && !verifyWebhookSignature(rawBody, signature, appSecret)) {
    console.error('[WhatsApp webhook] Invalid signature')
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 })
  }

  // Return 200 immediately (Meta requires fast ACK — AC-2.1)
  // Scalability note: this is fire-and-forget. At Weekend MVP scale (<200 brokers,
  // <20 concurrent inquiries) this is fine. At 200+ brokers, add a queue (BullMQ/Upstash)
  // so failed messages retry up to 3× instead of being silently dropped. Revisit at customer #50.
  withRetry(() => processWebhookAsync(rawBody), 3).catch((err) =>
    console.error('[WhatsApp webhook] All retries failed:', err)
  )

  return NextResponse.json({ status: 'ok' }, { status: 200 })
}

// Simple retry with exponential backoff — covers transient DB/API failures
async function withRetry<T>(fn: () => Promise<T>, maxAttempts: number): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (err) {
      if (attempt === maxAttempts) throw err
      const delay = 200 * Math.pow(2, attempt - 1) // 200ms, 400ms, 800ms
      await new Promise((r) => setTimeout(r, delay))
      console.warn(`[WhatsApp webhook] Retry ${attempt}/${maxAttempts - 1}...`)
    }
  }
  throw new Error('unreachable')
}

async function processWebhookAsync(rawBody: string) {
  const body = JSON.parse(rawBody)
  const entry = body.entry?.[0]
  const change = entry?.changes?.[0]
  const message = change?.value?.messages?.[0]

  if (!message || message.type !== 'text') return

  const buyerPhone = message.from
  const messageText: string = message.text.body
  const waMessageId: string = message.id

  const supabase = createServiceClient()

  // Find broker by WhatsApp business number
  const businessPhone = change?.value?.metadata?.display_phone_number
  const { data: broker } = await supabase
    .from('brokers')
    .select('id, whatsapp_business_number')
    .eq('whatsapp_business_number', businessPhone)
    .single()

  if (!broker) {
    console.error('[WhatsApp webhook] No broker found for', businessPhone)
    return
  }

  // Get or create lead
  const { data: existingLead } = await supabase
    .from('leads')
    .select('id, qualification_step, detected_language, nationality, budget_sar, timeline, property_type')
    .eq('broker_id', broker.id)
    .eq('buyer_phone', buyerPhone)
    .eq('status', 'in_progress')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  let lead = existingLead
  if (!lead) {
    // Detect language for new lead (AC-2.1)
    const detectedLang = await detectLanguage(messageText, claudeCall)

    if (detectedLang === 'unknown') {
      // AC-2.5: unsupported language — send helpful message
      await sendWhatsAppMessage(buyerPhone, "I'm sorry, I don't support your language yet. Please contact us at: info@crossborder.sa")
      return
    }

    const { data: newLead } = await supabase
      .from('leads')
      .insert({
        broker_id: broker.id,
        buyer_phone: buyerPhone,
        detected_language: detectedLang,
        qualification_step: 0,
        first_response_at: new Date().toISOString(),
      })
      .select('id, qualification_step, detected_language, nationality, budget_sar, timeline, property_type')
      .single()

    lead = newLead
  }

  if (!lead) return

  // Save inbound message (AC-2.1: DB write حقيقي)
  await supabase.from('conversations').insert({
    lead_id: lead.id,
    broker_id: broker.id,
    direction: 'inbound',
    message_text: messageText,
    language: lead.detected_language,
    wa_message_id: waMessageId,
  })

  // Run qualification engine
  const state = {
    step: lead.qualification_step ?? 0,
    language: lead.detected_language as any,
    answers: {
      nationality: lead.nationality ?? undefined,
      budget: lead.budget_sar?.toString() ?? undefined,
      timeline: lead.timeline ?? undefined,
      propertyType: lead.property_type ?? undefined,
    },
  }

  const result = processStep(state, messageText)

  // Save outbound message
  await supabase.from('conversations').insert({
    lead_id: lead.id,
    broker_id: broker.id,
    direction: 'outbound',
    message_text: result.reply,
    language: lead.detected_language,
  })

  // Send reply to buyer
  await sendWhatsAppMessage(buyerPhone, result.reply)

  // Update lead step
  await supabase.from('leads').update({
    qualification_step: result.nextStep,
    status: result.isUnqualified ? 'unqualified' : result.isComplete ? 'qualified' : 'in_progress',
    unqualified_reason: result.unqualifiedReason ?? null,
    legal_eligibility: result.legalEligibility ?? null,
    seriousness_score: result.seriousnessScore ?? null,
    updated_at: new Date().toISOString(),
  }).eq('id', lead.id)

  // AC-2.3: if complete + qualified → generate card + send to broker
  if (result.isComplete && !result.isUnqualified) {
    const card = generateArabicCard({
      buyerName: buyerPhone,
      detectedLanguage: lead.detected_language ?? 'en',
      budgetSar: lead.budget_sar,
      timeline: lead.timeline,
      legalEligibility: result.legalEligibility,
      seriousnessScore: result.seriousnessScore,
      propertyType: lead.property_type,
      nationality: lead.nationality,
    })

    await supabase.from('qualification_cards').insert({
      lead_id: lead.id,
      broker_id: broker.id,
      budget_sar: lead.budget_sar,
      timeline: lead.timeline,
      property_type: lead.property_type,
      legal_eligibility: result.legalEligibility,
      seriousness_score: result.seriousnessScore,
      card_summary_ar: card,
    })

    // AC-6.1: fire-and-forget GHL sync — GHL down ≠ WhatsApp flow blocked
    void syncCardToGHL(broker.id, {
      buyerPhone,
      buyerName: buyerPhone,
      detectedLanguage: lead.detected_language ?? 'en',
      budgetSar: lead.budget_sar ?? null,
      seriousnessScore: result.seriousnessScore ?? null,
      legalEligibility: result.legalEligibility ?? null,
      timeline: lead.timeline ?? null,
      propertyType: lead.property_type ?? null,
      nationality: lead.nationality ?? null,
      cardSummaryAr: card,
    })

    // Send card to broker
    const { data: brokerRecord } = await supabase
      .from('brokers')
      .select('whatsapp_business_number')
      .eq('id', broker.id)
      .single()

    if (brokerRecord?.whatsapp_business_number) {
      await sendQualificationCardTobroker(brokerRecord.whatsapp_business_number, card)
      await supabase.from('qualification_cards')
        .update({ delivered_to_broker: true, delivered_at: new Date().toISOString() })
        .eq('lead_id', lead.id)
    }
  }
}

// Claude API call wrapper — injectable for testing
async function claudeCall(prompt: string): Promise<string> {
  const client = new Anthropic()
  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 10,
    messages: [{ role: 'user', content: prompt }],
  })
  return (msg.content[0] as { text: string }).text.trim()
}
