import type { Item, Sections } from '../items/catalog.ts'

/** The one Round being composed. Only Items with a count above zero are present. */
export interface ComposingRound {
  counts: Readonly<Record<string, number>>
}

export function emptyRound(): ComposingRound {
  return { counts: {} }
}

/** Empties the Round; `undo` gives back exactly what it held (the "Round cleared · Undo" toast, #55). */
export function clearWithUndo(round: ComposingRound): { next: ComposingRound; undo: () => ComposingRound } {
  return { next: emptyRound(), undo: () => round }
}

export function add(round: ComposingRound, itemId: string): ComposingRound {
  return { counts: { ...round.counts, [itemId]: countOf(round, itemId) + 1 } }
}

export function remove(round: ComposingRound, itemId: string): ComposingRound {
  const count = countOf(round, itemId)
  if (count === 0) return round
  const { [itemId]: _removed, ...rest } = round.counts
  return { counts: count === 1 ? rest : { ...rest, [itemId]: count - 1 } }
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
