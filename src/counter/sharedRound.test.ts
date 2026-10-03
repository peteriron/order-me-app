import { describe, expect, it } from 'vitest'
import { seedCatalog, type Item } from '../items/catalog.ts'
import { pack } from '../items/sharedCatalog.ts'
import { localizeCatalog } from '../items/starter.ts'
import { add, emptyRound, roundLines } from '../round/round.ts'
import { gridSections } from '../round/tileOrder.ts'
import { decodeRound, encodeRound, receiveRound, roundLink, roundPayload } from './sharedRound.ts'

const ids = (prefix = 'id') => {
  let n = 0
  return () => `${prefix}-${++n}`
}
const byName = (catalog: Item[], name: string) => catalog.find((i) => i.name === name)!

/** The sender: an English starter Catalog plus a Kriek, with 3 Cola, 2 Kriek and 1 Chips in the Round. */
function sender() {
  const catalog: Item[] = [...seedCatalog('en', ids('me')), { id: 'kriek', name: 'Kriek', category: 'drink', emoji: '🍒' }]
  let round = emptyRound()
  for (const name of ['Cola', 'Cola', 'Cola', 'Kriek', 'Kriek', 'Chips']) round = add(round, byName(catalog, name).id)
  // The lines as the Show tab lists them.
  const lines = roundLines(round, gridSections(catalog, catalog.map((i) => i.id)))
  return { catalog, round, lines }
}

describe('Round link', () => {
  it('round-trips the lines in the order the Show tab lists them, with their counts', async () => {
    const decoded = (await decodeRound(await encodeRound(sender().lines)))!.lines
    expect(decoded!.map((l) => [l.item.name, l.count])).toEqual([
      ['Cola', 3],
      ['Kriek', 2],
      ['Chips', 1],
    ])
    expect(decoded![0]!.item.starter).toBe('cola')
    expect(decoded![1]!.item).toEqual({ name: 'Kriek', category: 'drink', emoji: '🍒' })
  })

  it('lives in the fragment of the app’s address', async () => {
    const payload = await encodeRound(sender().lines)
    const link = roundLink('https://peteriron.github.io/order-me-app/#items=old', payload)
    expect(link).toBe(`https://peteriron.github.io/order-me-app/#round=${payload}`)
    expect(roundPayload(new URL(link).hash)).toBe(payload)
    expect(roundPayload('#items=abc')).toBeNull()
  })

  it('rejects malformed or invalid links as a whole', async () => {
    const payload = await encodeRound(sender().lines)
    expect(await decodeRound(payload.slice(0, -8))).toBeNull()
    expect(await decodeRound('not base64!')).toBeNull()
    for (const text of [
      '3\n3\t*cola', // unknown version
      '2\nt\t"12"', // a table but no lines
      '2\nt\t12\n3\t*cola', // a table that isn't a JSON string
      '2\n3\t*cola\nt\t"12"', // a table after the lines
      '1', // no lines
      '1\n0\t*cola', // a count of zero
      '1\n2.5\t*cola', // not a whole number
      '1\n1000\t*cola', // beyond any real Round
      '1\nx\t*cola', // no count
      '1\n3\t*no-such-drink', // unknown starter mark
      '1\n3\tx🍺\tDuvel', // unknown category
    ]) {
      expect(await decodeRound(await pack(text)), text).toBeNull()
    }
  })
})

describe('the table and remark in a Round link', () => {
  it('travel along, including line breaks and quotes in the remark', async () => {
    const shared = await decodeRound(await encodeRound(sender().lines, { table: '12', remark: 'No ice\nand "cold" glasses' }))
    expect(shared!.table).toBe('12')
    expect(shared!.remark).toBe('No ice\nand "cold" glasses')
    expect(shared!.lines).toHaveLength(3)
  })

  it('are left out when empty, and a link from before them still works', async () => {
    const shared = await decodeRound(await encodeRound(sender().lines, { table: ' ', remark: '' }))
    expect(shared).not.toHaveProperty('table')
    expect(await decodeRound(await pack('1\n3\t*cola'))).toMatchObject({ lines: [{ count: 3 }] })
  })

  it('replace the receiver’s, and Undo brings theirs back', async () => {
    const shared = (await decodeRound(await encodeRound(sender().lines, { table: '12' })))!
    const catalog = seedCatalog('en', ids('friend'))
    const friend = { catalog, round: { counts: {}, remark: 'theirs' }, pins: [], showOrder: [] }
    const { next, undo } = receiveRound(friend, shared, ids('new'))
    expect(next.round).toMatchObject({ table: '12' })
    expect(next.round).not.toHaveProperty('remark')
    expect({ ...friend, ...next, ...undo({ ...friend, ...next }) }.round).toEqual({ counts: {}, remark: 'theirs' })
  })
})

describe('receiving a Round', () => {
  it('remembers the sender’s line order as the Show order', async () => {
    const shared = (await decodeRound(await encodeRound(sender().lines)))!
    const catalog = seedCatalog('en', ids('friend'))
    const { next } = receiveRound({ catalog, round: emptyRound(), pins: [], showOrder: ['old'] }, shared, ids('new'))
    expect(next.showOrder).toEqual([byName(catalog, 'Cola').id, 'new-1', byName(catalog, 'Chips').id])
  })

  it('matches starter Items by their mark, whatever language either phone is in', async () => {
    const shared = (await decodeRound(await encodeRound(sender().lines)))!
    const friend = { catalog: seedCatalog('nl', ids('friend')), round: emptyRound(), pins: [], showOrder: [] }
    const { next } = receiveRound(friend, shared, ids('new'))
    const cola = byName(localizeCatalog(next.catalog, 'nl'), 'Cola')
    expect(next.round.counts[cola.id]).toBe(3)
    expect(next.round.counts[byName(localizeCatalog(next.catalog, 'nl'), 'Chips').id]).toBe(1)
  })

  it('matches other Items by name and category, ignoring case', () => {
    const friend = {
      catalog: [{ id: 'k', name: 'KRIEK', category: 'drink' as const, emoji: '🍒' }],
      round: emptyRound(),
      pins: [],
      showOrder: [],
    }
    const { next } = receiveRound(friend, { lines: [{ item: { name: 'Kriek', category: 'drink', emoji: '🍷' }, count: 2 }] }, ids())
    expect(next.catalog).toEqual(friend.catalog)
    expect(next.round.counts).toEqual({ k: 2 })
  })

  it('matches a renamed sender Item to a friend’s starter Item by either of its names', () => {
    // The sender's "Water plat" is a plain name (say, typed by hand); the friend has the starter Item.
    const friend = { catalog: seedCatalog('en', ids('friend')), round: emptyRound(), pins: [], showOrder: [] }
    const { next } = receiveRound(friend, { lines: [{ item: { name: 'water plat', category: 'drink', emoji: '💧' }, count: 1 }] }, ids())
    expect(next.catalog).toHaveLength(friend.catalog.length)
    expect(next.round.counts).toEqual({ [byName(friend.catalog, 'Still water').id]: 1 })
  })

  it('adds the drinks the friend doesn’t have, unpinned, and keeps everything of theirs', async () => {
    const shared = (await decodeRound(await encodeRound(sender().lines)))!
    const friend = { catalog: seedCatalog('en', ids('friend')), round: emptyRound(), pins: ['friend-3'], showOrder: [] }
    const { next } = receiveRound(friend, shared, ids('new'))
    expect(next.catalog).toEqual([...friend.catalog, { id: 'new-1', name: 'Kriek', category: 'drink', emoji: '🍒' }])
    expect(next.round.counts['new-1']).toBe(2)
    expect(next).not.toHaveProperty('pins')
  })

  it('replaces the Round being composed, and Undo brings it back and removes the added drinks', async () => {
    const shared = (await decodeRound(await encodeRound(sender().lines)))!
    const catalog = seedCatalog('en', ids('friend'))
    const own = add(add(emptyRound(), byName(catalog, 'Duvel').id), byName(catalog, 'Duvel').id)
    const friend = { catalog, round: own, pins: [] as string[], showOrder: ['previous'] }

    const { next, undo } = receiveRound(friend, shared, ids('new'))
    expect(next.round.counts[byName(catalog, 'Duvel').id]).toBeUndefined()

    const after = { ...friend, ...next, pins: ['new-1'] }
    expect({ ...after, ...undo(after) }).toEqual({ catalog, round: own, pins: [], showOrder: ['previous'] })
  })
})
