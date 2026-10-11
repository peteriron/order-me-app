import { byGroup, TEST_GROUPS } from '../testGroups.ts'
import { describe, expect, it } from 'vitest'
import { add, emptyRound, roundLines } from '../round/round.ts'
import { addToCatalog, catalogSections, checkDraft, deleteItem, deleteWithUndo, editItem, seedCatalog, type Item } from './catalog.ts'

const sequentialIds = () => {
  let n = 0
  return () => `id-${++n}`
}


describe('starter Catalog', () => {
  /** Each starter group as "Name: emoji name, …". */
  const boxes = (locale: 'en' | 'nl') => {
    const { catalog, groups } = seedCatalog(locale, sequentialIds())
    return catalogSections(catalog, groups).map(
      ({ group, items }) => `${group.name}: ${items.map((i) => `${i.emoji} ${i.name}`).join(', ')}`,
    )
  }

  it('seeds six groups in order, each with its Items, in Dutch', () => {
    expect(boxes('nl')).toEqual([
      'Frisdrank: 🥤 Cola, 🥤 Cola Zero, 💧 Water plat, 🫧 Water bruis, 🍊 Fanta, 🍋 Sprite, 🧋 Ice Tea, 🧃 Fruitsap, 🍋 Gini, 🫧 Tönissteiner',
      'Bier: 🍺 Pils, 🍺 Pils 0,0, 🍺 Duvel, 🍻 Speciaalbier',
      'Warm: ☕ Koffie, ☕ Deca, 🍵 Muntthee',
      'Wijn: 🥂 Witte wijn, 🍷 Rode wijn, 🍷 Rosé wijn, 🍾 Cava',
      'Sterk: 🍊 Aperol Spritz, 🍸 Gin-tonic, 🍹 Mocktail',
      'Snacks: 🥔 Chips, 🥜 Nootjes, 🧀 Kaasblokjes, 🧆 Bitterballen',
    ])
  })

  it('seeds the same in English', () => {
    expect(boxes('en')).toEqual([
      'Soda: 🥤 Cola, 🥤 Cola Zero, 💧 Still water, 🫧 Sparkling water, 🍊 Fanta, 🍋 Sprite, 🧋 Ice Tea, 🧃 Juice, 🍋 Gini, 🫧 Tönissteiner',
      'Beer: 🍺 Lager, 🍺 Lager 0.0, 🍺 Duvel, 🍻 Specialty beer',
      'Hot: ☕ Coffee, ☕ Decaf, 🍵 Mint tea',
      'Wine: 🥂 White wine, 🍷 Red wine, 🍷 Rosé wine, 🍾 Cava',
      'Strong: 🍊 Aperol Spritz, 🍸 Gin & tonic, 🍹 Mocktail',
      'Snacks: 🥔 Chips, 🥜 Nuts, 🧀 Cheese, 🧆 Dutch meatballs',
    ])
  })

  it('gives every Item and group its own id, and each group its own colour', () => {
    const { catalog, groups } = seedCatalog('en', sequentialIds())
    expect(new Set([...catalog, ...groups].map((x) => x.id)).size).toBe(28 + 6)
    expect(groups.map((g) => g.colour)).toEqual([0, 1, 2, 3, 4, 5])
  })
})

describe('Catalog sections (Items page: pinned first, then Catalog order)', () => {
  const item = (id: string, name: string, group: string): Item => ({ id, name, group, emoji: '🍺' })

  it('splits the Catalog into Drinks and Snacks, each in Catalog order', () => {
    const catalog = [
      item('1', 'Rosé', 'drink'),
      item('2', 'Nuts', 'snack'),
      item('3', 'Beer', 'drink'),
      item('4', 'Chips', 'snack'),
      item('5', 'Red wine', 'drink'),
    ]
    const sections = catalogSections(catalog, TEST_GROUPS)
    expect(byGroup(sections).drink.map((i) => i.name)).toEqual(['Rosé', 'Beer', 'Red wine'])
    expect(byGroup(sections).snack.map((i) => i.name)).toEqual(['Nuts', 'Chips'])
  })

  it('lists pinned Items first, in the Operator’s order, then the rest in Catalog order', () => {
    const catalog = [
      item('cola', 'Cola', 'drink'),
      item('duvel', 'Duvel', 'drink'),
      item('beer', 'Beer', 'drink'),
      item('bitterballen', 'Bitterballen', 'snack'),
      item('chips', 'Chips', 'snack'),
    ]
    const sections = catalogSections(catalog, TEST_GROUPS, ['duvel', 'chips'])
    expect(byGroup(sections).drink.map((i) => i.name)).toEqual(['Duvel', 'Cola', 'Beer'])
    expect(byGroup(sections).snack.map((i) => i.name)).toEqual(['Chips', 'Bitterballen'])
  })
})

describe('checking an Item draft from the sheet', () => {
  it('tidies the name: trims it and collapses runs of spaces', () => {
    expect(checkDraft({ name: '  Kriek   Boon ', group: 'drink', emoji: '🍒' })).toEqual({
      ok: true,
      value: { name: 'Kriek Boon', group: 'drink', emoji: '🍒' },
    })
  })

  it('needs a name', () => {
    expect(checkDraft({ name: '   ', group: 'drink', emoji: '🍺' })).toEqual({ ok: false, problem: 'nameRequired' })
  })

  it('keeps just the first emoji when several are typed, including multi-part ones', () => {
    const draft = (emoji: string) => checkDraft({ name: 'X', group: 'snack', emoji })
    expect(draft(' 🧉🍺 ')).toMatchObject({ value: { emoji: '🧉' } })
    expect(draft('👩‍🍳🍺')).toMatchObject({ value: { emoji: '👩‍🍳' } })
  })

  it('needs an emoji', () => {
    expect(checkDraft({ name: 'Kriek', group: 'drink', emoji: ' ' })).toEqual({ ok: false, problem: 'emojiRequired' })
  })
})

describe('editing the Catalog', () => {
  const duvel: Item = { id: 'duvel', name: 'Duvel', group: 'drink', emoji: '🍺' }
  const chips: Item = { id: 'chips', name: 'Chips', group: 'snack', emoji: '🥔' }

  it('adds a new Item with its own id', () => {
    const catalog = addToCatalog([duvel], { name: 'Kriek', group: 'drink', emoji: '🍒' }, 'kriek')
    expect(catalog).toEqual([duvel, { id: 'kriek', name: 'Kriek', group: 'drink', emoji: '🍒' }])
  })

  it('allows two Items with the same name, told apart by id', () => {
    const catalog = addToCatalog([duvel], { name: 'Duvel', group: 'drink', emoji: '🍻' }, 'duvel-2')
    expect(catalog.map((i) => i.id)).toEqual(['duvel', 'duvel-2'])
  })

  it('renaming an Item keeps its count in the Round being composed', () => {
    const round = add(add(emptyRound(), 'duvel'), 'duvel')
    const catalog = editItem([duvel, chips], 'duvel', { name: 'Duvel 666', group: 'drink', emoji: '🍺' })

    expect(catalog.find((i) => i.id === 'duvel')?.name).toBe('Duvel 666')
    expect(roundLines(round, catalogSections(catalog, TEST_GROUPS))).toEqual([
      { item: { id: 'duvel', name: 'Duvel 666', group: 'drink', emoji: '🍺' }, count: 2 },
    ])
  })

  it('moving an Item to the other group moves its tile to that section', () => {
    const catalog = editItem([duvel, chips], 'duvel', { ...duvel, group: 'snack' })
    const sections = catalogSections(catalog, TEST_GROUPS)
    expect(byGroup(sections).drink).toEqual([])
    expect(byGroup(sections).snack.map((i) => i.id)).toEqual(['duvel', 'chips'])
  })

  it('deleting an Item also takes it out of the Round being composed', () => {
    const round = add(add(add(emptyRound(), 'duvel'), 'duvel'), 'chips')
    const next = deleteItem({ catalog: [duvel, chips], round, pins: [] }, 'duvel')
    expect(next.catalog).toEqual([chips])
    expect(next.round.counts).toEqual({ chips: 1 })
  })
})

describe('deleting an Item, with Undo', () => {
  const item = (id: string): Item => ({ id, name: id, group: 'drink', emoji: '🍺' })
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
  const item = (id: string): Item => ({ id, name: id, group: 'drink', emoji: '🍺' })
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
