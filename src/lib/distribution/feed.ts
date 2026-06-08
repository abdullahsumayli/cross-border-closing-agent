import type { CanonicalListing } from './connector'

// Story 10 AC-10.1: canonical XML feed. One feed per broker/channel that most
// networks + portals (Rightmove V3 / BLM family) can pull. UTF-8, escaped, up to
// 50 images per property.

const MAX_IMAGES_PER_PROPERTY = 50

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function generateListingFeed(listings: CanonicalListing[]): string {
  const items = listings
    .map((l) => {
      const images = l.images
        .slice(0, MAX_IMAGES_PER_PROPERTY)
        .map((u) => `      <image>${escapeXml(u)}</image>`)
        .join('\n')
      return [
        '  <property>',
        `    <id>${escapeXml(l.id)}</id>`,
        `    <title>${escapeXml(l.title)}</title>`,
        `    <description>${escapeXml(l.description)}</description>`,
        `    <type>${escapeXml(l.propertyType)}</type>`,
        `    <city>${escapeXml(l.city)}</city>`,
        `    <price currency="SAR">${l.priceSar}</price>`,
        `    <area unit="sqm">${l.areaSqm}</area>`,
        l.bedrooms != null ? `    <bedrooms>${l.bedrooms}</bedrooms>` : '',
        `    <language>${escapeXml(l.language)}</language>`,
        '    <images>',
        images,
        '    </images>',
        '  </property>',
      ]
        .filter(Boolean)
        .join('\n')
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>\n<listings>\n${items}\n</listings>`
}
