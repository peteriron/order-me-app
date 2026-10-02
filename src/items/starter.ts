import type { Locale } from '../shared/i18n.ts'
import type { Catalog, Category, Item } from './catalog.ts'

interface StarterRow {
  /** Stable forever: saved with the Item and carried in share links. */
  key: string
  emoji: string
  category: Category
  en: string
  nl: string
}

const row = (key: string, emoji: string, category: Category, en: string, nl: string): StarterRow => ({
  key,
  emoji,
  category,
  en,
  nl,
})

/** The starter Catalog, in the order the grid starts with: soft drinks, beer, hot drinks, wine, mixed drinks, snacks. */
export const STARTER: readonly StarterRow[] = [
  row('cola', '🥤', 'drink', 'Cola', 'Cola'),
  row('cola-zero', '🥤', 'drink', 'Cola Zero', 'Cola Zero'),
  row('still-water', '💧', 'drink', 'Still water', 'Water plat'),
  row('sparkling-water', '🫧', 'drink', 'Sparkling water', 'Water bruis'),
  row('fanta', '🍊', 'drink', 'Fanta', 'Fanta'),
  row('sprite', '🍋', 'drink', 'Sprite', 'Sprite'),
  row('ice-tea', '🧋', 'drink', 'Ice Tea', 'Ice Tea'),
  row('juice', '🧃', 'drink', 'Juice', 'Fruitsap'),
  row('gini', '🍋', 'drink', 'Gini', 'Gini'),
  row('tonissteiner', '🫧', 'drink', 'Tönissteiner', 'Tönissteiner'),
  row('lager', '🍺', 'drink', 'Lager', 'Pils'),
  row('lager-0', '🍺', 'drink', 'Lager 0.0', 'Pils 0,0'),
  row('duvel', '🍺', 'drink', 'Duvel', 'Duvel'),
  row('specialty-beer', '🍻', 'drink', 'Specialty beer', 'Speciaalbier'),
  row('coffee', '☕', 'drink', 'Coffee', 'Koffie'),
  row('decaf', '☕', 'drink', 'Decaf', 'Deca'),
  row('mint-tea', '🍵', 'drink', 'Mint tea', 'Muntthee'),
  row('white-wine', '🥂', 'drink', 'White wine', 'Witte wijn'),
  row('red-wine', '🍷', 'drink', 'Red wine', 'Rode wijn'),
  row('rose-wine', '🍷', 'drink', 'Rosé wine', 'Rosé wijn'),
  row('aperol-spritz', '🍊', 'drink', 'Aperol Spritz', 'Aperol Spritz'),
  row('cava', '🍾', 'drink', 'Cava', 'Cava'),
  row('gin-tonic', '🍸', 'drink', 'Gin & tonic', 'Gin-tonic'),
  row('mocktail', '🍹', 'drink', 'Mocktail', 'Mocktail'),
  row('chips', '🥔', 'snack', 'Chips', 'Chips'),
  row('nuts', '🥜', 'snack', 'Nuts', 'Nootjes'),
  row('cheese', '🧀', 'snack', 'Cheese', 'Kaasblokjes'),
  row('bitterballen', '🧆', 'snack', 'Bitterballen', 'Bitterballen'),
]

/**
 * Rows of the first starter list (before 2026-10-01) whose names differ from today's, so Items seeded from it
 * still follow the language. Only used to recognise existing Items, never to seed. Old rows with the same names as
 * today's (Cola, Duvel, Coffee…) are recognised as today's rows.
 */
const OLD_STARTER: readonly StarterRow[] = [
  row('beer', '🍺', 'drink', 'Beer', 'Bier'),
  row('beer-0', '🍺', 'drink', '0.0 Beer', '0.0 Bier'),
  row('still-water-v1', '💧', 'drink', 'Still water', 'Plat water'),
  row('sparkling-water-v1', '🫧', 'drink', 'Sparkling water', 'Bruiswater'),
  row('tea', '🍵', 'drink', 'Tea', 'Thee'),
  row('rose', '🍷', 'drink', 'Rosé', 'Rosé'),
  row('liquor', '🥃', 'drink', 'Liquor', 'Sterke drank'),
]

// Current rows first: an old Item named like a current row ("Still water") becomes that current row.
const KNOWN = [...STARTER, ...OLD_STARTER]
const BY_KEY = new Map(KNOWN.map((r) => [r.key, r]))

/** The starter row's name in a language, or undefined for a key this version doesn't know. */
export function starterName(key: string, locale: Locale): string | undefined {
  return BY_KEY.get(key)?.[locale]
}

/** True when `name` is what the starter row is called in either language. */
export function isStarterName(key: string, name: string): boolean {
  const known = BY_KEY.get(key)
  return !!known && (known.en === name || known.nl === name)
}

/** The Catalog as the Operator sees it: starter Items named in the app's language, everything else as saved. */
export function localizeCatalog(catalog: Catalog, locale: Locale): Catalog {
  return catalog.map((item) => {
    const name = item.starter && starterName(item.starter, locale)
    return name && name !== item.name ? { ...item, name } : item
  })
}

/**
 * Marks Items that are starter Items but were saved before starter Items were marked: an exact name, in either
 * language, of a current or old starter row, in the same category. A changed name is the Operator's own.
 */
export function recognizeStarters(catalog: Catalog): Catalog {
  return catalog.map((item): Item => {
    if (item.starter) return item
    const match = KNOWN.find((r) => r.category === item.category && (r.en === item.name || r.nl === item.name))
    return match ? { ...item, starter: match.key } : item
  })
}
