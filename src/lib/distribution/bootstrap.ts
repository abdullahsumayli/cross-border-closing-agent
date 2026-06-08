import { registerConnector, getConnector } from './registry'
import { createMockConnector, PLANNED_CHANNELS } from './connectors/mock-connector'

// Story 10: register the vetted platforms as mock connectors (idempotent).
// Each is replaced by a real ChannelConnector once its live credentials exist —
// no engine or route change needed (AC-10.4). BLOCKED ON HUMAN ACTION (L-001):
// live platform accounts.
let bootstrapped = false

export function registerPlannedConnectors(): void {
  if (bootstrapped) return
  for (const ch of PLANNED_CHANNELS) {
    if (!getConnector(ch.name)) registerConnector(createMockConnector(ch.name, ch.channelType))
  }
  bootstrapped = true
}
