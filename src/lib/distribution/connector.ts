// Story 10 [@Phase2]: connector architecture (AC-10.4).
// Every global platform is a connector implementing this one interface, so a new
// platform is added without touching the engine or the existing connectors.

export interface CanonicalListing {
  id: string
  title: string
  description: string
  propertyType: string
  city: string
  priceSar: number
  areaSqm: number
  bedrooms?: number
  images: string[]
  language: string
}

export type PublishResult =
  | { ok: true; externalRef: string }
  | { ok: false; error: string }

export type ChannelType = 'network' | 'xml_feed' | 'api' | 'manual'

export interface ChannelConnector {
  readonly name: string
  readonly channelType: ChannelType
  publish(listing: CanonicalListing): Promise<PublishResult>
  update(externalRef: string, listing: CanonicalListing): Promise<PublishResult>
  remove(externalRef: string): Promise<PublishResult>
}
