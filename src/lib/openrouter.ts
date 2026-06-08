// AC-2.1 / AC-2.5: language-detection LLM call via OpenRouter (Claude Haiku).
//
// Fire-and-forget resilience (L-003 pattern): returns 'unknown' on ANY failure
// — missing key, network error, or unexpected response shape — so the WhatsApp
// webhook sends the AC-2.5 fallback message instead of throwing and silently
// dropping the inquiry. The env var name (OPENROUTER_API_KEY) matches .env.example;
// the endpoint is OpenRouter, not Anthropic, so the previous ANTHROPIC_API_KEY
// reference produced `Bearer undefined` on any deploy that followed the contract.

export async function detectLanguageViaOpenRouter(prompt: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    console.error('[openrouter] OPENROUTER_API_KEY missing — falling back to unknown language')
    return 'unknown'
  }

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-haiku-4-5',
        max_tokens: 10,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await res.json()
    const content = data?.choices?.[0]?.message?.content
    if (typeof content !== 'string') {
      console.error('[openrouter] Unexpected response shape:', JSON.stringify(data).slice(0, 200))
      return 'unknown'
    }
    return content.trim()
  } catch (err) {
    console.error('[openrouter] request failed:', err)
    return 'unknown'
  }
}
