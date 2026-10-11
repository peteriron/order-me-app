import type { ComposingRound } from '../round/round.ts'
import type { Locale } from '../shared/i18n.ts'
import { seedGroups, starterGroup, type Group, type Groups } from './groups.ts'
import { pinnedFirst, type Pins } from './pins.ts'
import { isStarterName, STARTER } from './starter.ts'

export interface Item {
  id: string
  name: string
  /** The id of the group it's in (groups.ts). */
  group: string
  emoji: string
  /**
   * Set on starter Items: which starter row this is (see starter.ts). Its name then follows the app's language
   * (localizeCatalog) until the Operator renames it.
   */
  starter?: string
}

export type Catalog = Item[]

/**
 * The Catalog and groups a first launch starts with, named in the device's language. Each Item and group remembers
 * its starter row.
 */
export function seedCatalog(locale: Locale, newId: () => string): { catalog: Catalog; groups: Groups } {
  const groups = seedGroups(locale, newId)
  const catalog = STARTER.map((row) => ({
    id: newId(),
    name: row.names[locale],
    group: starterGroup(groups, row.group)!.id,
    emoji: row.emoji,
    starter: row.key,
  }))
  return { catalog, groups }
}

/** One box: a group and its Items, in the order they're shown. */
export interface Section {
  group: Group
  items: Item[]
}

/** The boxes, in group order. */
export type Sections = Section[]

/** `catalog` split into one section per group, in group order, each section's Items ordered by `order`. */
export function sectionsOf(groups: Groups, catalog: Catalog, order: (items: Item[]) => Item[]): Sections {
  return groups.map((group) => ({ group, items: order(catalog.filter((i) => i.group === group.id)) }))
}

/** Every Item in `sections`, box by box. */
export function itemsOf(sections: Sections): Item[] {
  return sections.flatMap((s) => s.items)
}

/**
 * The Catalog as the Items page lists it: group by group, each with its Pinned Items first, then the rest in
 * Catalog order (the starter list's order, then Items as they were added).
 */
export function catalogSections(catalog: Catalog, groups: Groups, pins: Pins = []): Sections {
  return sectionsOf(groups, catalog, (items) => pinnedFirst(items, pins))
}

/** What the Operator fills in when adding or editing an Item. */
export interface ItemDraft {
  name: string
  /** A group id. */
  group: string
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
  return { ok: true, value: { name, group: draft.group, emoji: first.segment } }
}

export function addToCatalog(catalog: Catalog, draft: ItemDraft, id: string): Catalog {
  return [...catalog, { id, ...draft }]
}

/**
 * Changes an Item's name, group or emoji. Its id, and so its count in the composing Round, stays the same. A
 * starter Item stays one unless renamed: saving the name the sheet showed (in either language) isn't a rename.
 */
export function editItem(catalog: Catalog, itemId: string, draft: ItemDraft): Catalog {
  return catalog.map((item) => {
    if (item.id !== itemId) return item
    const starter = item.starter && isStarterName(item.starter, draft.name) ? item.starter : undefined
    return starter ? { id: itemId, ...draft, starter } : { id: itemId, ...draft }
  })
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
    // Only the count goes: the Round's table and remark stay.
    round: { ...state.round, counts },
    pins: state.pins.filter((id) => id !== itemId),
  }
}

type Deletable = { catalog: Catalog; round: ComposingRound; pins: Pins; showOrder: string[] }

/** `id` put back at `index` in `ids` (clamped), unless it's there already. */
function reinsert(ids: string[], id: string, index: number): string[] {
  if (index < 0 || ids.includes(id)) return ids
  return [...ids.slice(0, index), id, ...ids.slice(index)]
}

/**
 * Deletes an Item at once (Catalog, composing Round, pins and Show order; History keeps its snapshots, ADR-0001),
 * and returns `undo`, which puts it back exactly where it was: its Catalog place, pin position, Round count and
 * Show order position. Anything else changed in between is kept.
 */
export function deleteWithUndo(state: Deletable, itemId: string): { next: Deletable; undo: (current: Deletable) => Partial<Deletable> } {
  const index = state.catalog.findIndex((i) => i.id === itemId)
  const item = state.catalog[index]
  const count = state.round.counts[itemId]
  const pinAt = state.pins.indexOf(itemId)
  const showAt = state.showOrder.indexOf(itemId)
  const next = { ...deleteItem(state, itemId), showOrder: state.showOrder.filter((id) => id !== itemId) }
  return {
    next,
    undo: (current) => {
      if (!item || current.catalog.some((i) => i.id === itemId)) return {}
      return {
        catalog: [...current.catalog.slice(0, index), item, ...current.catalog.slice(index)],
        round: count ? { ...current.round, counts: { ...current.round.counts, [itemId]: count } } : current.round,
        pins: reinsert(current.pins, itemId, pinAt),
        showOrder: reinsert(current.showOrder, itemId, showAt),
      }
    },
  }
}
