import { describe, expect, it } from 'vitest'
import type { PlacedRound } from '../history/history.ts'
import { addToCatalog, catalogSections, deleteItem, editItem, type Item } from '../items/catalog.ts'
import { emptyRound } from './round.ts'
import { gridSections, popularity, popularityOrder } from './tileOrder.ts'

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

  it('puts the most popular Items first in each section; ties and never-ordered Items keep Catalog order', () => {
    const sections = gridSections(catalog, popularityOrder(catalog, history, now))
    expect(names(sections.drink)).toEqual(['Duvel', 'Tea', 'Cola', 'Water', 'Beer'])
    expect(names(sections.snack)).toEqual(['Nuts', 'Chips'])
  })

  it('keeps the score of a renamed Item, since placed lines point at its id', () => {
    const renamed = { ...duvel, name: 'Aardbeienbier' }
    const order = popularityOrder([renamed, cola], history, now)
    expect(names(gridSections([cola, renamed], order).drink)).toEqual(['Aardbeienbier', 'Cola'])
  })

  it('is the Catalog order, like the Items page, when nothing has been placed yet', () => {
    const sections = gridSections(catalog, popularityOrder(catalog, [], now))
    expect(sections).toEqual(catalogSections(catalog))
  })

  describe('with Pinned Items', () => {
    const order = popularityOrder(catalog, history, now)

    it('puts pinned Items first in the Operator’s order, then the rest by Popularity', () => {
      const sections = gridSections(catalog, order, ['water', 'beer'])
      expect(names(sections.drink)).toEqual(['Water', 'Beer', 'Duvel', 'Tea', 'Cola'])
    })

    it('keeps pins per section', () => {
      const sections = gridSections(catalog, order, ['chips', 'tea'])
      expect(names(sections.drink)).toEqual(['Tea', 'Duvel', 'Cola', 'Water', 'Beer'])
      expect(names(sections.snack)).toEqual(['Chips', 'Nuts'])
    })

    it('puts an unpinned Item back in its Popularity place', () => {
      expect(names(gridSections(catalog, order, []).drink)).toEqual(['Duvel', 'Tea', 'Cola', 'Water', 'Beer'])
    })
  })

  describe('held fixed while a Round is being composed', () => {
    const order = popularityOrder(catalog, history, now)

    it('does not move a renamed Item', () => {
      const edited = editItem(catalog, 'beer', { name: 'Allagash', category: 'drink', emoji: '🍺' })
      expect(names(gridSections(edited, order).drink)).toEqual(['Duvel', 'Tea', 'Cola', 'Water', 'Allagash'])
    })

    it('puts newly added Items at the end of their section, in the order they were added', () => {
      let grown = addToCatalog(catalog, { name: 'Zero', category: 'drink', emoji: '🍺' }, 'zero')
      grown = addToCatalog(grown, { name: 'Apple juice', category: 'drink', emoji: '🧃' }, 'apple')
      expect(names(gridSections(grown, order).drink)).toEqual([
        'Duvel',
        'Tea',
        'Cola',
        'Water',
        'Beer',
        'Zero',
        'Apple juice',
      ])
    })

    it('drops deleted Items and keeps the rest where they were', () => {
      const { catalog: smaller } = deleteItem({ catalog, round: emptyRound(), pins: [] }, 'cola')
      expect(names(gridSections(smaller, order).drink)).toEqual(['Duvel', 'Tea', 'Water', 'Beer'])
    })

    it('moves an Item that changes category into the other section by its score', () => {
      const moved = editItem(catalog, 'tea', { name: 'Tea', category: 'snack', emoji: '🍵' })
      expect(names(gridSections(moved, order).snack)).toEqual(['Tea', 'Nuts', 'Chips'])
    })
  })
})
