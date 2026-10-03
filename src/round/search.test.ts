import { describe, expect, it } from 'vitest'
import type { Item, Sections } from '../items/catalog.ts'
import { searchSections } from './search.ts'

const item = (name: string, category: Item['category'] = 'drink'): Item => ({ id: name, name, category, emoji: '🍺' })
const grid: Sections = {
  drink: [item('Duvel'), item('Cola'), item('Cola Zero'), item('Rosé wine'), item('Water plat')],
  snack: [item('Chips', 'snack'), item('Kaasblokjes', 'snack')],
}
const names = (sections: Sections) => [...sections.drink, ...sections.snack].map((i) => i.name)

describe('searching the Round page', () => {
  it('shows everything for an empty or blank search', () => {
    expect(searchSections(grid, '')).toEqual(grid)
    expect(searchSections(grid, '   ')).toEqual(grid)
  })

  it('keeps the Items whose name contains the text, in grid order, per section', () => {
    expect(searchSections(grid, 'col')).toEqual({ drink: [item('Cola'), item('Cola Zero')], snack: [] })
    expect(names(searchSections(grid, 'a'))).toEqual(['Cola', 'Cola Zero', 'Water plat', 'Kaasblokjes'])
  })

  it('ignores upper and lower case, accents and surrounding spaces', () => {
    expect(names(searchSections(grid, ' ROSE '))).toEqual(['Rosé wine'])
    expect(names(searchSections(grid, 'rosé'))).toEqual(['Rosé wine'])
  })

  it('finds nothing when nothing matches', () => {
    expect(searchSections(grid, 'Kriek')).toEqual({ drink: [], snack: [] })
  })
})
