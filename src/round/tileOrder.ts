import type { PlacedRound } from '../history/history.ts'
import type { Catalog, Category, Item, Sections } from '../items/catalog.ts'
import type { Locale } from '../shared/i18n.ts'

/**
 * Tiles on the Round page, laid out from an order frozen by `popularityOrder`. Edits never move a tile until the
 * next recompute: renamed Items keep their place, and Items not in the order yet (just added) go last, as added.
 */
export function gridSections(catalog: Catalog, order: readonly string[]): Sections {
  const rank = new Map(order.map((id, n) => [id, n]))
  const position = (item: Item) => rank.get(item.id) ?? order.length + catalog.indexOf(item)
  const section = (category: Category) =>
    catalog.filter((i) => i.category === category).sort((a, b) => position(a) - position(b))
  return { drink: section('drink'), snack: section('snack') }
}

const POPULARITY_WINDOW_MS = 90 * 86_400_000

/**
 * How many placed Rounds from the last 90 days each Item appears in, by source Item id (ADR-0002) so renamed Items
 * keep their score. Appearances, not quantities: one big Round doesn't outweigh a regular.
 */
export function popularity(history: PlacedRound[], now: Date): Record<string, number> {
  const since = now.getTime() - POPULARITY_WINDOW_MS
  const scores: Record<string, number> = {}
  for (const round of history) {
    if (new Date(round.placedAt).getTime() < since) continue
    for (const itemId of new Set(round.lines.map((line) => line.itemId))) scores[itemId] = (scores[itemId] ?? 0) + 1
  }
  return scores
}

/**
 * The Catalog's Item ids, most popular first, ties A–Z in the Operator's language, never-ordered Items last A–Z.
 * Computed at app start and after place / undo-place only, then held fixed for `gridSections`.
 */
export function popularityOrder(catalog: Catalog, history: PlacedRound[], locale: Locale, now: Date): string[] {
  const scores = popularity(history, now)
  const byName = new Intl.Collator(locale).compare
  const score = (item: Item) => scores[item.id] ?? 0
  return [...catalog].sort((a, b) => score(b) - score(a) || byName(a.name, b.name)).map((item) => item.id)
}
