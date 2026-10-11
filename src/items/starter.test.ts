import { describe, expect, it } from 'vitest'
import { editItem, seedCatalog as seed, type Item } from './catalog.ts'
import { fromCategories } from './groups.ts'
import { legacyGroupKey, localizeCatalog, localizeGroups, recognizeStarters, type LegacyItem } from './starter.ts'

const ids = () => {
  let n = 0
  return () => `id-${++n}`
}
const seedCatalog = (locale: 'en' | 'nl', newId: () => string) => seed(locale, newId).catalog
const names = (list: { name: string }[]) => list.map((i) => i.name)
const plain = (name: string, category: LegacyItem['category'] = 'drink'): LegacyItem => ({ id: name, name, category, emoji: '🍺' })
/** v5 Items recognised, then put in one group, to localize. */
const recognized = (items: LegacyItem[]): Item[] =>
  recognizeStarters(items).map(({ category: _category, ...item }) => ({ ...item, group: 'g' }))

describe('starter Items follow the app language', () => {
  it('shows a Dutch-seeded starter Catalog in English, and back', () => {
    const catalog = seedCatalog('nl', ids())
    expect(names(localizeCatalog(catalog, 'en')).slice(0, 4)).toEqual(['Cola', 'Cola Zero', 'Still water', 'Sparkling water'])
    expect(names(localizeCatalog(catalog, 'nl')).slice(0, 4)).toEqual(['Cola', 'Cola Zero', 'Water plat', 'Water bruis'])
  })

  it('names Bitterballen "Dutch meatballs" in English', () => {
    const catalog = seedCatalog('nl', ids())
    expect(names(localizeCatalog(catalog, 'nl')).at(-1)).toBe('Bitterballen')
    expect(names(localizeCatalog(catalog, 'en')).at(-1)).toBe('Dutch meatballs')
    // A Catalog saved with the old English name still counts it as the starter snack.
    expect(names(localizeCatalog(recognized([plain('Bitterballen', 'snack')]), 'en'))).toEqual(['Dutch meatballs'])
  })

  it('never translates an Item the Operator added', () => {
    const kriek: Item = { id: 'k', name: 'Kriek', group: 'g', emoji: '🍒' }
    expect(localizeCatalog([kriek], 'nl')).toEqual([kriek])
  })

  it('a renamed starter Item keeps the Operator’s name in every language', () => {
    const [cola] = seedCatalog('en', ids())
    const renamed = editItem([cola!], cola!.id, { name: 'Coca-Cola', group: cola!.group, emoji: '🥤' })
    expect(names(localizeCatalog(renamed, 'nl'))).toEqual(['Coca-Cola'])
    expect(renamed[0]!.starter).toBeUndefined()
  })

  it('changing only the emoji or group keeps it a starter Item', () => {
    const water = seedCatalog('en', ids())[2]!
    const edited = editItem([water], water.id, { name: 'Still water', group: 'other', emoji: '🚰' })
    expect(localizeCatalog(edited, 'nl')).toEqual([{ ...water, name: 'Water plat', group: 'other', emoji: '🚰' }])
  })

  it('keeps it a starter Item when the sheet saves the name it showed, in either language', () => {
    const water = seedCatalog('en', ids())[2]!
    const edited = editItem([water], water.id, { name: 'Water plat', group: water.group, emoji: '💧' })
    expect(edited[0]!.starter).toBe(water.starter)
  })

  it('a seeded Catalog is marked from the start', () => {
    expect(seedCatalog('en', ids()).every((item) => item.starter)).toBe(true)
  })
})

describe('starter groups follow the app language', () => {
  it('names starter groups in the app’s language; a renamed or added group stays as typed', () => {
    const { groups } = seed('en', ids())
    const mine = [...groups.slice(0, 2), { id: 'x', name: 'Fruitbier', colour: 6 }]
    expect(names(localizeGroups(mine, 'nl'))).toEqual(['Frisdrank', 'Bier', 'Fruitbier'])
    expect(names(localizeGroups([{ ...groups[0]!, name: 'Fris', starter: undefined }], 'en'))).toEqual(['Fris'])
  })
})

describe('recognising starter Items in a Catalog saved before they were marked', () => {
  it('marks Items matching a current starter row by exact name and category, in either language', () => {
    const marked = recognized([plain('Still water'), plain('Water bruis'), plain('Chips', 'snack'), plain('Gin-tonic')])
    expect(names(localizeCatalog(marked, 'nl'))).toEqual(['Water plat', 'Water bruis', 'Chips', 'Gin-tonic'])
    expect(names(localizeCatalog(marked, 'en'))).toEqual(['Still water', 'Sparkling water', 'Chips', 'Gin & tonic'])
  })

  it('also knows the old starter list, with its own names', () => {
    const marked = recognized([plain('Beer'), plain('Plat water'), plain('Sterke drank'), plain('Thee'), plain('Rosé')])
    expect(names(localizeCatalog(marked, 'nl'))).toEqual(['Bier', 'Plat water', 'Sterke drank', 'Thee', 'Rosé'])
    expect(names(localizeCatalog(marked, 'en'))).toEqual(['Beer', 'Still water', 'Liquor', 'Tea', 'Rosé'])
  })

  it('leaves alone a changed name, a different category, and Items already marked', () => {
    const catalog = [plain('Still Water'), plain('Duvel', 'snack'), plain('Kriek')]
    expect(recognizeStarters(catalog)).toEqual(catalog)
    const marked = [{ ...plain('Kriek'), starter: 'duvel' }]
    expect(recognizeStarters(marked)).toEqual(marked)
  })
})

describe('groups for a Catalog saved or shared by v5 (categories)', () => {
  it('puts starter Items in their own group, the Operator’s drinks in Other drinks and their snacks in Snacks', () => {
    expect(legacyGroupKey({ starter: 'duvel', category: 'drink' })).toBe('beer')
    expect(legacyGroupKey({ starter: 'cava', category: 'drink' })).toBe('wine')
    expect(legacyGroupKey({ starter: 'liquor', category: 'drink' })).toBe('strong')
    expect(legacyGroupKey({ category: 'drink' })).toBe('other-drinks')
    expect(legacyGroupKey({ category: 'snack' })).toBe('snacks')
    // A starter Item the Operator moved to the other category goes with that category.
    expect(legacyGroupKey({ starter: 'cola', category: 'snack' })).toBe('snacks')
  })

  it('makes the six starter groups, and Other drinks before Snacks only when needed; Item ids stay', () => {
    const v5 = recognizeStarters([plain('Duvel'), plain('Kriek'), plain('Pretzel', 'snack'), plain('Chips', 'snack')])
    const { catalog, groups } = fromCategories(v5, 'nl', ids())
    expect(names(groups)).toEqual(['Frisdrank', 'Bier', 'Warm', 'Wijn', 'Sterk', 'Andere dranken', 'Snacks'])
    const groupOf = (id: string) => groups.find((g) => g.id === catalog.find((i) => i.id === id)!.group)!.starter
    expect(['Duvel', 'Kriek', 'Pretzel', 'Chips'].map(groupOf)).toEqual(['beer', 'other-drinks', 'snacks', 'snacks'])
    expect(groups.map((g) => g.colour)).toEqual([0, 1, 2, 3, 4, 6, 5])

    const onlyStarters = fromCategories(recognizeStarters([plain('Duvel')]), 'en', ids())
    expect(names(onlyStarters.groups)).toEqual(['Soda', 'Beer', 'Hot', 'Wine', 'Strong', 'Snacks'])
  })
})
