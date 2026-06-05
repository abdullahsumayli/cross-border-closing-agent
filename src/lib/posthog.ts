// PostHog server-side analytics — fetch-based (no new dependency, same pattern as Mailgun)

export async function captureEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>
): Promise<void> {
  const apiKey = process.env.POSTHOG_API_KEY
  const host = process.env.POSTHOG_HOST ?? 'https://app.posthog.com'
  if (!apiKey) return // best-effort: no key = silent skip

  await fetch(`${host}/capture/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      distinct_id: distinctId,
      event,
      properties: { ...properties, $lib: 'cross-border-agent-server' },
    }),
  }).catch(() => {}) // fire-and-forget: PostHog down ≠ feature down
}

export const captureSignup = (brokerId: string) =>
  captureEvent(brokerId, 'signup', { source: 'registration' })

export const capturePayment = (brokerId: string, tier: string, amountSar: number) =>
  captureEvent(brokerId, 'payment', { tier, amount_sar: amountSar, currency: 'SAR' })
