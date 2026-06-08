import type { ChannelConnector, ChannelType, PublishResult } from '../connector'

// Story 10: stand-in connector for platforms whose live integration is blocked on a
// real account (Properstar, TheMoveChannel, Rightmove Overseas, Juwai, …). It proves
// the engine + retry + status flow end-to-end and is swapped for a real connector
// once credentials exist — without changing the engine (AC-10.4).

export function createMockConnector(
  name: string,
  channelType: ChannelType = 'xml_feed',
  opts: { failTimes?: number } = {}
): ChannelConnector {
  let failsLeft = opts.failTimes ?? 0
  return {
    name,
    channelType,
    async publish(listing): Promise<PublishResult> {
      if (failsLeft > 0) {
        failsLeft--
        return { ok: false, error: `transient failure on ${name}` }
      }
      return { ok: true, externalRef: `${name}:${listing.id}` }
    },
    async update(externalRef): Promise<PublishResult> {
      return { ok: true, externalRef }
    },
    async remove(externalRef): Promise<PublishResult> {
      return { ok: true, externalRef }
    },
  }
}

// The platforms vetted in architecture/distribution-layer-spec.md §6 that accept a
// Saudi source. Registered as mocks until each one's live credentials arrive.
export const PLANNED_CHANNELS: Array<{ name: string; channelType: ChannelType }> = [
  { name: 'properstar', channelType: 'network' },
  { name: 'themovechannel', channelType: 'xml_feed' },
  { name: 'rightmove_overseas', channelType: 'xml_feed' },
  { name: 'juwai', channelType: 'manual' },
  { name: 'jamesedition', channelType: 'xml_feed' },
  { name: 'bayut', channelType: 'api' },
]
