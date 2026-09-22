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

/** Tile order for the Round page: Drinks then Snacks, each A–Z in the Operator's language. */
export function gridSections(catalog: Catalog, locale: Locale): GridSections {
  const byName = new Intl.Collator(locale).compare
  const section = (category: Category) =>
    catalog.filter((i) => i.category === category).sort((a, b) => byName(a.name, b.name))
  return { drink: section('drink'), snack: section('snack') }
}
