import { describe, expect, it } from 'vitest'
import {
  add,
  clear,
  countOf,
  emptyRound,
  gridSections,
  markOrdered,
  remove,
  roundLines,
  seedCatalog,
  totalOf,
  type Item,
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

describe('grid sections', () => {
  const item = (id: string, name: string, category: Item['category']): Item => ({ id, name, category, emoji: '🍺' })

  it('splits the Catalog into Drinks and Snacks, each A–Z', () => {
    const catalog = [
      item('1', 'Rosé', 'drink'),
      item('2', 'Nuts', 'snack'),
      item('3', 'Beer', 'drink'),
      item('4', 'Chips', 'snack'),
      item('5', 'Red wine', 'drink'),
    ]
    const sections = gridSections(catalog, 'en')
    expect(sections.drink.map((i) => i.name)).toEqual(['Beer', 'Red wine', 'Rosé'])
    expect(sections.snack.map((i) => i.name)).toEqual(['Chips', 'Nuts'])
  })

  it('sorts accented names where a reader expects them, not by code point', () => {
    const catalog = [item('1', 'Zwarte koffie', 'drink'), item('2', 'Éclair', 'drink')]
    expect(gridSections(catalog, 'nl').drink.map((i) => i.name)).toEqual(['Éclair', 'Zwarte koffie'])
  })
})

describe('Round lines for the Counter view', () => {
  const duvel: Item = { id: 'duvel', name: 'Duvel', category: 'drink', emoji: '🍺' }
  const cola: Item = { id: 'cola', name: 'Cola', category: 'drink', emoji: '🥤' }
  const chips: Item = { id: 'chips', name: 'Chips', category: 'snack', emoji: '🥔' }
  const sections = gridSections([chips, duvel, cola], 'en')

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
    const { next } = markOrdered({ round: composed, history: [] }, gridSections(catalog, 'en'), meta)

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
    const { next } = markOrdered({ round: composed, history: [older] }, gridSections(catalog, 'en'), meta)
    expect(next.history.map((r) => r.id)).toEqual(['round-1', 'round-0'])
  })

  it('keeps what was ordered even when the Item is edited in place afterwards', () => {
    const editable: Item = { ...duvel }
    const { next } = markOrdered({ round: composed, history: [] }, gridSections([editable, chips], 'en'), meta)
    editable.name = 'Duvel Tripel Hop'
    editable.emoji = '🍻'
    expect(next.history[0].lines[0]).toMatchObject({ itemId: 'duvel', name: 'Duvel', emoji: '🍺' })
  })

  it('undo takes the Round back out of history and restores what was being composed', () => {
    const before = { round: composed, history: [] }
    const { next, undo } = markOrdered(before, gridSections(catalog, 'en'), meta)
    expect(undo(next)).toEqual(before)
  })
})
