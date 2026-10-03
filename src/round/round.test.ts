import { describe, expect, it } from 'vitest'
import { catalogSections, type Item } from '../items/catalog.ts'
import { add, clearWithUndo, countOf, emptyRound, remove, roundLines, totalOf, withNote } from './round.ts'

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

  it('never mutates the Round it was given', () => {
    const before = emptyRound()
    add(before, 'duvel')
    expect(totalOf(before)).toBe(0)
  })
})

describe('Round lines for the Counter view', () => {
  const duvel: Item = { id: 'duvel', name: 'Duvel', category: 'drink', emoji: '🍺' }
  const cola: Item = { id: 'cola', name: 'Cola', category: 'drink', emoji: '🥤' }
  const chips: Item = { id: 'chips', name: 'Chips', category: 'snack', emoji: '🥔' }
  const sections = catalogSections([chips, duvel, cola])

  it('lists drinks then snacks, in grid order, with their counts', () => {
    const round = add(add(add(add(emptyRound(), 'chips'), 'duvel'), 'duvel'), 'cola')
    expect(roundLines(round, sections).map((l) => [l.item.name, l.count])).toEqual([
      ['Duvel', 2],
      ['Cola', 1],
      ['Chips', 1],
    ])
  })

  it('leaves out Items that are not in the Round', () => {
    const round = add(emptyRound(), 'duvel')
    expect(roundLines(round, sections).map((l) => l.item.name)).toEqual(['Duvel'])
  })
})

describe('Clear, with Undo', () => {
  it('empties the Round, and Undo brings back exactly what it held', () => {
    const round = add(add(add(emptyRound(), 'duvel'), 'duvel'), 'cola')
    const { next, undo } = clearWithUndo(round)
    expect(totalOf(next)).toBe(0)
    expect(undo()).toEqual(round)
  })
})

describe('the table and remark of the Round being composed', () => {
  it('are kept while drinks are added and removed', () => {
    let round = withNote(add(emptyRound(), 'duvel'), { table: '12', remark: 'No ice' })
    round = remove(add(round, 'cola'), 'cola')
    expect(round).toEqual({ counts: { duvel: 1 }, table: '12', remark: 'No ice' })
  })

  it('are emptied by Clear, and Undo brings them back', () => {
    const round = withNote(add(emptyRound(), 'duvel'), { table: '12', remark: 'No ice' })
    const { next, undo } = clearWithUndo(round)
    expect(next).toEqual(emptyRound())
    expect(undo()).toEqual(round)
  })

  it('can be set one at a time', () => {
    const round = withNote(withNote(emptyRound(), { table: '12' }), { remark: 'Terrace' })
    expect(round).toMatchObject({ table: '12', remark: 'Terrace' })
  })
})
