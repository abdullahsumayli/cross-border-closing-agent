import type { ChannelConnector } from './connector'

// Story 10 AC-10.4: connector registry. Registering a new platform never breaks the
// existing ones — they are independent entries keyed by channel name.

const registry = new Map<string, ChannelConnector>()

export function registerConnector(connector: ChannelConnector): void {
  registry.set(connector.name, connector)
}

export function getConnector(name: string): ChannelConnector | undefined {
  return registry.get(name)
}

export function listConnectors(): string[] {
  return [...registry.keys()]
}

export function clearConnectors(): void {
  registry.clear()
}
