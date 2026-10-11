import type { Catalog, Item } from '../items/catalog.ts'
import { addGroup, type Group, type Groups } from '../items/groups.ts'
import type { Pins } from '../items/pins.ts'
import {
  groupRef,
  itemLine,
  parseGroupRef,
  parseItemLine,
  parseLegacyItemLine,
  type GroupRef,
  type SharedItem,
} from '../items/sharedCatalog.ts'
import { isStarterGroupName, legacyGroupKey, starterGroupRow, starterRow } from '../items/starter.ts'
import { noteOf, type ComposingRound, type RoundLine, type RoundNote } from '../round/round.ts'
import { fragmentLink, MAX_LINK_ITEMS, pack, unpack } from '../shared/shareLink.ts'
import type { ShowOrder } from './showOrder.ts'

/**
 * A shared Round travels in the app's own link, after `#round=`, so it never reaches a server: a one-time hand-over
 * of the Round as the sender's Show tab lists it, not a live sync.
 *
 * Format v3 (app v6): the text "3"; then the table and remark when set, as `t` or `r`, a tab and the text as a JSON
 * string (so line breaks and quotes survive); then one line per Round line, in the sender's Show order: the count, a
 * tab, the Item's group as the Items link names it (`*soda` or `-Name`), a tab, then the Item as an Item line of the
 * Items link (sharedCatalog.ts: a starter mark, or emoji and name). Packed by shared/shareLink.ts, like the Items
 * link. Formats v1 (no table or remark) and v2 (v5's categories instead of groups) are still read.
 */
const FRAGMENT = '#round='
const VERSION = '3'
/** Longest table and remark taken from a link: the Show page's own limits. */
const MAX_NOTE = { t: 10, r: 200 } as const
/** Far beyond any real Round; a bigger count is a broken or crafted link. */
const MAX_COUNT = 999

export interface SharedLine {
  item: SharedItem
  /** The sender's group, for an Item the receiver has to add. */
  group: GroupRef
  count: number
}

/** A Round as it arrives from a link: its lines in the sender's order, and its table and remark if any. */
export interface SharedRound extends RoundNote {
  lines: SharedLine[]
}

/** `groups` are the sender's, so each line can say which group its Item is in. */
export async function encodeRound(lines: RoundLine[], groups: Groups, note: RoundNote = {}): Promise<string> {
  const groupOf = new Map(groups.map((g) => [g.id, g]))
  const { table, remark } = noteOf(note)
  return pack(
    [
      VERSION,
      ...(table ? [`t\t${JSON.stringify(table)}`] : []),
      ...(remark ? [`r\t${JSON.stringify(remark)}`] : []),
      ...lines.map(({ item, count }) => `${count}\t${groupRef(groupOf.get(item.group) ?? { name: '?' })}\t${itemLine(item)}`),
    ].join('\n'),
  )
}

/** A shared Round, or null when the link can't be read in full: used whole or not at all. */
export async function decodeRound(payload: string): Promise<SharedRound | null> {
  try {
    const [version, ...rows] = (await unpack(payload)).split('\n')
    if ((version !== '1' && version !== '2' && version !== VERSION) || rows.length === 0) return null
    const lines: SharedLine[] = []
    const note: RoundNote = {}
    for (const row of rows) {
      const field = version !== '1' && (row.startsWith('t\t') || row.startsWith('r\t')) ? (row[0] as 't' | 'r') : null
      if (field) {
        const text: unknown = JSON.parse(row.slice(2))
        if (typeof text !== 'string' || text.length > MAX_NOTE[field] || lines.length > 0) return null
        note[field === 't' ? 'table' : 'remark'] = text
        continue
      }
      const tab = row.indexOf('\t')
      const count = Number(row.slice(0, tab))
      const line = tab > 0 ? parseLine(row.slice(tab + 1), version!) : null
      if (!line || !Number.isInteger(count) || count < 1 || count > MAX_COUNT || lines.length >= MAX_LINK_ITEMS) return null
      lines.push({ ...line, count })
    }
    return lines.length > 0 ? { lines, ...noteOf(note) } : null
  } catch {
    return null
  }
}

/** A Round line after its count: the group and the Item (v3), or a v5 Item line put in a group as v5 Items are. */
function parseLine(text: string, version: string): Omit<SharedLine, 'count'> | null {
  if (version !== VERSION) {
    // Round links had starter marks from their first version.
    const legacy = parseLegacyItemLine(text)
    if (!legacy) return null
    const { category: _category, ...item } = legacy
    const key = legacyGroupKey(legacy)
    return { item, group: { name: starterGroupRow(key)!.names.en, starter: key } }
  }
  const tab = text.indexOf('\t')
  const group = tab > 0 ? parseGroupRef(text.slice(0, tab)) : null
  const item = group ? parseItemLine(text.slice(tab + 1)) : null
  return group && item ? { item, group } : null
}

/** The app's address with the shared Round in its fragment. */
export function roundLink(appUrl: string, payload: string): string {
  return fragmentLink(appUrl, FRAGMENT, payload)
}

/** The encoded Round in an address fragment, or null when the fragment isn't a shared Round. */
export function roundPayload(hash: string): string | null {
  return hash.startsWith(FRAGMENT) ? hash.slice(FRAGMENT.length) : null
}

type Receiving = { catalog: Catalog; groups: Groups; round: ComposingRound; pins: Pins; showOrder: ShowOrder }

/**
 * Takes in a shared Round: each line is matched to one of the receiver's Items (a starter Item by its mark, any Item
 * by name, ignoring case, in any language for starter Items). Drinks the receiver doesn't have are added to their
 * Catalog, unpinned, in the matching group (a starter group by its mark, any group by name); a group they don't have
 * is added last. The shared Round replaces theirs. The sender's line order becomes their Show order (#49), and its
 * table and remark replace theirs. Nothing of theirs is removed or renamed; History and pins aren't touched. `undo`
 * brings back their Round and Show order and removes the added Items and groups.
 */
export function receiveRound(
  state: Receiving,
  { lines, ...note }: SharedRound,
  newId: () => string,
): {
  next: Pick<Receiving, 'catalog' | 'groups' | 'round' | 'showOrder'>
  undo: (current: Receiving) => Partial<Receiving>
} {
  const catalog = [...state.catalog]
  let groups = state.groups
  const added = new Set<string>()
  const addedGroups = new Set<string>()
  const groupFor = (ref: GroupRef): Group => {
    let group = findGroup(groups, ref)
    if (!group) {
      groups = addGroup(groups, ref.name, newId(), ref.starter)
      group = groups.at(-1)!
      addedGroups.add(group.id)
    }
    return group
  }
  const counts: Record<string, number> = {}
  /** The sender's line order, once per Item. */
  const order: string[] = []
  for (const { item, group, count } of lines) {
    let match = findMatch(catalog, item)
    if (!match) {
      match = { id: newId(), ...item, group: groupFor(group).id }
      catalog.push(match)
      added.add(match.id)
    }
    if (!(match.id in counts)) order.push(match.id)
    counts[match.id] = (counts[match.id] ?? 0) + count
  }
  const previous = { round: state.round, showOrder: state.showOrder }
  return {
    next: { catalog, groups, round: { counts, ...noteOf(note) }, showOrder: order },
    undo: (current) => ({
      ...previous,
      catalog: current.catalog.filter((i) => !added.has(i.id)),
      groups: current.groups.filter((g) => !addedGroups.has(g.id)),
      pins: current.pins.filter((id) => !added.has(id)),
    }),
  }
}

function findMatch(catalog: Catalog, shared: SharedItem): Item | undefined {
  if (shared.starter) {
    const same = catalog.find((i) => i.starter === shared.starter)
    if (same) return same
  }
  const wanted = namesOf(shared.name, shared.starter ? starterRow(shared.starter)?.names : undefined)
  return catalog.find((i) =>
    [...namesOf(i.name, i.starter ? starterRow(i.starter)?.names : undefined)].some((name) => wanted.has(name)),
  )
}

/** The receiver's group for a group named in a link: a starter group by its mark, otherwise by name (any case). */
function findGroup(groups: Groups, ref: GroupRef): Group | undefined {
  if (ref.starter) {
    const same = groups.find((g) => g.starter === ref.starter)
    if (same) return same
  }
  const wanted = ref.name.toLocaleLowerCase()
  return groups.find(
    (g) => g.name.toLocaleLowerCase() === wanted || (ref.starter !== undefined && isStarterGroupName(ref.starter, g.name)),
  )
}

/** Names to match on, lower-cased: its own, and for a starter row its name in every language. */
function namesOf(name: string, starterNames: Readonly<Record<string, string>> | undefined): Set<string> {
  return new Set([name, ...Object.values(starterNames ?? {})].map((n) => n.toLocaleLowerCase()))
}
