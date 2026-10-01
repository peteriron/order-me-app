import { describe, expect, it } from 'vitest'
import { add, emptyRound, roundLines } from '../round/round.ts'
import { addToCatalog, catalogSections, checkDraft, deleteItem, editItem, seedCatalog, type Item } from './catalog.ts'

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

describe('Catalog sections (Items page: pinned first, then A–Z)', () => {
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

  it('lists pinned Items first, in the Operator’s order, then the rest A–Z', () => {
    const catalog = [
      item('cola', 'Cola', 'drink'),
      item('duvel', 'Duvel', 'drink'),
      item('beer', 'Beer', 'drink'),
      item('bitterballen', 'Bitterballen', 'snack'),
      item('chips', 'Chips', 'snack'),
    ]
    const sections = catalogSections(catalog, 'en', ['duvel', 'chips'])
    expect(sections.drink.map((i) => i.name)).toEqual(['Duvel', 'Beer', 'Cola'])
    expect(sections.snack.map((i) => i.name)).toEqual(['Chips', 'Bitterballen'])
  })

  it('sorts accented names where a reader expects them, not by code point', () => {
    const catalog = [item('1', 'Zwarte koffie', 'drink'), item('2', 'Éclair', 'drink')]
    expect(catalogSections(catalog, 'nl').drink.map((i) => i.name)).toEqual(['Éclair', 'Zwarte koffie'])
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
    const next = deleteItem({ catalog: [duvel, chips], round, pins: [] }, 'duvel')
    expect(next.catalog).toEqual([chips])
    expect(next.round.counts).toEqual({ chips: 1 })
  })
})
