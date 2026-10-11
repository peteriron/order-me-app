import { describe, expect, it } from 'vitest'
import { add, emptyRound } from '../round/round.ts'
import type { PlacedRound } from '../history/history.ts'
import { seedCatalog, type Item } from './catalog.ts'
import type { Groups } from './groups.ts'
import { pack } from '../shared/shareLink.ts'
import { decodeCatalog, encodeCatalog, replaceCatalog, sharedItemCount, sharedPayload, shareLink } from './sharedCatalog.ts'
import { localizeCatalog, localizeGroups } from './starter.ts'

const ids = () => {
  let n = 0
  return () => `new-${++n}`
}
const starter = (locale: 'en' | 'nl' = 'en') => seedCatalog(locale, ids())
const encodeStarter = (locale: 'en' | 'nl' = 'en') => {
  const { catalog, groups } = starter(locale)
  return encodeCatalog(catalog, groups)
}

/** Packs link text the way the app does, for hand-written payloads. */
const raw = async (text: string) => pack(text)

describe('Shared Catalog link', () => {
  it('round-trips groups and Items: names and emoji, including accents, multi-part emoji and long names', async () => {
    const groups: Groups = [
      { id: 'w', name: 'Wijntjes', colour: 3 },
      { id: 's', name: 'Hapjes & co', colour: 0 },
      { id: 'e', name: 'Empty for now', colour: 1 },
    ]
    const catalog: Item[] = [
      { id: 'a', name: 'Rosé', group: 'w', emoji: '🍷' },
      { id: 'b', name: 'Kaasblokjes met mosterd en selder', group: 's', emoji: '🧀' },
      { id: 'c', name: 'Chef’s “special”', group: 's', emoji: '👩‍🍳' },
      { id: 'd', name: 'Zwarte koffie', group: 'w', emoji: '☕' },
      { id: 'k', name: 'Keycap', group: 'w', emoji: '*️⃣' },
    ]
    expect(await decodeCatalog(await encodeCatalog(catalog, groups))).toEqual([
      {
        name: 'Wijntjes',
        items: [
          { name: 'Rosé', emoji: '🍷' },
          { name: 'Zwarte koffie', emoji: '☕' },
          { name: 'Keycap', emoji: '*️⃣' },
        ],
      },
      {
        name: 'Hapjes & co',
        items: [
          { name: 'Kaasblokjes met mosterd en selder', emoji: '🧀' },
          { name: 'Chef’s “special”', emoji: '👩‍🍳' },
        ],
      },
      { name: 'Empty for now', items: [] },
    ])
  })

  it('fits the starter Catalog in a short link: starter groups and Items travel as a mark, not a name', async () => {
    for (const locale of ['en', 'nl'] as const) {
      const link = shareLink('https://peteriron.github.io/order-me-app/', await encodeStarter(locale))
      expect(new TextEncoder().encode(link).length).toBeLessThan(320)
    }
  })

  it('carries starter groups and Items as such, so they arrive in the friend’s language, in the same boxes', async () => {
    const received = replaceCatalog((await decodeCatalog(await encodeStarter('en')))!, ids())
    expect(localizeCatalog(received.catalog, 'nl').slice(2, 4).map((i) => i.name)).toEqual(['Water plat', 'Water bruis'])
    expect(localizeGroups(received.groups, 'nl').map((g) => g.name)).toEqual(['Frisdrank', 'Bier', 'Warm', 'Wijn', 'Sterk', 'Snacks'])
    expect(received.catalog.every((i) => i.starter)).toBe(true)
    const wine = received.groups.find((g) => g.starter === 'wine')!
    expect(received.catalog.filter((i) => i.group === wine.id).map((i) => i.starter)).toEqual([
      'white-wine',
      'red-wine',
      'rose-wine',
      'cava',
    ])
  })

  it('keeps a starter Item’s changed emoji, a renamed group by name, and sends renamed and added Items by name', async () => {
    const { catalog, groups } = starter()
    const [cola, colaZero] = catalog
    const mine: Groups = [{ ...groups[0]!, name: 'Fris', starter: undefined }]
    const items: Item[] = [
      { ...cola!, emoji: '🧊' },
      { ...colaZero!, name: 'Coke Zero', starter: undefined },
      { id: 'k', name: 'Kriek', group: groups[0]!.id, emoji: '🍒' },
    ]
    expect(await decodeCatalog(await encodeCatalog(items, mine))).toEqual([
      {
        name: 'Fris',
        items: [
          { name: 'Cola', emoji: '🧊', starter: 'cola' },
          { name: 'Coke Zero', emoji: '🥤' },
          { name: 'Kriek', emoji: '🍒' },
        ],
      },
    ])
  })

  it('puts the Catalog in the fragment of the app’s own address, so it never reaches a server', async () => {
    const payload = await encodeStarter()
    const link = shareLink('https://peteriron.github.io/order-me-app/?x=1#old', payload)
    expect(link).toBe(`https://peteriron.github.io/order-me-app/?x=1#items=${payload}`)
    expect(sharedPayload(new URL(link).hash)).toBe(payload)
    expect(sharedPayload('')).toBeNull()
    expect(sharedPayload('#other')).toBeNull()
  })

  it('rejects malformed, truncated or tampered links as a whole', async () => {
    const payload = await encodeStarter()
    expect(await decodeCatalog('')).toBeNull()
    expect(await decodeCatalog('not base64!')).toBeNull()
    expect(await decodeCatalog('aGVsbG8')).toBeNull() // "hello", not deflated
    expect(await decodeCatalog(payload.slice(0, payload.length - 12))).toBeNull()
  })

  it('rejects a link whose content is not a valid Catalog', async () => {
    expect(await decodeCatalog(await raw('3\ng\t-Bier\n🍺\tDuvel'))).toEqual([{ name: 'Bier', items: [{ name: 'Duvel', emoji: '🍺' }] }])
    expect(await decodeCatalog(await raw('3\n🍺\tDuvel'))).toBeNull() // an Item before any group
    expect(await decodeCatalog(await raw('3\ng\t*no-such-group'))).toBeNull() // unknown starter group
    expect(await decodeCatalog(await raw('3\ng\tBier'))).toBeNull() // group without its mark
    expect(await decodeCatalog(await raw('3\ng\t-   '))).toBeNull() // group without a name
    expect(await decodeCatalog(await raw('3\ng\t*beer\n*no-such-drink'))).toBeNull() // unknown starter mark
    expect(await decodeCatalog(await raw('4\ng\t*beer'))).toBeNull() // unknown version
    expect(await decodeCatalog(await raw('3'))).toBeNull() // nothing
    expect(await decodeCatalog(await raw('3\ng\t*beer\n🍺\t   '))).toBeNull() // no name
    expect(await decodeCatalog(await raw('3\ng\t*beer\n\tDuvel'))).toBeNull() // no emoji
    expect(await decodeCatalog(await raw('3\ng\t*beer\n🍺🍺\tDuvel'))).toBeNull() // two emoji
  })

  it('still reads a v5 link, putting its Items in groups as an update from v5 would', async () => {
    // Format v1 (names only), from before starter marks: plain Items.
    expect(await decodeCatalog(await raw('1\nd🍺\tDuvel'))).toMatchObject([
      { starter: 'soda', items: [] },
      { starter: 'beer', items: [] },
      { starter: 'hot', items: [] },
      { starter: 'wine', items: [] },
      { starter: 'strong', items: [] },
      { starter: 'other-drinks', items: [{ name: 'Duvel', emoji: '🍺' }] },
      { starter: 'snacks', items: [] },
    ])
    expect(await decodeCatalog(await raw('1\n*duvel'))).toBeNull() // no starter marks in v1
    const v2 = await decodeCatalog(await raw('2\n*duvel\nd🍒\tKriek\ns🥨\tPretzel\n*cola\ts🧊'))
    expect(v2!.filter((g) => g.items.length).map((g) => [g.starter, g.items.map((i) => i.name)])).toEqual([
      ['beer', ['Duvel']],
      ['other-drinks', ['Kriek']],
      ['snacks', ['Pretzel', 'Cola']],
    ])
    expect(await decodeCatalog(await raw('2\n*no-such-drink'))).toBeNull() // unknown starter mark
    expect(await decodeCatalog(await raw('2\n*duvel\tx🍺'))).toBeNull() // bad category on a starter mark
    expect(await decodeCatalog(await raw('1\nx🍺\tDuvel'))).toBeNull() // unknown category
  })

  it('rejects a crafted link with an overlong name or emoji, or more Items or groups than any real Catalog', async () => {
    const lines = (n: number) => Array.from({ length: n }, (_, i) => `🍺\tBeer ${i}`)
    const count = async (text: string) => {
      const groups = await decodeCatalog(await pack(text))
      return groups && sharedItemCount(groups)
    }
    expect(await count(`3\ng\t-B\n🍺\t${'x'.repeat(60)}`)).toBe(1)
    expect(await count(`3\ng\t-B\n🍺\t${'x'.repeat(61)}`)).toBeNull()
    expect(await count(`3\ng\t-${'x'.repeat(61)}`)).toBeNull()
    expect(await count(`3\ng\t-B\n🍺${'́'.repeat(40)}\tDuvel`)).toBeNull() // one huge grapheme
    expect(await count(['3', 'g\t-B', ...lines(200)].join('\n'))).toBe(200)
    expect(await count(['3', 'g\t-B', ...lines(201)].join('\n'))).toBeNull()
    const groups = (n: number) => Array.from({ length: n }, (_, i) => `g\t-G${i}`)
    expect(await decodeCatalog(await pack(['3', ...groups(50)].join('\n')))).toHaveLength(50)
    expect(await decodeCatalog(await pack(['3', ...groups(51)].join('\n')))).toBeNull()
  })
})

describe('replacing the Catalog with a Shared Catalog', () => {
  const duvel: Item = { id: 'duvel', name: 'Duvel', group: 'drink', emoji: '🍺' }
  const history: PlacedRound[] = [
    { id: 'r1', placedAt: '2026-09-28T20:00:00.000Z', lines: [{ itemId: 'duvel', name: 'Duvel', emoji: '🍺', count: 2 }] },
  ]
  const shared = [
    { name: 'Bier', starter: 'beer', items: [{ name: 'Kriek', emoji: '🍒' }] },
    { name: 'Nootjes', items: [{ name: 'Nuts', emoji: '🥜' }] },
  ]

  it('gives the shared groups and Items fresh ids and colours, empties the Round and drops pins; History is kept', () => {
    const state = { catalog: [duvel], round: add(emptyRound(), 'duvel'), pins: ['duvel'], history }
    const next = { ...state, ...replaceCatalog(shared, ids()) }
    expect(next.groups).toEqual([
      { id: 'new-1', name: 'Bier', colour: 0, starter: 'beer' },
      { id: 'new-3', name: 'Nootjes', colour: 1 },
    ])
    expect(next.catalog).toEqual([
      { id: 'new-2', name: 'Kriek', group: 'new-1', emoji: '🍒' },
      { id: 'new-4', name: 'Nuts', group: 'new-3', emoji: '🥜' },
    ])
    expect(next.round).toEqual(emptyRound())
    expect(next.pins).toEqual([])
    expect(next.history).toBe(history)
  })
})
