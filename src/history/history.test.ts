import { describe, expect, it } from 'vitest'
import { catalogSections, type Item } from '../items/catalog.ts'
import { add, emptyRound, totalOf, withNote } from '../round/round.ts'
import { deletePlacedRound, groupByDay, markOrdered, orderAgain, placedTotal } from './history.ts'

describe('marking a Round as ordered', () => {
  const duvel: Item = { id: 'duvel', name: 'Duvel', category: 'drink', emoji: '🍺' }
  const chips: Item = { id: 'chips', name: 'Chips', category: 'snack', emoji: '🥔' }
  const catalog = [duvel, chips]
  const meta = { id: 'round-1', placedAt: '2026-09-22T21:14:00.000Z' }
  const composed = add(add(add(emptyRound(), 'duvel'), 'duvel'), 'chips')

  it('adds a placed Round to history with a snapshot of each line, and empties the composing Round', () => {
    const { next } = markOrdered({ round: composed, history: [] }, catalogSections(catalog), meta)

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
    const { next } = markOrdered({ round: composed, history: [older] }, catalogSections(catalog), meta)
    expect(next.history.map((r) => r.id)).toEqual(['round-1', 'round-0'])
  })

  it('keeps what was ordered even when the Item is edited in place afterwards', () => {
    const editable: Item = { ...duvel }
    const { next } = markOrdered({ round: composed, history: [] }, catalogSections([editable, chips]), meta)
    editable.name = 'Duvel Tripel Hop'
    editable.emoji = '🍻'
    expect(next.history[0].lines[0]).toMatchObject({ itemId: 'duvel', name: 'Duvel', emoji: '🍺' })
  })

  it('undo takes the Round back out of history and restores what was being composed', () => {
    const before = { round: composed, history: [] }
    const { next, undo } = markOrdered(before, catalogSections(catalog), meta)
    expect(undo(next)).toEqual(before)
  })
})

describe('history grouped by day', () => {
  // Local wall-clock times, as the Operator experiences them.
  const at = (y: number, m: number, d: number, h: number, min = 0) => new Date(y, m - 1, d, h, min).toISOString()
  const placed = (id: string, placedAt: string) => ({ id, placedAt, lines: [] })
  const now = new Date(2026, 8, 23, 20, 0) // 23 Sep 2026, 20:00

  it('groups placed Rounds by calendar day, newest first, with how many days ago each day was', () => {
    const history = [
      placed('tonight-2', at(2026, 9, 23, 19, 30)),
      placed('tonight-1', at(2026, 9, 23, 18, 5)),
      placed('last-night', at(2026, 9, 22, 23, 50)),
      placed('last-month', at(2026, 8, 30, 21, 0)),
    ]
    expect(groupByDay(history, now).map((g) => [g.daysAgo, g.rounds.map((r) => r.id)])).toEqual([
      [0, ['tonight-2', 'tonight-1']],
      [1, ['last-night']],
      [24, ['last-month']],
    ])
  })

  it('splits at local midnight, not after 24 hours', () => {
    const justBeforeMidnight = placed('late', at(2026, 9, 22, 23, 59))
    const justAfterMidnight = placed('early', at(2026, 9, 23, 0, 1))
    const groups = groupByDay([justAfterMidnight, justBeforeMidnight], new Date(2026, 8, 23, 0, 30))
    expect(groups.map((g) => g.daysAgo)).toEqual([0, 1])
  })

  it('has no groups when nothing has been placed', () => {
    expect(groupByDay([], now)).toEqual([])
  })
})

describe('placed Rounds in history', () => {
  const line = (itemId: string, name: string, count: number) => ({ itemId, name, category: 'drink' as const, emoji: '🍺', count })
  const r1 = { id: 'r1', placedAt: '2026-09-23T19:00:00.000Z', lines: [line('d', 'Duvel', 3), line('c', 'Cola', 2)] }
  const r2 = { id: 'r2', placedAt: '2026-09-22T19:00:00.000Z', lines: [line('d', 'Duvel', 1)] }

  it('counts every Item in a placed Round', () => {
    expect(placedTotal(r1)).toBe(5)
  })

  it('deletes one placed Round and keeps the rest in order', () => {
    const r0 = { ...r2, id: 'r0' }
    expect(deletePlacedRound([r1, r2, r0], 'r2').map((r) => r.id)).toEqual(['r1', 'r0'])
  })
})

describe('order again', () => {
  const duvel: Item = { id: 'duvel', name: 'Duvel', category: 'drink', emoji: '🍺' }
  const chips: Item = { id: 'chips', name: 'Chips', category: 'snack', emoji: '🥔' }
  const line = (item: Item, count: number, nameThen = item.name) => ({
    itemId: item.id,
    name: nameThen,
    category: item.category,
    emoji: item.emoji,
    count,
  })
  const lastFriday = { id: 'r1', placedAt: '2026-09-18T21:00:00.000Z', lines: [line(duvel, 3), line(chips, 2)] }

  it('makes a composing Round with the same counts', () => {
    const { round, skipped } = orderAgain(lastFriday, [duvel, chips])
    expect(round.counts).toEqual({ duvel: 3, chips: 2 })
    expect(skipped).toBe(0)
  })

  it('still finds an Item that was renamed since, by its id', () => {
    const renamed = { ...duvel, name: 'Duvel Tripel' }
    const placed = { ...lastFriday, lines: [line(duvel, 3)] }
    expect(orderAgain(placed, [renamed, chips]).round.counts).toEqual({ duvel: 3 })
  })

  it('skips lines whose Item was deleted from the Catalog, and says how many', () => {
    const { round, skipped } = orderAgain(lastFriday, [chips])
    expect(round.counts).toEqual({ chips: 2 })
    expect(skipped).toBe(1)
  })

  it('copies the placed Round rather than reopening it', () => {
    const before = structuredClone(lastFriday)
    const { round } = orderAgain(lastFriday, [duvel, chips])
    add(round, 'duvel')
    expect(lastFriday).toEqual(before)
  })
})

describe('the table and remark in History', () => {
  const duvel: Item = { id: 'duvel', name: 'Duvel', category: 'drink', emoji: '🍺' }
  const sections = catalogSections([duvel])
  const meta = { id: 'r1', placedAt: '2026-10-04T20:00:00.000Z' }

  it('are saved with the placed Round, tidied, and the next Round starts without them', () => {
    const round = withNote(add(emptyRound(), 'duvel'), { table: ' 12 ', remark: 'No ice ' })
    const { next } = markOrdered({ round, history: [] }, sections, meta)
    expect(next.history[0]).toMatchObject({ table: '12', remark: 'No ice' })
    expect(next.round).toEqual(emptyRound())
  })

  it('are left out when empty', () => {
    const round = withNote(add(emptyRound(), 'duvel'), { table: '', remark: '  ' })
    const { next } = markOrdered({ round, history: [] }, sections, meta)
    expect(next.history[0]).not.toHaveProperty('table')
    expect(next.history[0]).not.toHaveProperty('remark')
  })

  it('come back with Order again', () => {
    const round = withNote(add(emptyRound(), 'duvel'), { table: '12', remark: 'No ice' })
    const placed = markOrdered({ round, history: [] }, sections, meta).next.history[0]!
    expect(orderAgain(placed, [duvel]).round).toEqual({ counts: { duvel: 1 }, table: '12', remark: 'No ice' })
  })
})
