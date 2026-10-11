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

/** A name in each language, in the order en, nl, fr, de, it, es. */
type Six = readonly [en: string, nl: string, fr: string, de: string, it: string, es: string]

const names = ([en, nl, fr, de, it, es]: Six): Names => ({ en, nl, fr, de, it, es })

/** A brand name: the same in every language. */
const same = (name: string): Six => [name, name, name, name, name, name]

const groupRow = (key: string, six: Six): StarterGroupRow => ({ key, names: names(six) })

/** The starter groups, in the order a first launch shows them. */
export const STARTER_GROUPS: readonly StarterGroupRow[] = [
  groupRow('soda', ['Soda', 'Frisdrank', 'Sodas', 'Softdrinks', 'Bibite', 'Refrescos']),
  groupRow('beer', ['Beer', 'Bier', 'Bières', 'Bier', 'Birre', 'Cervezas']),
  groupRow('hot', ['Hot', 'Warm', 'Chaud', 'Heiß', 'Caldo', 'Caliente']),
  groupRow('wine', ['Wine', 'Wijn', 'Vin', 'Wein', 'Vino', 'Vino']),
  groupRow('strong', ['Strong', 'Sterk', 'Fort', 'Stark', 'Forte', 'Fuerte']),
  groupRow('snacks', ['Snacks', 'Snacks', 'Snacks', 'Snacks', 'Snack', 'Picoteo']),
]

/** Not seeded: made when a v5 save or link brings drinks of the Operator's own (see `fromCategories`). */
export const OTHER_DRINKS: StarterGroupRow = groupRow('other-drinks', [
  'Other drinks',
  'Andere dranken',
  'Autres boissons',
  'Andere Getränke',
  'Altre bevande',
  'Otras bebidas',
])

const row = (key: string, emoji: string, group: string, six: Six): StarterRow => ({
  key,
  emoji,
  group,
  names: names(six),
})

/** The starter Catalog, group by group, in the order the grid starts with. */
export const STARTER: readonly StarterRow[] = [
  row('cola', '🥤', 'soda', same('Cola')),
  row('cola-zero', '🥤', 'soda', same('Cola Zero')),
  row('still-water', '💧', 'soda', ['Still water', 'Water plat', 'Eau plate', 'Stilles Wasser', 'Acqua naturale', 'Agua sin gas']),
  row('sparkling-water', '🫧', 'soda', ['Sparkling water', 'Water bruis', 'Eau pétillante', 'Sprudel', 'Acqua frizzante', 'Agua con gas']),
  row('fanta', '🍊', 'soda', same('Fanta')),
  row('sprite', '🍋', 'soda', same('Sprite')),
  row('ice-tea', '🧋', 'soda', same('Ice Tea')),
  row('juice', '🧃', 'soda', ['Juice', 'Fruitsap', 'Jus de fruits', 'Saft', 'Succo di frutta', 'Zumo']),
  row('gini', '🍋', 'soda', same('Gini')),
  row('tonissteiner', '🫧', 'soda', same('Tönissteiner')),
  row('lager', '🍺', 'beer', ['Lager', 'Pils', 'Pils', 'Pils', 'Birra chiara', 'Cerveza rubia']),
  row('lager-0', '🍺', 'beer', ['Lager 0.0', 'Pils 0,0', 'Pils 0,0', 'Pils 0,0', 'Birra 0,0', 'Cerveza 0,0']),
  row('duvel', '🍺', 'beer', same('Duvel')),
  row('specialty-beer', '🍻', 'beer', ['Specialty beer', 'Speciaalbier', 'Bière spéciale', 'Spezialbier', 'Birra speciale', 'Cerveza especial']),
  row('coffee', '☕', 'hot', ['Coffee', 'Koffie', 'Café', 'Kaffee', 'Caffè', 'Café']),
  row('decaf', '☕', 'hot', ['Decaf', 'Deca', 'Déca', 'Entkoffeiniert', 'Decaffeinato', 'Descafeinado']),
  row('mint-tea', '🍵', 'hot', ['Mint tea', 'Muntthee', 'Thé à la menthe', 'Minztee', 'Tè alla menta', 'Té de menta']),
  row('white-wine', '🥂', 'wine', ['White wine', 'Witte wijn', 'Vin blanc', 'Weißwein', 'Vino bianco', 'Vino blanco']),
  row('red-wine', '🍷', 'wine', ['Red wine', 'Rode wijn', 'Vin rouge', 'Rotwein', 'Vino rosso', 'Vino tinto']),
  row('rose-wine', '🍷', 'wine', ['Rosé wine', 'Rosé wijn', 'Vin rosé', 'Roséwein', 'Vino rosato', 'Vino rosado']),
  row('cava', '🍾', 'wine', same('Cava')),
  row('aperol-spritz', '🍊', 'strong', same('Aperol Spritz')),
  row('gin-tonic', '🍸', 'strong', ['Gin & tonic', 'Gin-tonic', 'Gin tonic', 'Gin Tonic', 'Gin tonic', 'Gin-tonic']),
  row('mocktail', '🍹', 'strong', same('Mocktail')),
  row('chips', '🥔', 'snacks', ['Chips', 'Chips', 'Chips', 'Chips', 'Patatine', 'Patatas fritas']),
  row('nuts', '🥜', 'snacks', ['Nuts', 'Nootjes', 'Noix', 'Nüsse', 'Frutta secca', 'Frutos secos']),
  row('cheese', '🧀', 'snacks', ['Cheese', 'Kaasblokjes', 'Fromage', 'Käsewürfel', 'Formaggio', 'Queso']),
  row('bitterballen', '🧆', 'snacks', ['Dutch meatballs', 'Bitterballen', 'Bitterballen', 'Bitterballen', 'Polpette olandesi', 'Croquetas holandesas']),
]

/**
 * Rows of the first starter list (before 2026-10-01) whose names differ from today's, so Items seeded from it
 * still follow the language. Only used to recognise existing Items, never to seed. Old rows with the same names as
 * today's (Cola, Duvel, Coffee…) are recognised as today's rows.
 */
const OLD_STARTER: readonly StarterRow[] = [
  row('beer', '🍺', 'beer', ['Beer', 'Bier', 'Bière', 'Bier', 'Birra', 'Cerveza']),
  row('beer-0', '🍺', 'beer', ['0.0 Beer', '0.0 Bier', 'Bière 0.0', 'Bier 0.0', 'Birra 0.0', 'Cerveza 0.0']),
  row('still-water-v1', '💧', 'soda', ['Still water', 'Plat water', 'Eau plate', 'Stilles Wasser', 'Acqua naturale', 'Agua sin gas']),
  row('sparkling-water-v1', '🫧', 'soda', ['Sparkling water', 'Bruiswater', 'Eau pétillante', 'Sprudel', 'Acqua frizzante', 'Agua con gas']),
  row('tea', '🍵', 'hot', ['Tea', 'Thee', 'Thé', 'Tee', 'Tè', 'Té']),
  row('rose', '🍷', 'wine', ['Rosé', 'Rosé', 'Rosé', 'Rosé', 'Rosato', 'Rosado']),
  row('liquor', '🥃', 'strong', ['Liquor', 'Sterke drank', 'Alcool fort', 'Spirituosen', 'Superalcolici', 'Licores']),
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
 * Marks Items that are starter Items but were saved before starter Items were marked: an exact name, in any
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
