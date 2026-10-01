import type { ComposingRound } from '../round/round.ts'
import type { Locale } from '../shared/i18n.ts'
import { pinnedFirst, type Pins } from './pins.ts'

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

export type Sections = Record<Category, Item[]>

/** The Catalog as the Items page lists it: Drinks then Snacks, each with its Pinned Items first, then A–Z. */
export function catalogSections(catalog: Catalog, locale: Locale, pins: Pins = []): Sections {
  const byName = new Intl.Collator(locale).compare
  const section = (category: Category) =>
    pinnedFirst(
      catalog.filter((i) => i.category === category).sort((a, b) => byName(a.name, b.name)),
      pins,
    )
  return { drink: section('drink'), snack: section('snack') }
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

/**
 * Removes an Item from the Catalog, from the Round being composed and from the pins. Placed Rounds keep their
 * snapshot (ADR-0001).
 */
export function deleteItem(
  state: { catalog: Catalog; round: ComposingRound; pins: Pins },
  itemId: string,
): { catalog: Catalog; round: ComposingRound; pins: Pins } {
  const { [itemId]: _removed, ...counts } = state.round.counts
  return {
    catalog: state.catalog.filter((i) => i.id !== itemId),
    round: { counts },
    pins: state.pins.filter((id) => id !== itemId),
  }
}
