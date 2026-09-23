export type Locale = 'en' | 'nl'
export type Category = 'drink' | 'snack'

export interface Item {
  id: string
  name: string
  category: Category
  emoji: string
}

export type Catalog = Item[]

type SeedRow = [emoji: string, category: Category, en: string, nl: string]

const STARTER: SeedRow[] = [
  ['🍺', 'drink', 'Beer', 'Bier'],
  ['🍺', 'drink', 'Duvel', 'Duvel'],
  ['🍺', 'drink', '0.0 Beer', '0.0 Bier'],
  ['🥤', 'drink', 'Cola', 'Cola'],
  ['💧', 'drink', 'Still water', 'Plat water'],
  ['🫧', 'drink', 'Sparkling water', 'Bruiswater'],
  ['☕', 'drink', 'Coffee', 'Koffie'],
  ['☕', 'drink', 'Decaf', 'Deca'],
  ['🍵', 'drink', 'Tea', 'Thee'],
  ['🍊', 'drink', 'Fanta', 'Fanta'],
  ['🧋', 'drink', 'Ice Tea', 'Ice Tea'],
  ['🧃', 'drink', 'Juice', 'Fruitsap'],
  ['🥂', 'drink', 'Cava', 'Cava'],
  ['🥂', 'drink', 'White wine', 'Witte wijn'],
  ['🍷', 'drink', 'Rosé', 'Rosé'],
  ['🍷', 'drink', 'Red wine', 'Rode wijn'],
  ['🥃', 'drink', 'Liquor', 'Sterke drank'],
  ['🥔', 'snack', 'Chips', 'Chips'],
  ['🥜', 'snack', 'Nuts', 'Nootjes'],
  ['🧀', 'snack', 'Cheese', 'Kaasblokjes'],
  ['🧆', 'snack', 'Bitterballen', 'Bitterballen'],
]

/** The Catalog a first launch starts with, named in the device's language. */
export function seedCatalog(locale: Locale, newId: () => string): Catalog {
  return STARTER.map(([emoji, category, en, nl]) => ({
    id: newId(),
    name: locale === 'nl' ? nl : en,
    category,
    emoji,
  }))
}

/** The one Round being composed. Only Items with a count above zero are present. */
export interface ComposingRound {
  counts: Readonly<Record<string, number>>
}

export function emptyRound(): ComposingRound {
  return { counts: {} }
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

/** Empties the Round in one go. Deliberately no undo (see PRD). */
export function clear(_round: ComposingRound): ComposingRound {
  return emptyRound()
}

export function countOf(round: ComposingRound, itemId: string): number {
  return round.counts[itemId] ?? 0
}

export function totalOf(round: ComposingRound): number {
  return Object.values(round.counts).reduce((sum, n) => sum + n, 0)
}

export type GridSections = Record<Category, Item[]>

/** The Catalog as the Items page lists it: Drinks then Snacks, each A–Z in the Operator's language. */
export function catalogSections(catalog: Catalog, locale: Locale): GridSections {
  const byName = new Intl.Collator(locale).compare
  const section = (category: Category) =>
    catalog.filter((i) => i.category === category).sort((a, b) => byName(a.name, b.name))
  return { drink: section('drink'), snack: section('snack') }
}

/** Tile order for the Round page. A–Z for now; Popularity ordering arrives with #7. */
export function gridSections(catalog: Catalog, locale: Locale): GridSections {
  return catalogSections(catalog, locale)
}

export interface RoundLine {
  item: Item
  count: number
}

/** The composing Round as lines, in the same order as the grid: Drinks, then Snacks. */
export function roundLines(round: ComposingRound, sections: GridSections): RoundLine[] {
  return [...sections.drink, ...sections.snack]
    .map((item) => ({ item, count: countOf(round, item.id) }))
    .filter((line) => line.count > 0)
}

/** One line of a placed Round: a frozen copy of the Item as it was (ADR-0001) plus its id, for Popularity only (ADR-0002). */
export interface PlacedLine {
  itemId: string
  name: string
  category: Category
  emoji: string
  count: number
}

export interface PlacedRound {
  id: string
  /** ISO 8601 timestamp. */
  placedAt: string
  lines: PlacedLine[]
}

export interface RoundAndHistory {
  round: ComposingRound
  /** Newest first. */
  history: PlacedRound[]
}

/**
 * Places the composing Round: it joins history as an immutable snapshot and composing starts afresh.
 * Returns an `undo` that takes it back out and restores exactly what was being composed.
 */
export function markOrdered(
  state: RoundAndHistory,
  sections: GridSections,
  meta: { id: string; placedAt: string },
): { next: RoundAndHistory; undo: (current: RoundAndHistory) => RoundAndHistory } {
  const placed: PlacedRound = {
    ...meta,
    lines: roundLines(state.round, sections).map(({ item, count }) => ({
      itemId: item.id,
      name: item.name,
      category: item.category,
      emoji: item.emoji,
      count,
    })),
  }
  const previous = state.round
  return {
    next: { round: emptyRound(), history: [placed, ...state.history] },
    undo: (current) => ({ round: previous, history: current.history.filter((r) => r.id !== placed.id) }),
  }
}

export interface HistoryDay {
  /** 0 for today, 1 for yesterday, … counted in local calendar days. */
  daysAgo: number
  /** Local midnight at the start of that day. */
  day: Date
  rounds: PlacedRound[]
}

const startOfLocalDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())

/** Placed Rounds grouped by the local calendar day they were placed on, newest first. */
export function groupByDay(history: PlacedRound[], now: Date): HistoryDay[] {
  const today = startOfLocalDay(now).getTime()
  const groups: HistoryDay[] = []
  for (const round of history) {
    const day = startOfLocalDay(new Date(round.placedAt))
    // Rounding absorbs the 23- or 25-hour days around daylight-saving changes.
    const daysAgo = Math.round((today - day.getTime()) / 86_400_000)
    const last = groups.at(-1)
    if (last?.daysAgo === daysAgo) last.rounds.push(round)
    else groups.push({ daysAgo, day, rounds: [round] })
  }
  return groups
}

export function placedTotal(round: PlacedRound): number {
  return round.lines.reduce((sum, line) => sum + line.count, 0)
}

export function deletePlacedRound(history: PlacedRound[], roundId: string): PlacedRound[] {
  return history.filter((r) => r.id !== roundId)
}

/**
 * A fresh composing Round copied from a placed one ("same as last time"). Lines are matched to the Catalog by
 * source Item id (ADR-0002), so renamed Items still count; lines whose Item was deleted are skipped.
 */
export function orderAgain(placed: PlacedRound, catalog: Catalog): { round: ComposingRound; skipped: number } {
  const inCatalog = new Set(catalog.map((i) => i.id))
  const counts: Record<string, number> = {}
  let skipped = 0
  for (const line of placed.lines) {
    if (inCatalog.has(line.itemId)) counts[line.itemId] = line.count
    else skipped++
  }
  return { round: { counts }, skipped }
}

/** What the Operator fills in when adding or editing an Item. */
export interface ItemDraft {
  name: string
  category: Category
  emoji: string
}

export type DraftProblem = 'nameRequired' | 'emojiRequired'

/** Tidies a draft (trimmed name, a single emoji) or says what is missing. */
export function checkDraft(draft: ItemDraft): { ok: true; value: ItemDraft } | { ok: false; problem: DraftProblem } {
  const name = draft.name.trim().replace(/\s+/g, ' ')
  if (!name) return { ok: false, problem: 'nameRequired' }
  // First grapheme, so multi-part emoji such as 👩‍🍳 survive intact.
  const [first] = new Intl.Segmenter().segment(draft.emoji.trim())
  if (!first) return { ok: false, problem: 'emojiRequired' }
  return { ok: true, value: { name, category: draft.category, emoji: first.segment } }
}

export function addToCatalog(catalog: Catalog, draft: ItemDraft, id: string): Catalog {
  return [...catalog, { id, ...draft }]
}

/** Changes an Item's name, category or emoji. Its id, and so its count in the composing Round, stays the same. */
export function editItem(catalog: Catalog, itemId: string, draft: ItemDraft): Catalog {
  return catalog.map((item) => (item.id === itemId ? { id: itemId, ...draft } : item))
}

/** Removes an Item from the Catalog and from the Round being composed. Placed Rounds keep their snapshot (ADR-0001). */
export function deleteItem(
  state: { catalog: Catalog; round: ComposingRound },
  itemId: string,
): { catalog: Catalog; round: ComposingRound } {
  const { [itemId]: _removed, ...counts } = state.round.counts
  return { catalog: state.catalog.filter((i) => i.id !== itemId), round: { counts } }
}
