import type { CanonicalListing, ChannelConnector, PublishResult } from './connector'
import { getConnector as defaultGetConnector } from './registry'

// Story 10 AC-10.1 / AC-10.2 / AC-10.3: orchestrate publish/update/remove across the
// selected channels, tracking per-channel status with retry on failure.

export interface DistributionOutcome {
  channel: string
  status: 'published' | 'failed' | 'removed'
  externalRef?: string
  error?: string
  retryCount: number
}

interface EngineOpts {
  maxRetries?: number
  getConnector?: (name: string) => ChannelConnector | undefined
}

async function withRetry(
  fn: () => Promise<PublishResult>,
  maxRetries: number
): Promise<{ result: PublishResult; retryCount: number }> {
  let attempt = 0
  let result: PublishResult = { ok: false, error: 'not attempted' }
  while (attempt < maxRetries) {
    result = await fn()
    if (result.ok) break
    attempt++
  }
  return { result, retryCount: attempt }
}

// AC-10.1 + AC-10.2: publish a listing to each selected channel, one click.
export async function publishToChannels(
  listing: CanonicalListing,
  channels: string[],
  opts: EngineOpts = {}
): Promise<DistributionOutcome[]> {
  const maxRetries = opts.maxRetries ?? 3
  const resolve = opts.getConnector ?? defaultGetConnector
  const outcomes: DistributionOutcome[] = []

  for (const channel of channels) {
    const connector = resolve(channel)
    if (!connector) {
      outcomes.push({ channel, status: 'failed', error: 'no connector registered', retryCount: 0 })
      continue
    }
    const { result, retryCount } = await withRetry(() => connector.publish(listing), maxRetries)
    outcomes.push(
      result.ok
        ? { channel, status: 'published', externalRef: result.externalRef, retryCount }
        : { channel, status: 'failed', error: result.error, retryCount }
    )
  }
  return outcomes
}

export interface ChannelRef {
  channel: string
  externalRef: string
}

// AC-10.3: propagate an edit across every linked channel.
export async function updateOnChannels(
  listing: CanonicalListing,
  refs: ChannelRef[],
  opts: EngineOpts = {}
): Promise<DistributionOutcome[]> {
  const maxRetries = opts.maxRetries ?? 3
  const resolve = opts.getConnector ?? defaultGetConnector
  const outcomes: DistributionOutcome[] = []

  for (const { channel, externalRef } of refs) {
    const connector = resolve(channel)
    if (!connector) {
      outcomes.push({ channel, status: 'failed', error: 'no connector registered', retryCount: 0 })
      continue
    }
    const { result, retryCount } = await withRetry(() => connector.update(externalRef, listing), maxRetries)
    outcomes.push(
      result.ok
        ? { channel, status: 'published', externalRef: result.externalRef, retryCount }
        : { channel, status: 'failed', error: result.error, retryCount }
    )
  }
  return outcomes
}

// AC-10.3: propagate a delete across every linked channel.
export async function removeFromChannels(
  refs: ChannelRef[],
  opts: EngineOpts = {}
): Promise<DistributionOutcome[]> {
  const maxRetries = opts.maxRetries ?? 3
  const resolve = opts.getConnector ?? defaultGetConnector
  const outcomes: DistributionOutcome[] = []

  for (const { channel, externalRef } of refs) {
    const connector = resolve(channel)
    if (!connector) {
      outcomes.push({ channel, status: 'failed', error: 'no connector registered', retryCount: 0 })
      continue
    }
    const { result, retryCount } = await withRetry(() => connector.remove(externalRef), maxRetries)
    outcomes.push(
      result.ok
        ? { channel, status: 'removed', externalRef: result.externalRef, retryCount }
        : { channel, status: 'failed', error: result.error, retryCount }
    )
  }
  return outcomes
}
