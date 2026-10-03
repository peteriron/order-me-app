import { describe, expect, it } from 'vitest'
import { markOrdered } from '../history/history.ts'
import type { Item, Sections } from '../items/catalog.ts'
import { add, emptyRound, roundLines } from '../round/round.ts'
import { shareText } from './share.ts'
import { showSections } from './showOrder.ts'

const item = (id: string, category: Item['category'] = 'drink'): Item => ({ id, name: id, category, emoji: '🍺' })
/** The phone's own grid: Duvel, Cola, Water; then Chips, Nuts. */
const grid: Sections = { drink: [item('Duvel'), item('Cola'), item('Water')], snack: [item('Chips', 'snack'), item('Nuts', 'snack')] }
const names = (sections: Sections) => [...sections.drink, ...sections.snack].map((i) => i.id)

describe('the Show order from a shared Round', () => {
  it('without one, Show follows the grid', () => {
    expect(showSections(grid, [])).toEqual(grid)
  })

  it('lists the Items in the Show order first, in that order, then the rest in grid order, drinks before snacks', () => {
    expect(names(showSections(grid, ['Nuts', 'Water', 'Cola']))).toEqual(['Water', 'Cola', 'Duvel', 'Nuts', 'Chips'])
  })

  it('ignores ids that are no longer in the Catalog', () => {
    expect(names(showSections(grid, ['Gone', 'Water']))).toEqual(['Water', 'Duvel', 'Cola', 'Chips', 'Nuts'])
  })

  it('is the order of what Share as text sends and what History saves', () => {
    const round = add(add(add(emptyRound(), 'Duvel'), 'Water'), 'Water')
    const sections = showSections(grid, ['Water'])
    expect(shareText(roundLines(round, sections), 'Total')).toBe('2× Water\n1× Duvel\nTotal: 3')
    const { next } = markOrdered({ round, history: [] }, sections, { id: 'r1', placedAt: '2026-10-03T20:00:00.000Z' })
    expect(next.history[0]!.lines.map((l) => l.name)).toEqual(['Water', 'Duvel'])
  })
})
