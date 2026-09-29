import { describe, expect, it } from 'vitest'
import {
  add,
  addToCatalog,
  catalogSections,
  checkDraft,
  clear,
  countOf,
  deleteItem,
  deletePlacedRound,
  editItem,
  emptyRound,
  gridSections,
  groupByDay,
  markOrdered,
  orderAgain,
  placedTotal,
  popularity,
  popularityOrder,
  remove,
  roundLines,
  seedCatalog,
  totalOf,
  type Item,
  type PlacedRound,
} from './index.ts'

const sequentialIds = () => {
  let n = 0
  return () => `id-${++n}`
}

describe('starter Catalog', () => {
  it('seeds 17 drinks and 4 snacks in English', () => {
    const catalog = seedCatalog('en', sequentialIds())
    expect(catalog.filter((i) => i.category === 'drink')).toHaveLength(17)
    expect(catalog.filter((i) => i.category === 'snack')).toHaveLength(4)
    expect(catalog.map((i) => i.name)).toContain('Still water')
    expect(catalog.find((i) => i.name === 'Bitterballen')).toMatchObject({ category: 'snack', emoji: '🧆' })
  })

  it('seeds Dutch names when the device is Dutch', () => {
    const names = seedCatalog('nl', sequentialIds()).map((i) => i.name)
    expect(names).toContain('Plat water')
    expect(names).toContain('Deca')
    expect(names).not.toContain('Still water')
  })

  it('gives every Item its own id, even when names repeat across languages', () => {
    const ids = seedCatalog('en', sequentialIds()).map((i) => i.id)
    expect(new Set(ids).size).toBe(21)
  })
})

describe('composing Round', () => {
  it('starts empty', () => {
    const round = emptyRound()
    expect(totalOf(round)).toBe(0)
    expect(countOf(round, 'duvel')).toBe(0)
  })

  it('adds one of an Item per tap', () => {
    let round = emptyRound()
    round = add(round, 'duvel')
    round = add(round, 'duvel')
    round = add(round, 'cola')
    expect(countOf(round, 'duvel')).toBe(2)
    expect(countOf(round, 'cola')).toBe(1)
    expect(totalOf(round)).toBe(3)
  })

  it('removes one of an Item', () => {
    const round = remove(add(add(emptyRound(), 'duvel'), 'duvel'), 'duvel')
    expect(countOf(round, 'duvel')).toBe(1)
    expect(totalOf(round)).toBe(1)
  })

  it('drops an Item from the Round when its count reaches zero', () => {
    const round = remove(add(emptyRound(), 'duvel'), 'duvel')
    expect(round.counts).toEqual({})
  })

  it('ignores removing an Item that is not in the Round', () => {
    const round = add(emptyRound(), 'cola')
    expect(remove(round, 'duvel').counts).toEqual({ cola: 1 })
  })

  it('clears every Item at once', () => {
    const round = clear(add(add(add(emptyRound(), 'duvel'), 'duvel'), 'cola'))
    expect(totalOf(round)).toBe(0)
    expect(round.counts).toEqual({})
  })

  it('never mutates the Round it was given', () => {
    const before = emptyRound()
    add(before, 'duvel')
    expect(totalOf(before)).toBe(0)
  })
})

describe('Catalog sections (Items page: always A–Z)', () => {
  const item = (id: string, name: string, category: Item['category']): Item => ({ id, name, category, emoji: '🍺' })

  it('splits the Catalog into Drinks and Snacks, each A–Z', () => {
    const catalog = [
      item('1', 'Rosé', 'drink'),
      item('2', 'Nuts', 'snack'),
      item('3', 'Beer', 'drink'),
      item('4', 'Chips', 'snack'),
      item('5', 'Red wine', 'drink'),
    ]
    const sections = catalogSections(catalog, 'en')
    expect(sections.drink.map((i) => i.name)).toEqual(['Beer', 'Red wine', 'Rosé'])
    expect(sections.snack.map((i) => i.name)).toEqual(['Chips', 'Nuts'])
  })

  it('sorts accented names where a reader expects them, not by code point', () => {
    const catalog = [item('1', 'Zwarte koffie', 'drink'), item('2', 'Éclair', 'drink')]
    expect(catalogSections(catalog, 'nl').drink.map((i) => i.name)).toEqual(['Éclair', 'Zwarte koffie'])
  })
})

describe('Popularity', () => {
  const now = new Date('2026-09-29T20:00:00.000Z')
  const daysAgo = (days: number) => new Date(now.getTime() - days * 86_400_000).toISOString()
  /** A placed Round with the given [itemId, count] lines. */
  const placed = (id: string, placedAt: string, lines: [string, number][]): PlacedRound => ({
    id,
    placedAt,
    lines: lines.map(([itemId, count]) => ({ itemId, name: itemId, category: 'drink', emoji: '🍺', count })),
  })

  it('counts the placed Rounds an Item appears in, not how many were ordered', () => {
    const history = [
      placed('r1', daysAgo(1), [['duvel', 6]]),
      placed('r2', daysAgo(2), [['cola', 1]]),
      placed('r3', daysAgo(3), [['cola', 1], ['duvel', 1]]),
    ]
    expect(popularity(history, now)).toEqual({ duvel: 2, cola: 2 })
  })

  it('only counts Rounds placed in the last 90 days', () => {
    const history = [
      placed('r1', daysAgo(89), [['duvel', 1]]),
      placed('r2', daysAgo(90), [['duvel', 1]]),
      placed('r3', daysAgo(91), [['cola', 1]]),
    ]
    expect(popularity(history, now)).toEqual({ duvel: 2 })
  })
})

describe('tile order on the Round page', () => {
  const now = new Date('2026-09-29T20:00:00.000Z')
  const item = (id: string, name: string, category: Item['category'] = 'drink'): Item => ({
    id,
    name,
    category,
    emoji: '🍺',
  })
  const round = (id: string, itemIds: string[]): PlacedRound => ({
    id,
    placedAt: '2026-09-28T20:00:00.000Z',
    lines: itemIds.map((itemId) => ({ itemId, name: itemId, category: 'drink', emoji: '🍺', count: 1 })),
  })
  const names = (items: Item[]) => items.map((i) => i.name)

  const beer = item('beer', 'Beer')
  const cola = item('cola', 'Cola')
  const duvel = item('duvel', 'Duvel')
  const tea = item('tea', 'Tea')
  const water = item('water', 'Water')
  const chips = item('chips', 'Chips', 'snack')
  const nuts = item('nuts', 'Nuts', 'snack')
  const catalog = [water, tea, duvel, cola, beer, nuts, chips]
  const history = [round('r1', ['duvel', 'nuts']), round('r2', ['duvel', 'tea']), round('r3', ['cola'])]

  it('puts the most popular Items first in each section, ties A–Z, never-ordered last A–Z', () => {
    const sections = gridSections(catalog, popularityOrder(catalog, history, 'en', now))
    expect(names(sections.drink)).toEqual(['Duvel', 'Cola', 'Tea', 'Beer', 'Water'])
    expect(names(sections.snack)).toEqual(['Nuts', 'Chips'])
  })

  it('breaks ties in the Operator’s language, not by code point', () => {
    const eclair = item('eclair', 'Éclair')
    const zwarte = item('zwarte', 'Zwarte koffie')
    const order = popularityOrder([zwarte, eclair], [round('r1', ['zwarte', 'eclair'])], 'nl', now)
    expect(names(gridSections([zwarte, eclair], order).drink)).toEqual(['Éclair', 'Zwarte koffie'])
  })

  it('keeps the score of a renamed Item, since placed lines point at its id', () => {
    const renamed = { ...duvel, name: 'Aardbeienbier' }
    const order = popularityOrder([renamed, cola], history, 'en', now)
    expect(names(gridSections([renamed, cola], order).drink)).toEqual(['Aardbeienbier', 'Cola'])
  })

  it('is all A–Z when nothing has been placed yet', () => {
    const sections = gridSections(catalog, popularityOrder(catalog, [], 'en', now))
    expect(sections).toEqual(catalogSections(catalog, 'en'))
  })

  describe('held fixed while a Round is being composed', () => {
    const order = popularityOrder(catalog, history, 'en', now)

    it('does not move a renamed Item', () => {
      const edited = editItem(catalog, 'beer', { name: 'Allagash', category: 'drink', emoji: '🍺' })
      expect(names(gridSections(edited, order).drink)).toEqual(['Duvel', 'Cola', 'Tea', 'Allagash', 'Water'])
    })

    it('puts newly added Items at the end of their section, in the order they were added', () => {
      let grown = addToCatalog(catalog, { name: 'Zero', category: 'drink', emoji: '🍺' }, 'zero')
      grown = addToCatalog(grown, { name: 'Apple juice', category: 'drink', emoji: '🧃' }, 'apple')
      expect(names(gridSections(grown, order).drink)).toEqual([
        'Duvel',
        'Cola',
        'Tea',
        'Beer',
        'Water',
        'Zero',
        'Apple juice',
      ])
    })

    it('drops deleted Items and keeps the rest where they were', () => {
      const { catalog: smaller } = deleteItem({ catalog, round: emptyRound() }, 'cola')
      expect(names(gridSections(smaller, order).drink)).toEqual(['Duvel', 'Tea', 'Beer', 'Water'])
    })

    it('moves an Item that changes category into the other section by its score', () => {
      const moved = editItem(catalog, 'tea', { name: 'Tea', category: 'snack', emoji: '🍵' })
      expect(names(gridSections(moved, order).snack)).toEqual(['Nuts', 'Tea', 'Chips'])
    })
  })
})

describe('Round lines for the Counter view', () => {
  const duvel: Item = { id: 'duvel', name: 'Duvel', category: 'drink', emoji: '🍺' }
  const cola: Item = { id: 'cola', name: 'Cola', category: 'drink', emoji: '🥤' }
  const chips: Item = { id: 'chips', name: 'Chips', category: 'snack', emoji: '🥔' }
  const sections = catalogSections([chips, duvel, cola], 'en')

  it('lists drinks then snacks, in grid order, with their counts', () => {
    const round = add(add(add(add(emptyRound(), 'chips'), 'duvel'), 'duvel'), 'cola')
    expect(roundLines(round, sections).map((l) => [l.item.name, l.count])).toEqual([
      ['Cola', 1],
      ['Duvel', 2],
      ['Chips', 1],
    ])
  })

  it('leaves out Items that are not in the Round', () => {
    const round = add(emptyRound(), 'duvel')
    expect(roundLines(round, sections).map((l) => l.item.name)).toEqual(['Duvel'])
  })
})

describe('marking a Round as ordered', () => {
  const duvel: Item = { id: 'duvel', name: 'Duvel', category: 'drink', emoji: '🍺' }
  const chips: Item = { id: 'chips', name: 'Chips', category: 'snack', emoji: '🥔' }
  const catalog = [duvel, chips]
  const meta = { id: 'round-1', placedAt: '2026-09-22T21:14:00.000Z' }
  const composed = add(add(add(emptyRound(), 'duvel'), 'duvel'), 'chips')

  it('adds a placed Round to history with a snapshot of each line, and empties the composing Round', () => {
    const { next } = markOrdered({ round: composed, history: [] }, catalogSections(catalog, 'en'), meta)

    expect(totalOf(next.round)).toBe(0)
    expect(next.history).toEqual([
      {
        id: 'round-1',
        placedAt: '2026-09-22T21:14:00.000Z',
        lines: [
          { itemId: 'duvel', name: 'Duvel', category: 'drink', emoji: '🍺', count: 2 },
          { itemId: 'chips', name: 'Chips', category: 'snack', emoji: '🥔', count: 1 },
        ],
      },
    ])
  })

  it('puts the newest placed Round first', () => {
    const older = { id: 'round-0', placedAt: '2026-09-21T20:00:00.000Z', lines: [] }
    const { next } = markOrdered({ round: composed, history: [older] }, catalogSections(catalog, 'en'), meta)
    expect(next.history.map((r) => r.id)).toEqual(['round-1', 'round-0'])
  })

  it('keeps what was ordered even when the Item is edited in place afterwards', () => {
    const editable: Item = { ...duvel }
    const { next } = markOrdered({ round: composed, history: [] }, catalogSections([editable, chips], 'en'), meta)
    editable.name = 'Duvel Tripel Hop'
    editable.emoji = '🍻'
    expect(next.history[0].lines[0]).toMatchObject({ itemId: 'duvel', name: 'Duvel', emoji: '🍺' })
  })

  it('undo takes the Round back out of history and restores what was being composed', () => {
    const before = { round: composed, history: [] }
    const { next, undo } = markOrdered(before, catalogSections(catalog, 'en'), meta)
    expect(undo(next)).toEqual(before)
  })
})

describe('history grouped by day', () => {
  // Local wall-clock times, as the Operator experiences them.
  const at = (y: number, m: number, d: number, h: number, min = 0) => new Date(y, m - 1, d, h, min).toISOString()
  const placed = (id: string, placedAt: string) => ({ id, placedAt, lines: [] })
  const now = new Date(2026, 8, 23, 20, 0) // 23 Sep 2026, 20:00

  it('groups placed Rounds by calendar day, newest first, with how many days ago each day was', () => {
    const history = [
      placed('tonight-2', at(2026, 9, 23, 19, 30)),
      placed('tonight-1', at(2026, 9, 23, 18, 5)),
      placed('last-night', at(2026, 9, 22, 23, 50)),
      placed('last-month', at(2026, 8, 30, 21, 0)),
    ]
    expect(groupByDay(history, now).map((g) => [g.daysAgo, g.rounds.map((r) => r.id)])).toEqual([
      [0, ['tonight-2', 'tonight-1']],
      [1, ['last-night']],
      [24, ['last-month']],
    ])
  })

  it('splits at local midnight, not after 24 hours', () => {
    const justBeforeMidnight = placed('late', at(2026, 9, 22, 23, 59))
    const justAfterMidnight = placed('early', at(2026, 9, 23, 0, 1))
    const groups = groupByDay([justAfterMidnight, justBeforeMidnight], new Date(2026, 8, 23, 0, 30))
    expect(groups.map((g) => g.daysAgo)).toEqual([0, 1])
  })

  it('has no groups when nothing has been placed', () => {
    expect(groupByDay([], now)).toEqual([])
  })
})

describe('placed Rounds in history', () => {
  const line = (itemId: string, name: string, count: number) => ({ itemId, name, category: 'drink' as const, emoji: '🍺', count })
  const r1 = { id: 'r1', placedAt: '2026-09-23T19:00:00.000Z', lines: [line('d', 'Duvel', 3), line('c', 'Cola', 2)] }
  const r2 = { id: 'r2', placedAt: '2026-09-22T19:00:00.000Z', lines: [line('d', 'Duvel', 1)] }

  it('counts every Item in a placed Round', () => {
    expect(placedTotal(r1)).toBe(5)
  })

  it('deletes one placed Round and keeps the rest in order', () => {
    const r0 = { ...r2, id: 'r0' }
    expect(deletePlacedRound([r1, r2, r0], 'r2').map((r) => r.id)).toEqual(['r1', 'r0'])
  })
})

describe('order again', () => {
  const duvel: Item = { id: 'duvel', name: 'Duvel', category: 'drink', emoji: '🍺' }
  const chips: Item = { id: 'chips', name: 'Chips', category: 'snack', emoji: '🥔' }
  const line = (item: Item, count: number, nameThen = item.name) => ({
    itemId: item.id,
    name: nameThen,
    category: item.category,
    emoji: item.emoji,
    count,
  })
  const lastFriday = { id: 'r1', placedAt: '2026-09-18T21:00:00.000Z', lines: [line(duvel, 3), line(chips, 2)] }

  it('makes a composing Round with the same counts', () => {
    const { round, skipped } = orderAgain(lastFriday, [duvel, chips])
    expect(round.counts).toEqual({ duvel: 3, chips: 2 })
    expect(skipped).toBe(0)
  })

  it('still finds an Item that was renamed since, by its id', () => {
    const renamed = { ...duvel, name: 'Duvel Tripel' }
    const placed = { ...lastFriday, lines: [line(duvel, 3)] }
    expect(orderAgain(placed, [renamed, chips]).round.counts).toEqual({ duvel: 3 })
  })

  it('skips lines whose Item was deleted from the Catalog, and says how many', () => {
    const { round, skipped } = orderAgain(lastFriday, [chips])
    expect(round.counts).toEqual({ chips: 2 })
    expect(skipped).toBe(1)
  })

  it('copies the placed Round rather than reopening it', () => {
    const before = structuredClone(lastFriday)
    const { round } = orderAgain(lastFriday, [duvel, chips])
    add(round, 'duvel')
    expect(lastFriday).toEqual(before)
  })
})

describe('checking an Item draft from the sheet', () => {
  it('tidies the name: trims it and collapses runs of spaces', () => {
    expect(checkDraft({ name: '  Kriek   Boon ', category: 'drink', emoji: '🍒' })).toEqual({
      ok: true,
      value: { name: 'Kriek Boon', category: 'drink', emoji: '🍒' },
    })
  })

  it('needs a name', () => {
    expect(checkDraft({ name: '   ', category: 'drink', emoji: '🍺' })).toEqual({ ok: false, problem: 'nameRequired' })
  })

  it('keeps just the first emoji when several are typed, including multi-part ones', () => {
    const draft = (emoji: string) => checkDraft({ name: 'X', category: 'snack', emoji })
    expect(draft(' 🧉🍺 ')).toMatchObject({ value: { emoji: '🧉' } })
    expect(draft('👩‍🍳🍺')).toMatchObject({ value: { emoji: '👩‍🍳' } })
  })

  it('needs an emoji', () => {
    expect(checkDraft({ name: 'Kriek', category: 'drink', emoji: ' ' })).toEqual({ ok: false, problem: 'emojiRequired' })
  })
})

describe('editing the Catalog', () => {
  const duvel: Item = { id: 'duvel', name: 'Duvel', category: 'drink', emoji: '🍺' }
  const chips: Item = { id: 'chips', name: 'Chips', category: 'snack', emoji: '🥔' }

  it('adds a new Item with its own id', () => {
    const catalog = addToCatalog([duvel], { name: 'Kriek', category: 'drink', emoji: '🍒' }, 'kriek')
    expect(catalog).toEqual([duvel, { id: 'kriek', name: 'Kriek', category: 'drink', emoji: '🍒' }])
  })

  it('allows two Items with the same name, told apart by id', () => {
    const catalog = addToCatalog([duvel], { name: 'Duvel', category: 'drink', emoji: '🍻' }, 'duvel-2')
    expect(catalog.map((i) => i.id)).toEqual(['duvel', 'duvel-2'])
  })

  it('renaming an Item keeps its count in the Round being composed', () => {
    const round = add(add(emptyRound(), 'duvel'), 'duvel')
    const catalog = editItem([duvel, chips], 'duvel', { name: 'Duvel 666', category: 'drink', emoji: '🍺' })

    expect(catalog.find((i) => i.id === 'duvel')?.name).toBe('Duvel 666')
    expect(roundLines(round, catalogSections(catalog, 'en'))).toEqual([
      { item: { id: 'duvel', name: 'Duvel 666', category: 'drink', emoji: '🍺' }, count: 2 },
    ])
  })

  it('moving an Item to the other category moves its tile to that section', () => {
    const catalog = editItem([duvel, chips], 'duvel', { ...duvel, category: 'snack' })
    const sections = catalogSections(catalog, 'en')
    expect(sections.drink).toEqual([])
    expect(sections.snack.map((i) => i.id)).toEqual(['chips', 'duvel'])
  })

  it('deleting an Item also takes it out of the Round being composed', () => {
    const round = add(add(add(emptyRound(), 'duvel'), 'duvel'), 'chips')
    const next = deleteItem({ catalog: [duvel, chips], round }, 'duvel')
    expect(next.catalog).toEqual([chips])
    expect(next.round.counts).toEqual({ chips: 1 })
  })
})
