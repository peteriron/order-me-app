import type { Locale } from '../shared/i18n.ts'
import type { Catalog, Item } from './catalog.ts'
import type { Group, Groups } from './groups.ts'

/** A name in every language the app speaks. */
export type Names = Readonly<Record<Locale, string>>

/** v5's two categories; only used to place Items saved or shared before groups existed (v6). */
export type LegacyCategory = 'drink' | 'snack'

interface StarterGroupRow {
  /** Stable forever: saved with the group and carried in share links. */
  key: string
  names: Names
}

interface StarterRow {
  /** Stable forever: saved with the Item and carried in share links. */
  key: string
  emoji: string
  /** The starter group it starts in (a StarterGroupRow key). */
  group: string
  names: Names
}

const names = (en: string, nl: string): Names => ({ en, nl })

const groupRow = (key: string, en: string, nl: string): StarterGroupRow => ({ key, names: names(en, nl) })

/** The starter groups, in the order a first launch shows them. */
export const STARTER_GROUPS: readonly StarterGroupRow[] = [
  groupRow('soda', 'Soda', 'Frisdrank'),
  groupRow('beer', 'Beer', 'Bier'),
  groupRow('hot', 'Hot', 'Warm'),
  groupRow('wine', 'Wine', 'Wijn'),
  groupRow('strong', 'Strong', 'Sterk'),
  groupRow('snacks', 'Snacks', 'Snacks'),
]

/** Not seeded: made when a v5 save or link brings drinks of the Operator's own (see `fromCategories`). */
export const OTHER_DRINKS: StarterGroupRow = groupRow('other-drinks', 'Other drinks', 'Andere dranken')

const row = (key: string, emoji: string, group: string, en: string, nl: string): StarterRow => ({
  key,
  emoji,
  group,
  names: names(en, nl),
})

/** The starter Catalog, group by group, in the order the grid starts with. */
export const STARTER: readonly StarterRow[] = [
  row('cola', '🥤', 'soda', 'Cola', 'Cola'),
  row('cola-zero', '🥤', 'soda', 'Cola Zero', 'Cola Zero'),
  row('still-water', '💧', 'soda', 'Still water', 'Water plat'),
  row('sparkling-water', '🫧', 'soda', 'Sparkling water', 'Water bruis'),
  row('fanta', '🍊', 'soda', 'Fanta', 'Fanta'),
  row('sprite', '🍋', 'soda', 'Sprite', 'Sprite'),
  row('ice-tea', '🧋', 'soda', 'Ice Tea', 'Ice Tea'),
  row('juice', '🧃', 'soda', 'Juice', 'Fruitsap'),
  row('gini', '🍋', 'soda', 'Gini', 'Gini'),
  row('tonissteiner', '🫧', 'soda', 'Tönissteiner', 'Tönissteiner'),
  row('lager', '🍺', 'beer', 'Lager', 'Pils'),
  row('lager-0', '🍺', 'beer', 'Lager 0.0', 'Pils 0,0'),
  row('duvel', '🍺', 'beer', 'Duvel', 'Duvel'),
  row('specialty-beer', '🍻', 'beer', 'Specialty beer', 'Speciaalbier'),
  row('coffee', '☕', 'hot', 'Coffee', 'Koffie'),
  row('decaf', '☕', 'hot', 'Decaf', 'Deca'),
  row('mint-tea', '🍵', 'hot', 'Mint tea', 'Muntthee'),
  row('white-wine', '🥂', 'wine', 'White wine', 'Witte wijn'),
  row('red-wine', '🍷', 'wine', 'Red wine', 'Rode wijn'),
  row('rose-wine', '🍷', 'wine', 'Rosé wine', 'Rosé wijn'),
  row('cava', '🍾', 'wine', 'Cava', 'Cava'),
  row('aperol-spritz', '🍊', 'strong', 'Aperol Spritz', 'Aperol Spritz'),
  row('gin-tonic', '🍸', 'strong', 'Gin & tonic', 'Gin-tonic'),
  row('mocktail', '🍹', 'strong', 'Mocktail', 'Mocktail'),
  row('chips', '🥔', 'snacks', 'Chips', 'Chips'),
  row('nuts', '🥜', 'snacks', 'Nuts', 'Nootjes'),
  row('cheese', '🧀', 'snacks', 'Cheese', 'Kaasblokjes'),
  row('bitterballen', '🧆', 'snacks', 'Dutch meatballs', 'Bitterballen'),
]

/**
 * Rows of the first starter list (before 2026-10-01) whose names differ from today's, so Items seeded from it
 * still follow the language. Only used to recognise existing Items, never to seed. Old rows with the same names as
 * today's (Cola, Duvel, Coffee…) are recognised as today's rows.
 */
const OLD_STARTER: readonly StarterRow[] = [
  row('beer', '🍺', 'beer', 'Beer', 'Bier'),
  row('beer-0', '🍺', 'beer', '0.0 Beer', '0.0 Bier'),
  row('still-water-v1', '💧', 'soda', 'Still water', 'Plat water'),
  row('sparkling-water-v1', '🫧', 'soda', 'Sparkling water', 'Bruiswater'),
  row('tea', '🍵', 'hot', 'Tea', 'Thee'),
  row('rose', '🍷', 'wine', 'Rosé', 'Rosé'),
  row('liquor', '🥃', 'strong', 'Liquor', 'Sterke drank'),
]

// Current rows first: an old Item named like a current row ("Still water") becomes that current row.
const KNOWN = [...STARTER, ...OLD_STARTER]
const BY_KEY = new Map(KNOWN.map((r) => [r.key, r]))
const GROUPS_BY_KEY = new Map([...STARTER_GROUPS, OTHER_DRINKS].map((g) => [g.key, g]))

/** The v5 category a starter row had: everything but the snacks was a drink. */
const categoryOf = (r: StarterRow): LegacyCategory => (r.group === 'snacks' ? 'snack' : 'drink')

/** The starter row for a key (current or old list), or undefined for a key this version doesn't know. */
export function starterRow(key: string): Readonly<StarterRow> | undefined {
  return BY_KEY.get(key)
}

/** The starter group row for a key, or undefined for a key this version doesn't know. */
export function starterGroupRow(key: string): Readonly<StarterGroupRow> | undefined {
  return GROUPS_BY_KEY.get(key)
}

/** True when `name` is one of `names`, in any language. */
const isOneOf = (row: { names: Names } | undefined, name: string) =>
  !!row && Object.values(row.names).includes(name)

/** True when `name` is what the starter row is called in any language. */
export function isStarterName(key: string, name: string): boolean {
  return isOneOf(BY_KEY.get(key), name)
}

/** True when `name` is what the starter group is called in any language. */
export function isStarterGroupName(key: string, name: string): boolean {
  return isOneOf(GROUPS_BY_KEY.get(key), name)
}

/** The Catalog as the Operator sees it: starter Items named in the app's language, everything else as saved. */
export function localizeCatalog(catalog: Catalog, locale: Locale): Catalog {
  return catalog.map((item) => {
    const name = item.starter && BY_KEY.get(item.starter)?.names[locale]
    return name && name !== item.name ? { ...item, name } : item
  })
}

/** The groups as the Operator sees them: starter groups named in the app's language, the rest as saved. */
export function localizeGroups(groups: Groups, locale: Locale): Groups {
  return groups.map((group): Group => {
    const name = group.starter && GROUPS_BY_KEY.get(group.starter)?.names[locale]
    return name && name !== group.name ? { ...group, name } : group
  })
}

/** An Item as v5 saved or shared it: a category instead of a group. */
export type LegacyItem = Omit<Item, 'group'> & { category: LegacyCategory }

/**
 * Marks Items that are starter Items but were saved before starter Items were marked: an exact name, in either
 * language, of a current or old starter row, in the same category. A changed name is the Operator's own.
 */
export function recognizeStarters(catalog: LegacyItem[]): LegacyItem[] {
  return catalog.map((item): LegacyItem => {
    if (item.starter) return item
    const match = KNOWN.find((r) => categoryOf(r) === item.category && isOneOf(r, item.name))
    return match ? { ...item, starter: match.key } : item
  })
}

/**
 * The starter group a v5 Item goes to: a starter Item to its own starter group, an Item the Operator added to
 * "Other drinks" if it was a drink, or Snacks if it was a snack.
 */
export function legacyGroupKey(item: { starter?: string; category: LegacyCategory }): string {
  const starter = item.starter ? BY_KEY.get(item.starter) : undefined
  if (starter && item.category === categoryOf(starter)) return starter.group
  return item.category === 'snack' ? 'snacks' : OTHER_DRINKS.key
}
