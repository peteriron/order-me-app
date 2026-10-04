import { describe, expect, it } from 'vitest'
import { add, emptyRound, roundLines } from '../round/round.ts'
import { addToCatalog, catalogSections, checkDraft, deleteItem, deleteWithUndo, editItem, seedCatalog, type Item } from './catalog.ts'

const sequentialIds = () => {
  let n = 0
  return () => `id-${++n}`
}


describe('starter Catalog', () => {
  const drinks = (locale: 'en' | 'nl') =>
    seedCatalog(locale, sequentialIds())
      .filter((i) => i.category === 'drink')
      .map((i) => `${i.emoji} ${i.name}`)

  it('seeds the drinks in the order the grid starts with, in Dutch', () => {
    expect(drinks('nl')).toEqual([
      '🥤 Cola', '🥤 Cola Zero', '💧 Water plat', '🫧 Water bruis', '🍊 Fanta', '🍋 Sprite', '🧋 Ice Tea',
      '🧃 Fruitsap', '🍋 Gini', '🫧 Tönissteiner',
      '🍺 Pils', '🍺 Pils 0,0', '🍺 Duvel', '🍻 Speciaalbier',
      '☕ Koffie', '☕ Deca', '🍵 Muntthee',
      '🥂 Witte wijn', '🍷 Rode wijn', '🍷 Rosé wijn',
      '🍊 Aperol Spritz', '🍾 Cava', '🍸 Gin-tonic', '🍹 Mocktail',
    ])
  })

  it('seeds the same drinks in English', () => {
    expect(drinks('en')).toEqual([
      '🥤 Cola', '🥤 Cola Zero', '💧 Still water', '🫧 Sparkling water', '🍊 Fanta', '🍋 Sprite', '🧋 Ice Tea',
      '🧃 Juice', '🍋 Gini', '🫧 Tönissteiner',
      '🍺 Lager', '🍺 Lager 0.0', '🍺 Duvel', '🍻 Specialty beer',
      '☕ Coffee', '☕ Decaf', '🍵 Mint tea',
      '🥂 White wine', '🍷 Red wine', '🍷 Rosé wine',
      '🍊 Aperol Spritz', '🍾 Cava', '🍸 Gin & tonic', '🍹 Mocktail',
    ])
  })

  it('seeds four snacks', () => {
    const snacks = seedCatalog('en', sequentialIds()).filter((i) => i.category === 'snack')
    expect(snacks.map((i) => i.name)).toEqual(['Chips', 'Nuts', 'Cheese', 'Dutch meatballs'])
  })

  it('gives every Item its own id, even when names repeat across languages', () => {
    const ids = seedCatalog('en', sequentialIds()).map((i) => i.id)
    expect(new Set(ids).size).toBe(28)
  })
})

describe('Catalog sections (Items page: pinned first, then Catalog order)', () => {
  const item = (id: string, name: string, category: Item['category']): Item => ({ id, name, category, emoji: '🍺' })

  it('splits the Catalog into Drinks and Snacks, each in Catalog order', () => {
    const catalog = [
      item('1', 'Rosé', 'drink'),
      item('2', 'Nuts', 'snack'),
      item('3', 'Beer', 'drink'),
      item('4', 'Chips', 'snack'),
      item('5', 'Red wine', 'drink'),
    ]
    const sections = catalogSections(catalog)
    expect(sections.drink.map((i) => i.name)).toEqual(['Rosé', 'Beer', 'Red wine'])
    expect(sections.snack.map((i) => i.name)).toEqual(['Nuts', 'Chips'])
  })

  it('lists pinned Items first, in the Operator’s order, then the rest in Catalog order', () => {
    const catalog = [
      item('cola', 'Cola', 'drink'),
      item('duvel', 'Duvel', 'drink'),
      item('beer', 'Beer', 'drink'),
      item('bitterballen', 'Bitterballen', 'snack'),
      item('chips', 'Chips', 'snack'),
    ]
    const sections = catalogSections(catalog, ['duvel', 'chips'])
    expect(sections.drink.map((i) => i.name)).toEqual(['Duvel', 'Cola', 'Beer'])
    expect(sections.snack.map((i) => i.name)).toEqual(['Chips', 'Bitterballen'])
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
    expect(roundLines(round, catalogSections(catalog))).toEqual([
      { item: { id: 'duvel', name: 'Duvel 666', category: 'drink', emoji: '🍺' }, count: 2 },
    ])
  })

  it('moving an Item to the other category moves its tile to that section', () => {
    const catalog = editItem([duvel, chips], 'duvel', { ...duvel, category: 'snack' })
    const sections = catalogSections(catalog)
    expect(sections.drink).toEqual([])
    expect(sections.snack.map((i) => i.id)).toEqual(['duvel', 'chips'])
  })

  it('deleting an Item also takes it out of the Round being composed', () => {
    const round = add(add(add(emptyRound(), 'duvel'), 'duvel'), 'chips')
    const next = deleteItem({ catalog: [duvel, chips], round, pins: [] }, 'duvel')
    expect(next.catalog).toEqual([chips])
    expect(next.round.counts).toEqual({ chips: 1 })
  })
})

describe('deleting an Item, with Undo', () => {
  const item = (id: string): Item => ({ id, name: id, category: 'drink', emoji: '🍺' })
  const before = {
    catalog: [item('a'), item('b'), item('c')],
    round: add(add(add(emptyRound(), 'b'), 'b'), 'c'),
    pins: ['c', 'b', 'a'],
    showOrder: ['a', 'b', 'c'],
  }

  it('removes the Item from the Catalog, the Round, the pins and the Show order', () => {
    const { next } = deleteWithUndo(before, 'b')
    expect(next).toEqual({
      catalog: [item('a'), item('c')],
      round: { counts: { c: 1 } },
      pins: ['c', 'a'],
      showOrder: ['a', 'c'],
    })
  })

  it('Undo puts it back where it was: Catalog place, pin position, Round count and Show order position', () => {
    const { next, undo } = deleteWithUndo(before, 'b')
    const later = { ...before, ...next }
    expect({ ...later, ...undo(later) }).toEqual(before)
  })

  it('Undo keeps what changed in the meantime', () => {
    const { next, undo } = deleteWithUndo(before, 'b')
    const later = { ...before, ...next, round: add(next.round, 'a') }
    expect({ ...later, ...undo(later) }.round.counts).toEqual({ a: 1, b: 2, c: 1 })
  })
})

describe('deleting an Item keeps the Round’s table and remark', () => {
  const item = (id: string): Item => ({ id, name: id, category: 'drink', emoji: '🍺' })
  const noted = {
    catalog: [item('a'), item('b')],
    round: { counts: { b: 2 }, table: '12', remark: 'No ice' },
    pins: [],
    showOrder: [],
  }

  it('keeps them when the Item is deleted, also one that isn’t in the Round', () => {
    expect(deleteWithUndo(noted, 'b').next.round).toEqual({ counts: {}, table: '12', remark: 'No ice' })
    expect(deleteWithUndo(noted, 'a').next.round).toEqual(noted.round)
  })

  it('keeps them when the delete is undone', () => {
    const { next, undo } = deleteWithUndo(noted, 'b')
    const later = { ...noted, ...next }
    expect({ ...later, ...undo(later) }.round).toEqual(noted.round)
  })
})
