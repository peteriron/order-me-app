import { describe, expect, it } from 'vitest'
import { emptyRound } from '../round/round.ts'
import { deleteItem, type Item } from './catalog.ts'
import { movePin, pinnedFirst, pinsAfterEdit, togglePin } from './pins.ts'

const item = (id: string, category: Item['category'] = 'drink'): Item => ({ id, name: id, category, emoji: '🍺' })
const ids = (items: Item[]) => items.map((i) => i.id)

const duvel = item('duvel')
const cola = item('cola')
const tea = item('tea')
const water = item('water')
const chips = item('chips', 'snack')
const nuts = item('nuts', 'snack')
const catalog = [duvel, cola, tea, water, chips, nuts]

describe('pinning an Item', () => {
  it('pins it last among the pinned Items, and unpins it again', () => {
    const pins = togglePin(togglePin([], 'tea'), 'duvel')
    expect(pins).toEqual(['tea', 'duvel'])
    expect(togglePin(pins, 'tea')).toEqual(['duvel'])
  })
})

describe('putting pinned Items first', () => {
  it('pinned Items in pin order, then the rest in the order given', () => {
    expect(ids(pinnedFirst([duvel, cola, tea, water], ['water', 'cola']))).toEqual(['water', 'cola', 'duvel', 'tea'])
  })

  it('ignores pins of Items that are not in the list, such as the other section’s', () => {
    expect(ids(pinnedFirst([chips, nuts], ['duvel', 'nuts']))).toEqual(['nuts', 'chips'])
  })
})

describe('reordering pinned Items', () => {
  const pins = ['duvel', 'chips', 'cola', 'nuts', 'tea']

  it('moves a pinned Item to a new position within its own section', () => {
    const moved = movePin(pins, catalog, 'tea', 0)
    expect(moved.filter((id) => ['duvel', 'cola', 'tea'].includes(id))).toEqual(['tea', 'duvel', 'cola'])
  })

  it('leaves the other section’s pins in their order', () => {
    const moved = movePin(pins, catalog, 'duvel', 2)
    expect(moved.filter((id) => ['chips', 'nuts'].includes(id))).toEqual(['chips', 'nuts'])
    expect(ids(pinnedFirst([duvel, cola, tea], moved))).toEqual(['cola', 'tea', 'duvel'])
  })

  it('keeps the position within the section’s pins', () => {
    expect(ids(pinnedFirst([duvel, cola, tea], movePin(pins, catalog, 'duvel', 99)))).toEqual(['cola', 'tea', 'duvel'])
    expect(ids(pinnedFirst([duvel, cola, tea], movePin(pins, catalog, 'tea', -1)))).toEqual(['tea', 'duvel', 'cola'])
  })

  it('does nothing for an Item that is not pinned', () => {
    expect(movePin(pins, catalog, 'water', 0)).toEqual(pins)
  })
})

describe('pins when the Catalog changes', () => {
  it('deleting a pinned Item removes its pin', () => {
    const next = deleteItem({ catalog, round: emptyRound(), pins: ['cola', 'duvel'] }, 'cola')
    expect(next.pins).toEqual(['duvel'])
  })

  it('a pinned Item that changes category stays pinned, last among the other section’s pins', () => {
    const pins = ['duvel', 'chips', 'cola', 'nuts']
    const next = pinsAfterEdit(pins, catalog, 'duvel', { name: 'Duvel', category: 'snack', emoji: '🍺' })
    expect(ids(pinnedFirst([chips, nuts, { ...duvel, category: 'snack' }], next))).toEqual(['chips', 'nuts', 'duvel'])
  })

  it('renaming a pinned Item keeps its place', () => {
    const pins = ['duvel', 'cola']
    expect(pinsAfterEdit(pins, catalog, 'duvel', { name: 'Duvel 666', category: 'drink', emoji: '🍺' })).toBe(pins)
  })

  it('an unpinned Item that changes category stays unpinned', () => {
    const pins = ['duvel']
    expect(pinsAfterEdit(pins, catalog, 'tea', { name: 'Tea', category: 'snack', emoji: '🍵' })).toBe(pins)
  })
})
