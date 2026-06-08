// Story 10 [@Phase2]: محرك التوزيع العالمي + شبكة الموصّلات
// The connector architecture, feed, and engine are fully unit-tested with a mock
// connector. Live platform integrations (Properstar, TheMoveChannel, …) are blocked
// on real accounts (L-001) — they slot into the same registry without engine changes.

import type { CanonicalListing } from '../src/lib/distribution/connector'
import {
  registerConnector,
  getConnector,
  listConnectors,
  clearConnectors,
} from '../src/lib/distribution/registry'
import { createMockConnector, PLANNED_CHANNELS } from '../src/lib/distribution/connectors/mock-connector'
import { generateListingFeed } from '../src/lib/distribution/feed'
import {
  publishToChannels,
  updateOnChannels,
  removeFromChannels,
} from '../src/lib/distribution/engine'

const LISTING: CanonicalListing = {
  id: 'prop-1',
  title: 'Villa & Garden <Riyadh>',
  description: 'A "stunning" villa',
  propertyType: 'فيلا',
  city: 'Riyadh',
  priceSar: 2_400_000,
  areaSqm: 450,
  bedrooms: 5,
  images: ['https://cdn/img1.jpg', 'https://cdn/img2.jpg'],
  language: 'en',
}

afterEach(() => clearConnectors())

describe('Story 10 [@Phase2] — distribution engine + connectors', () => {
  // ─── AC-10.4: connector extensibility ───────────────────────────────────────
  it('AC-10.4 registering a new connector does not break existing ones @AC-10.4', () => {
    registerConnector(createMockConnector('properstar', 'network'))
    registerConnector(createMockConnector('themovechannel', 'xml_feed'))
    expect(listConnectors().sort()).toEqual(['properstar', 'themovechannel'])
    expect(getConnector('properstar')?.channelType).toBe('network')
    expect(getConnector('unknown')).toBeUndefined()

    // add a third — the first two are untouched
    registerConnector(createMockConnector('juwai', 'manual'))
    expect(listConnectors()).toContain('properstar')
    expect(listConnectors()).toHaveLength(3)
  })

  it('AC-10.4 every vetted platform in the spec is a registerable connector @AC-10.4', () => {
    for (const ch of PLANNED_CHANNELS) registerConnector(createMockConnector(ch.name, ch.channelType))
    expect(listConnectors()).toHaveLength(PLANNED_CHANNELS.length)
  })

  // ─── AC-10.1: canonical XML feed ────────────────────────────────────────────
  it('AC-10.1 generateListingFeed emits UTF-8 XML and escapes special chars @AC-10.1', () => {
    const xml = generateListingFeed([LISTING])
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true)
    expect(xml).toContain('Villa &amp; Garden &lt;Riyadh&gt;')
    expect(xml).toContain('&quot;stunning&quot;')
    expect(xml).toContain('<price currency="SAR">2400000</price>')
    expect(xml).toContain('فيلا') // Arabic preserved
    expect((xml.match(/<image>/g) ?? []).length).toBe(2)
  })

  // ─── AC-10.1 + AC-10.2: publish with status + retry ─────────────────────────
  it('AC-10.1 publishes to each selected channel in one call @AC-10.1', async () => {
    registerConnector(createMockConnector('properstar', 'network'))
    registerConnector(createMockConnector('themovechannel', 'xml_feed'))
    const outcomes = await publishToChannels(LISTING, ['properstar', 'themovechannel'])
    expect(outcomes.map((o) => o.status)).toEqual(['published', 'published'])
    expect(outcomes[0].externalRef).toBe('properstar:prop-1')
  })

  it('AC-10.2 retries a transient failure then succeeds, and tracks retryCount @AC-10.2', async () => {
    registerConnector(createMockConnector('flaky', 'xml_feed', { failTimes: 1 }))
    const [outcome] = await publishToChannels(LISTING, ['flaky'], { maxRetries: 3 })
    expect(outcome.status).toBe('published')
    expect(outcome.retryCount).toBe(1)
  })

  it('AC-10.2 marks a channel failed after exhausting retries @AC-10.2', async () => {
    registerConnector(createMockConnector('down', 'xml_feed', { failTimes: 99 }))
    const [outcome] = await publishToChannels(LISTING, ['down'], { maxRetries: 3 })
    expect(outcome.status).toBe('failed')
    expect(outcome.retryCount).toBe(3)
    expect(outcome.error).toContain('down')
  })

  it('AC-10.2 a missing connector is reported as failed, not thrown @AC-10.2', async () => {
    const [outcome] = await publishToChannels(LISTING, ['not-registered'])
    expect(outcome.status).toBe('failed')
    expect(outcome.error).toBe('no connector registered')
  })

  // ─── AC-10.3: update + remove sync across channels ──────────────────────────
  it('AC-10.3 update + remove propagate across every linked channel @AC-10.3', async () => {
    registerConnector(createMockConnector('properstar', 'network'))
    registerConnector(createMockConnector('juwai', 'manual'))
    const refs = [
      { channel: 'properstar', externalRef: 'properstar:prop-1' },
      { channel: 'juwai', externalRef: 'juwai:prop-1' },
    ]
    const updated = await updateOnChannels(LISTING, refs)
    expect(updated.every((o) => o.status === 'published')).toBe(true)

    const removed = await removeFromChannels(refs)
    expect(removed.map((o) => o.status)).toEqual(['removed', 'removed'])
  })
})
