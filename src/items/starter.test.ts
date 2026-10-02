import { describe, expect, it } from 'vitest'
import { editItem, seedCatalog, type Item } from './catalog.ts'
import { localizeCatalog, recognizeStarters } from './starter.ts'

const ids = () => {
  let n = 0
  return () => `id-${++n}`
}
const names = (catalog: Item[]) => catalog.map((i) => i.name)
const plain = (name: string, category: Item['category'] = 'drink'): Item => ({ id: name, name, category, emoji: '🍺' })

describe('starter Items follow the app language', () => {
  it('shows a Dutch-seeded starter Catalog in English, and back', () => {
    const catalog = seedCatalog('nl', ids())
    expect(names(localizeCatalog(catalog, 'en')).slice(0, 4)).toEqual(['Cola', 'Cola Zero', 'Still water', 'Sparkling water'])
    expect(names(localizeCatalog(catalog, 'nl')).slice(0, 4)).toEqual(['Cola', 'Cola Zero', 'Water plat', 'Water bruis'])
  })

  it('never translates an Item the Operator added', () => {
    const kriek = plain('Kriek')
    expect(localizeCatalog([kriek], 'nl')).toEqual([kriek])
  })

  it('a renamed starter Item keeps the Operator’s name in every language', () => {
    const [cola] = seedCatalog('en', ids())
    const renamed = editItem([cola!], cola!.id, { name: 'Coca-Cola', category: 'drink', emoji: '🥤' })
    expect(names(localizeCatalog(renamed, 'nl'))).toEqual(['Coca-Cola'])
    expect(renamed[0]!.starter).toBeUndefined()
  })

  it('changing only the emoji or category keeps it a starter Item', () => {
    const water = seedCatalog('en', ids())[2]!
    const edited = editItem([water], water.id, { name: 'Still water', category: 'snack', emoji: '🚰' })
    expect(localizeCatalog(edited, 'nl')).toEqual([{ ...water, name: 'Water plat', category: 'snack', emoji: '🚰' }])
  })

  it('keeps it a starter Item when the sheet saves the name it showed, in either language', () => {
    const water = seedCatalog('en', ids())[2]!
    const edited = editItem([water], water.id, { name: 'Water plat', category: 'drink', emoji: '💧' })
    expect(edited[0]!.starter).toBe(water.starter)
  })
})

describe('recognising starter Items in a Catalog saved before they were marked', () => {
  it('marks Items matching a current starter row by exact name and category, in either language', () => {
    const marked = recognizeStarters([plain('Still water'), plain('Water bruis'), plain('Chips', 'snack'), plain('Gin-tonic')])
    expect(names(localizeCatalog(marked, 'nl'))).toEqual(['Water plat', 'Water bruis', 'Chips', 'Gin-tonic'])
    expect(names(localizeCatalog(marked, 'en'))).toEqual(['Still water', 'Sparkling water', 'Chips', 'Gin & tonic'])
  })

  it('also knows the old starter list, with its own names', () => {
    const marked = recognizeStarters([plain('Beer'), plain('Plat water'), plain('Sterke drank'), plain('Thee'), plain('Rosé')])
    expect(names(localizeCatalog(marked, 'nl'))).toEqual(['Bier', 'Plat water', 'Sterke drank', 'Thee', 'Rosé'])
    expect(names(localizeCatalog(marked, 'en'))).toEqual(['Beer', 'Still water', 'Liquor', 'Tea', 'Rosé'])
  })

  it('leaves alone a changed name, a different category, and Items already marked', () => {
    const catalog = [plain('Still Water'), plain('Duvel', 'snack'), plain('Kriek')]
    expect(recognizeStarters(catalog)).toEqual(catalog)
    const seeded = seedCatalog('nl', ids())
    expect(recognizeStarters(seeded)).toEqual(seeded)
  })

  it('a seeded Catalog is marked from the start', () => {
    expect(seedCatalog('en', ids()).every((item) => item.starter)).toBe(true)
  })
})
