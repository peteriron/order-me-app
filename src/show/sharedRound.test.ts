import { describe, expect, it } from 'vitest'
import { seedCatalog, type Item } from '../items/catalog.ts'
import { starterGroup } from '../items/groups.ts'
import { localizeCatalog } from '../items/starter.ts'
import { add, emptyRound, roundLines } from '../round/round.ts'
import { pack } from '../shared/shareLink.ts'
import { gridSections } from '../round/tileOrder.ts'
import { decodeRound, encodeRound, receiveRound, roundLink, roundPayload } from './sharedRound.ts'

const ids = (prefix = 'id') => {
  let n = 0
  return () => `${prefix}-${++n}`
}
const byName = (catalog: Item[], name: string) => catalog.find((i) => i.name === name)!
/** A phone with the starter Catalog, as `receiveRound` takes it. */
const phone = (locale: 'en' | 'nl', prefix: string) => ({ ...seedCatalog(locale, ids(prefix)), round: emptyRound(), pins: [] as string[], showOrder: [] as string[] })

/** The sender: an English starter Catalog plus a Kriek in Beer, with 3 Cola, 2 Kriek and 1 Chips in the Round. */
function sender() {
  const seeded = seedCatalog('en', ids('me'))
  const beer = starterGroup(seeded.groups, 'beer')!.id
  const catalog: Item[] = [...seeded.catalog, { id: 'kriek', name: 'Kriek', group: beer, emoji: '🍒' }]
  let round = emptyRound()
  for (const name of ['Cola', 'Cola', 'Cola', 'Kriek', 'Kriek', 'Chips']) round = add(round, byName(catalog, name).id)
  // The lines as the Show tab lists them.
  const lines = roundLines(round, gridSections(catalog, seeded.groups, catalog.map((i) => i.id)))
  return { catalog, groups: seeded.groups, round, lines }
}
const encodeSender = (note = {}) => {
  const { lines, groups } = sender()
  return encodeRound(lines, groups, note)
}

describe('Round link', () => {
  it('round-trips the lines in the order the Show tab lists them, with their counts', async () => {
    const decoded = (await decodeRound(await encodeSender()))!.lines
    expect(decoded!.map((l) => [l.item.name, l.count])).toEqual([
      ['Cola', 3],
      ['Kriek', 2],
      ['Chips', 1],
    ])
    expect(decoded![0]!.item.starter).toBe('cola')
    expect(decoded![1]).toMatchObject({ item: { name: 'Kriek', emoji: '🍒' }, group: { starter: 'beer' } })
  })

  it('lives in the fragment of the app’s address', async () => {
    const payload = await encodeSender()
    const link = roundLink('https://peteriron.github.io/order-me-app/#items=old', payload)
    expect(link).toBe(`https://peteriron.github.io/order-me-app/#round=${payload}`)
    expect(roundPayload(new URL(link).hash)).toBe(payload)
    expect(roundPayload('#items=abc')).toBeNull()
  })

  it('rejects malformed or invalid links as a whole', async () => {
    const payload = await encodeSender()
    expect(await decodeRound(payload.slice(0, -8))).toBeNull()
    expect(await decodeRound('not base64!')).toBeNull()
    for (const text of [
      '4\n3\t*soda\t*cola', // unknown version
      '3\nt\t"12"', // a table but no lines
      '3\nt\t12\n3\t*soda\t*cola', // a table that isn't a JSON string
      '3\n3\t*soda\t*cola\nt\t"12"', // a table after the lines
      '3\n3\t*cola', // no group
      '3\n3\t*no-such-group\t*cola', // unknown starter group
      '3\n3\tSoda\t*cola', // a group without its mark
      '1', // no lines
      '1\n0\t*cola', // a count of zero
      '1\n2.5\t*cola', // not a whole number
      '1\n1000\t*cola', // beyond any real Round
      '1\nx\t*cola', // no count
      '1\n3\t*no-such-drink', // unknown starter mark
      '1\n3\tx🍺\tDuvel', // unknown category (v5)
      ['3', ...Array.from({ length: 201 }, (_, i) => `1\t-Bier\t🍺\tBeer ${i}`)].join('\n'), // more lines than any real Round
    ]) {
      expect(await decodeRound(await pack(text)), text).toBeNull()
    }
  })
})

describe('the table and remark in a Round link', () => {
  it('travel along, including line breaks and quotes in the remark', async () => {
    const shared = await decodeRound(await encodeSender({ table: '12', remark: 'No ice\nand "cold" glasses' }))
    expect(shared!.table).toBe('12')
    expect(shared!.remark).toBe('No ice\nand "cold" glasses')
    expect(shared!.lines).toHaveLength(3)
  })

  it('are left out when empty, and a link from before them still works', async () => {
    const shared = await decodeRound(await encodeSender({ table: ' ', remark: '' }))
    expect(shared).not.toHaveProperty('table')
    expect(await decodeRound(await pack('1\n3\t*cola'))).toMatchObject({ lines: [{ count: 3 }] })
  })

  it('replace the receiver’s, and Undo brings theirs back', async () => {
    const shared = (await decodeRound(await encodeSender({ table: '12' })))!
    const friend = { ...phone('en', 'friend'), round: { counts: {}, remark: 'theirs' } }
    const { next, undo } = receiveRound(friend, shared, ids('new'))
    expect(next.round).toMatchObject({ table: '12' })
    expect(next.round).not.toHaveProperty('remark')
    expect({ ...friend, ...next, ...undo({ ...friend, ...next }) }.round).toEqual({ counts: {}, remark: 'theirs' })
  })
})

describe('receiving a Round', () => {
  it('remembers the sender’s line order as the Show order', async () => {
    const shared = (await decodeRound(await encodeSender()))!
    const friend = { ...phone('en', 'friend'), showOrder: ['old'] }
    const { next } = receiveRound(friend, shared, ids('new'))
    expect(next.showOrder).toEqual([byName(friend.catalog, 'Cola').id, 'new-1', byName(friend.catalog, 'Chips').id])
  })

  it('matches starter Items by their mark, whatever language either phone is in', async () => {
    const shared = (await decodeRound(await encodeSender()))!
    const friend = phone('nl', 'friend')
    const { next } = receiveRound(friend, shared, ids('new'))
    const cola = byName(localizeCatalog(next.catalog, 'nl'), 'Cola')
    expect(next.round.counts[cola.id]).toBe(3)
    expect(next.round.counts[byName(localizeCatalog(next.catalog, 'nl'), 'Chips').id]).toBe(1)
  })

  it('matches other Items by name, ignoring case, whatever group either has it in', () => {
    const friend = {
      catalog: [{ id: 'k', name: 'KRIEK', group: 'fruit', emoji: '🍒' }],
      groups: [{ id: 'fruit', name: 'Fruitbier', colour: 0 }],
      round: emptyRound(),
      pins: [],
      showOrder: [],
    }
    const line = { item: { name: 'Kriek', emoji: '🍷' }, group: { name: 'Beer', starter: 'beer' }, count: 2 }
    const { next } = receiveRound(friend, { lines: [line] }, ids())
    expect(next.catalog).toEqual(friend.catalog)
    expect(next.round.counts).toEqual({ k: 2 })
  })

  it('matches a renamed sender Item to a friend’s starter Item by either of its names', () => {
    // The sender's "Water plat" is a plain name (say, typed by hand); the friend has the starter Item.
    const friend = phone('en', 'friend')
    const line = { item: { name: 'water plat', emoji: '💧' }, group: { name: 'Fris' }, count: 1 }
    const { next } = receiveRound(friend, { lines: [line] }, ids())
    expect(next.catalog).toHaveLength(friend.catalog.length)
    expect(next.round.counts).toEqual({ [byName(friend.catalog, 'Still water').id]: 1 })
  })

  it('adds the drinks the friend doesn’t have to the same group, unpinned, and keeps everything of theirs', async () => {
    const shared = (await decodeRound(await encodeSender()))!
    const friend = { ...phone('nl', 'friend'), pins: ['friend-3'] }
    const beer = starterGroup(friend.groups, 'beer')!.id
    const { next } = receiveRound(friend, shared, ids('new'))
    expect(next.catalog).toEqual([...friend.catalog, { id: 'new-1', name: 'Kriek', group: beer, emoji: '🍒' }])
    expect(next.groups).toEqual(friend.groups)
    expect(next.round.counts['new-1']).toBe(2)
    expect(next).not.toHaveProperty('pins')
  })

  it('adds a group the friend doesn’t have, last, and Undo takes it away again', () => {
    const friend = phone('en', 'friend')
    const line = { item: { name: 'Pretzel', emoji: '🥨' }, group: { name: 'Bakery' }, count: 1 }
    const { next, undo } = receiveRound(friend, { lines: [line] }, ids('new'))
    // Six starter groups use colours 0 to 5: the new one gets the next.
    expect(next.groups.at(-1)).toEqual({ id: 'new-2', name: 'Bakery', colour: 6 })
    expect(next.catalog.at(-1)).toEqual({ id: 'new-1', name: 'Pretzel', group: 'new-2', emoji: '🥨' })
    const after = { ...friend, ...next }
    expect({ ...after, ...undo(after) }.groups).toEqual(friend.groups)
  })

  it('reads a Round link from a v5 phone, putting new drinks where an update from v5 would', async () => {
    const shared = (await decodeRound(await pack('2\n2\td🍒\tKriek\n1\t*duvel')))!
    expect(shared.lines.map((l) => [l.item.name, l.group.starter])).toEqual([
      ['Kriek', 'other-drinks'],
      ['Duvel', 'beer'],
    ])
    const { next } = receiveRound(phone('en', 'friend'), shared, ids('new'))
    expect(next.groups.at(-1)).toMatchObject({ name: 'Other drinks', starter: 'other-drinks' })
  })

  it('replaces the Round being composed, and Undo brings it back and removes the added drinks', async () => {
    const shared = (await decodeRound(await encodeSender()))!
    const { catalog, groups } = seedCatalog('en', ids('friend'))
    const own = add(add(emptyRound(), byName(catalog, 'Duvel').id), byName(catalog, 'Duvel').id)
    const friend = { catalog, groups, round: own, pins: [] as string[], showOrder: ['previous'] }

    const { next, undo } = receiveRound(friend, shared, ids('new'))
    expect(next.round.counts[byName(catalog, 'Duvel').id]).toBeUndefined()

    const after = { ...friend, ...next, pins: ['new-1'] }
    expect({ ...after, ...undo(after) }).toEqual({ catalog, groups, round: own, pins: [], showOrder: ['previous'] })
  })
})
