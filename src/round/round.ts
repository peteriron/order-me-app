import type { Item, Sections } from '../items/catalog.ts'

/** The table number and a free remark the Operator can add to a Round on the Show page. */
export interface RoundNote {
  table?: string
  remark?: string
}

/** The one Round being composed. Only Items with a count above zero are present. */
export interface ComposingRound extends RoundNote {
  counts: Readonly<Record<string, number>>
}

/** The Round with its table and/or remark changed (as typed; tidied by `noteOf` when placed or shared). */
export function withNote(round: ComposingRound, note: RoundNote): ComposingRound {
  return { ...round, ...note }
}

/** A Round's table and remark, trimmed, leaving out empty ones: what History saves and shares send. */
export function noteOf(source: RoundNote): RoundNote {
  const table = source.table?.trim()
  const remark = source.remark?.trim()
  return { ...(table ? { table } : {}), ...(remark ? { remark } : {}) }
}

export function emptyRound(): ComposingRound {
  return { counts: {} }
}

/** Empties the Round; `undo` gives back exactly what it held (the "Round cleared · Undo" toast, #55). */
export function clearWithUndo(round: ComposingRound): { next: ComposingRound; undo: () => ComposingRound } {
  return { next: emptyRound(), undo: () => round }
}

export function add(round: ComposingRound, itemId: string): ComposingRound {
  return { ...round, counts: { ...round.counts, [itemId]: countOf(round, itemId) + 1 } }
}

export function remove(round: ComposingRound, itemId: string): ComposingRound {
  const count = countOf(round, itemId)
  if (count === 0) return round
  const { [itemId]: _removed, ...rest } = round.counts
  return { ...round, counts: count === 1 ? rest : { ...rest, [itemId]: count - 1 } }
}

export function countOf(round: ComposingRound, itemId: string): number {
  return round.counts[itemId] ?? 0
}

export function totalOf(round: ComposingRound): number {
  return Object.values(round.counts).reduce((sum, n) => sum + n, 0)
}

export interface RoundLine {
  item: Item
  count: number
}

/** The composing Round as lines, in the same order as the grid: Drinks, then Snacks. */
export function roundLines(round: ComposingRound, sections: Sections): RoundLine[] {
  return [...sections.drink, ...sections.snack]
    .map((item) => ({ item, count: countOf(round, item.id) }))
    .filter((line) => line.count > 0)
}
