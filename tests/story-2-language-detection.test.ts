// Story 2 [@WeekendMVP] [loop:domain] — regression guard for the OpenRouter
// language-detection call. Catches the migration bug where the webhook read
// ANTHROPIC_API_KEY while .env.example documents OPENROUTER_API_KEY (→ Bearer
// undefined → language detection silently failing on every clean deploy).

import { detectLanguageViaOpenRouter } from '../src/lib/openrouter'

const originalFetch = global.fetch
const originalKey = process.env.OPENROUTER_API_KEY

afterEach(() => {
  global.fetch = originalFetch
  process.env.OPENROUTER_API_KEY = originalKey
  jest.restoreAllMocks()
})

describe('Story 2 — OpenRouter language detection', () => {
  // @AC-2.5: API/credential failure must degrade gracefully, never throw
  it('@AC-2.5 returns "unknown" (no throw) when OPENROUTER_API_KEY is missing', async () => {
    delete process.env.OPENROUTER_API_KEY
    const calls: unknown[] = []
    global.fetch = jest.fn((...args) => { calls.push(args); return Promise.resolve(new Response()) }) as unknown as typeof fetch
    jest.spyOn(console, 'error').mockImplementation(() => {})

    await expect(detectLanguageViaOpenRouter('hello')).resolves.toBe('unknown')
    // must short-circuit before hitting the network with a bad/empty key
    expect(calls).toHaveLength(0)
  })

  // @AC-2.5: malformed provider response must not crash the webhook
  it('@AC-2.5 returns "unknown" on an unexpected response shape', async () => {
    process.env.OPENROUTER_API_KEY = 'sk-or-test'
    global.fetch = jest.fn(() =>
      Promise.resolve({ json: () => Promise.resolve({ error: 'rate_limited' }) })
    ) as unknown as typeof fetch
    jest.spyOn(console, 'error').mockImplementation(() => {})

    await expect(detectLanguageViaOpenRouter('hello')).resolves.toBe('unknown')
  })

  // @AC-2.5: network rejection must be swallowed into the fallback
  it('@AC-2.5 returns "unknown" when fetch rejects (network error)', async () => {
    process.env.OPENROUTER_API_KEY = 'sk-or-test'
    global.fetch = jest.fn(() => Promise.reject(new Error('ECONNRESET'))) as unknown as typeof fetch
    jest.spyOn(console, 'error').mockImplementation(() => {})

    await expect(detectLanguageViaOpenRouter('hello')).resolves.toBe('unknown')
  })

  // @AC-2.1: happy path — trimmed language code from the model is returned
  it('@AC-2.1 returns the trimmed language code on success', async () => {
    process.env.OPENROUTER_API_KEY = 'sk-or-test'
    let sentAuth = ''
    global.fetch = jest.fn((_url: string, init: RequestInit) => {
      sentAuth = (init.headers as Record<string, string>)['Authorization']
      return Promise.resolve({
        json: () => Promise.resolve({ choices: [{ message: { content: '  ur \n' } }] }),
      })
    }) as unknown as typeof fetch

    await expect(detectLanguageViaOpenRouter('السلام علیکم')).resolves.toBe('ur')
    // the key actually used must be the one .env.example documents
    expect(sentAuth).toBe('Bearer sk-or-test')
  })
})
