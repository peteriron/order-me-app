import { describe, expect, it } from 'vitest'
import { add, emptyRound } from '../round/round.ts'
import type { PlacedRound } from '../history/history.ts'
import { seedCatalog, type Item } from './catalog.ts'
import { decodeCatalog, encodeCatalog, replaceCatalog, sharedPayload, shareLink } from './sharedCatalog.ts'

const ids = () => {
  let n = 0
  return () => `new-${++n}`
}
const drafts = (catalog: Item[]) => catalog.map(({ name, category, emoji }) => ({ name, category, emoji }))

describe('Shared Catalog link', () => {
  it('round-trips the Catalog: names, categories and emoji, including accents, multi-part emoji and long names', async () => {
    const catalog: Item[] = [
      { id: 'a', name: 'Rosé', category: 'drink', emoji: '🍷' },
      { id: 'b', name: 'Kaasblokjes met mosterd en selder', category: 'snack', emoji: '🧀' },
      { id: 'c', name: 'Chef’s “special”', category: 'snack', emoji: '👩‍🍳' },
      { id: 'd', name: 'Zwarte koffie', category: 'drink', emoji: '☕' },
    ]
    expect(await decodeCatalog(await encodeCatalog(catalog))).toEqual(drafts(catalog))
  })

  it('fits the 21-Item starter Catalog well within 500 bytes', async () => {
    for (const locale of ['en', 'nl'] as const) {
      const link = shareLink('https://peteriron.github.io/order-me-app/', await encodeCatalog(seedCatalog(locale, ids())))
      expect(new TextEncoder().encode(link).length).toBeLessThan(450)
    }
  })

  it('puts the Catalog in the fragment of the app’s own address, so it never reaches a server', async () => {
    const payload = await encodeCatalog(seedCatalog('en', ids()))
    const link = shareLink('https://peteriron.github.io/order-me-app/?x=1#old', payload)
    expect(link).toBe(`https://peteriron.github.io/order-me-app/?x=1#items=${payload}`)
    expect(sharedPayload(new URL(link).hash)).toBe(payload)
    expect(sharedPayload('')).toBeNull()
    expect(sharedPayload('#other')).toBeNull()
  })

  it('rejects malformed, truncated or tampered links as a whole', async () => {
    const payload = await encodeCatalog(seedCatalog('en', ids()))
    expect(await decodeCatalog('')).toBeNull()
    expect(await decodeCatalog('not base64!')).toBeNull()
    expect(await decodeCatalog('aGVsbG8')).toBeNull() // "hello", not deflated
    expect(await decodeCatalog(payload.slice(0, payload.length - 12))).toBeNull()
  })

  it('rejects a link whose content is not a valid Catalog', async () => {
    const raw = async (text: string) => {
      const stream = new Blob([text]).stream().pipeThrough(new CompressionStream('deflate-raw'))
      const bytes = new Uint8Array(await new Response(stream).arrayBuffer())
      return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    }
    expect(await decodeCatalog(await raw('1\nd🍺\tDuvel'))).toEqual([{ name: 'Duvel', category: 'drink', emoji: '🍺' }])
    expect(await decodeCatalog(await raw('2\nd🍺\tDuvel'))).toBeNull() // unknown version
    expect(await decodeCatalog(await raw('1'))).toBeNull() // no Items
    expect(await decodeCatalog(await raw('1\nx🍺\tDuvel'))).toBeNull() // unknown category
    expect(await decodeCatalog(await raw('1\nd🍺\t   '))).toBeNull() // no name
    expect(await decodeCatalog(await raw('1\nd\tDuvel'))).toBeNull() // no emoji
    expect(await decodeCatalog(await raw('1\nd🍺🍺\tDuvel'))).toBeNull() // two emoji
  })
})

describe('replacing the Catalog with a Shared Catalog', () => {
  const duvel: Item = { id: 'duvel', name: 'Duvel', category: 'drink', emoji: '🍺' }
  const history: PlacedRound[] = [
    { id: 'r1', placedAt: '2026-09-28T20:00:00.000Z', lines: [{ itemId: 'duvel', name: 'Duvel', category: 'drink', emoji: '🍺', count: 2 }] },
  ]
  const shared = [
    { name: 'Kriek', category: 'drink' as const, emoji: '🍒' },
    { name: 'Nuts', category: 'snack' as const, emoji: '🥜' },
  ]

  it('gives the shared Items fresh ids, empties the Round and drops pins; History is kept', () => {
    const state = { catalog: [duvel], round: add(emptyRound(), 'duvel'), pins: ['duvel'], history }
    const next = { ...state, ...replaceCatalog(shared, ids()) }
    expect(next.catalog).toEqual([
      { id: 'new-1', name: 'Kriek', category: 'drink', emoji: '🍒' },
      { id: 'new-2', name: 'Nuts', category: 'snack', emoji: '🥜' },
    ])
    expect(next.round).toEqual(emptyRound())
    expect(next.pins).toEqual([])
    expect(next.history).toBe(history)
  })
})
