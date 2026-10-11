import { emptyRound, type ComposingRound } from '../round/round.ts'
import { checkDraft, type Catalog, type Item } from './catalog.ts'
import { addGroup, fromCategories, type Group, type Groups } from './groups.ts'
import type { Pins } from './pins.ts'
import { fragmentLink, MAX_LINK_ITEMS, pack, unpack } from '../shared/shareLink.ts'
import { starterGroupRow, starterRow, type LegacyCategory, type LegacyItem } from './starter.ts'

/**
 * A Shared Catalog travels in the app's own link, after `#items=`, so it never reaches a server. Only what the groups
 * and Items look like goes along: no ids, colours, History, Round, settings or pins.
 *
 * Format v3 (app v6, with groups): the text "3", then for each group, in order, a group line followed by its Items'
 * lines.
 * - A group line: `g`, a tab, then the group (see `groupRef`): `*` and its starter key for a starter group (it
 *   arrives as one and follows the friend's language), otherwise `-` and its name.
 * - An Item line: for a starter Item, `*` and its starter key (starter.ts), and when its emoji was changed a tab and
 *   the emoji; for any other Item, the emoji, a tab and the name. Names can't hold tabs or newlines (checkDraft
 *   collapses whitespace).
 * The text is packed by shareLink.ts: the starter Catalog makes a link of a few hundred bytes, a QR code that scans
 * easily. A v5 phone can't read format v3. Formats v1 (names only) and v2 (v5's categories, `d`/`s` before the
 * emoji) are still read: their Items are put in groups as an update from v5 would (fromCategories).
 */
const FRAGMENT = '#items='
const VERSION = '3'
const CATEGORIES: Record<string, LegacyCategory> = { d: 'drink', s: 'snack' }
const MAX_NAME = 60
/** The Item sheet's limit for a typed emoji (in UTF-16 units): one emoji, even a multi-part one, fits. */
const MAX_EMOJI = 16
/** Far beyond any real Catalog, so a crafted link can't flood the app with boxes. */
const MAX_LINK_GROUPS = 50

/** An Item as it arrives from a shared link: what it looks like, and whether it's a starter Item. */
export interface SharedItem {
  name: string
  emoji: string
  starter?: string
}

/** A group as a shared link names it: a starter group by its key (its name then in English), or by its name. */
export interface GroupRef {
  name: string
  starter?: string
}

/** A group as it arrives in a Shared Catalog: its name or starter key, and its Items in order. */
export interface SharedGroup extends GroupRef {
  items: SharedItem[]
}

export async function encodeCatalog(catalog: Catalog, groups: Groups): Promise<string> {
  const lines = groups.flatMap((group) => [
    `g\t${groupRef(group)}`,
    ...catalog.filter((item) => item.group === group.id).map(itemLine),
  ])
  return pack([VERSION, ...lines].join('\n'))
}

/** How a link names a group: `*soda` for an unrenamed starter group, `-Name` for any other. */
export function groupRef(group: Pick<Group, 'name' | 'starter'>): string {
  return group.starter && starterGroupRow(group.starter) ? `*${group.starter}` : `-${group.name}`
}

/** Reads a group as `groupRef` wrote it, or null when it isn't valid. */
export function parseGroupRef(text: string): GroupRef | null {
  if (text.startsWith('*')) {
    const row = starterGroupRow(text.slice(1))
    return row ? { name: row.names.en, starter: row.key } : null
  }
  if (!text.startsWith('-')) return null
  const name = tidyName(text.slice(1))
  return name ? { name } : null
}

/** One Item as a line of a shared link (format v3, see above). The Round link (sharedRound.ts) uses it too. */
export function itemLine(item: Item): string {
  const row = item.starter ? starterRow(item.starter) : undefined
  if (!row) return `${item.emoji}\t${item.name}`
  return item.emoji === row.emoji ? `*${row.key}` : `*${row.key}\t${item.emoji}`
}

/** Reads an Item line of format v3. Null when anything is invalid. */
export function parseItemLine(line: string): SharedItem | null {
  // A starter key is lower-case letters; a plain line can start with the *️⃣ emoji.
  if (/^\*[a-z]/.test(line)) {
    const [key = '', emoji] = line.slice(1).split('\t')
    const row = starterRow(key)
    if (!row) return null
    const item = checkedItem({ name: row.names.en, emoji: emoji ?? row.emoji })
    return item && { ...item, starter: row.key }
  }
  const tab = line.indexOf('\t')
  return tab > 0 ? checkedItem({ name: line.slice(tab + 1), emoji: line.slice(0, tab) }) : null
}

/** An Item as a v5 link carried it, with a category; `starterMarks` is false for format v1, which had none. */
export function parseLegacyItemLine(line: string, starterMarks = true): Omit<LegacyItem, 'id'> | null {
  return line.startsWith('*') ? (starterMarks ? legacyStarterLine(line.slice(1)) : null) : legacyPlainLine(line)
}

/**
 * The groups and Items in a shared link, or null when it can't be read in full: a link is used whole or not at all.
 */
export async function decodeCatalog(payload: string): Promise<SharedGroup[] | null> {
  try {
    const [version, ...lines] = (await unpack(payload)).split('\n')
    if (lines.length === 0) return null
    if (version === VERSION) return decodeGroups(lines)
    if (version === '1' || version === '2') return decodeLegacy(lines, version === '2')
    return null
  } catch {
    return null
  }
}

function decodeGroups(lines: string[]): SharedGroup[] | null {
  const groups: SharedGroup[] = []
  let items = 0
  for (const line of lines) {
    if (line.startsWith('g\t')) {
      const ref = parseGroupRef(line.slice(2))
      if (!ref || groups.length >= MAX_LINK_GROUPS) return null
      groups.push({ ...ref, items: [] })
      continue
    }
    const item = parseItemLine(line)
    const group = groups.at(-1)
    if (!item || !group || ++items > MAX_LINK_ITEMS) return null
    group.items.push(item)
  }
  return groups.length > 0 ? groups : null
}

/** A v5 link (formats v1 and v2): its Items put in groups as an update from v5 would. */
function decodeLegacy(lines: string[], starterMarks: boolean): SharedGroup[] | null {
  if (lines.length > MAX_LINK_ITEMS) return null
  const legacy: LegacyItem[] = []
  for (const line of lines) {
    const item = parseLegacyItemLine(line, starterMarks)
    if (!item) return null
    legacy.push({ ...item, id: String(legacy.length) })
  }
  let n = 0
  const { catalog, groups } = fromCategories(legacy, 'en', () => `g${n++}`)
  return groups.map((group) => ({
    name: group.name,
    ...(group.starter ? { starter: group.starter } : {}),
    items: catalog
      .filter((i) => i.group === group.id)
      .map(({ name, emoji, starter }) => ({ name, emoji, ...(starter ? { starter } : {}) })),
  }))
}

/** `d🍺<tab>Duvel`: category, emoji, name. Null when any part is missing or invalid. */
function legacyPlainLine(line: string): Omit<LegacyItem, 'id'> | null {
  const tab = line.indexOf('\t')
  const category = CATEGORIES[line[0] ?? '']
  if (!category || tab < 0) return null
  const item = checkedItem({ name: line.slice(tab + 1), emoji: line.slice(1, tab) })
  return item && { ...item, category }
}

/** `duvel`, or `duvel<tab>s🧊` when its category or emoji was changed. Null for an unknown starter key. */
function legacyStarterLine(text: string): Omit<LegacyItem, 'id'> | null {
  const [key = '', looks] = text.split('\t')
  const row = starterRow(key)
  if (!row) return null
  const category = looks === undefined ? (row.group === 'snacks' ? 'snack' : 'drink') : CATEGORIES[looks[0] ?? '']
  if (!category) return null
  const item = checkedItem({ name: row.names.en, emoji: looks === undefined ? row.emoji : looks.slice(1) })
  return item && { ...item, category, starter: row.key }
}

/** A name as the app would save it (trimmed, single spaces, not too long), or null when it isn't one already. */
function tidyName(name: string): string | null {
  const tidy = name.trim().replace(/\s+/g, ' ')
  return tidy && tidy === name && tidy.length <= MAX_NAME ? tidy : null
}

function checkedItem(draft: { name: string; emoji: string }): SharedItem | null {
  const checked = checkDraft({ ...draft, group: '' })
  // The emoji must be exactly one, not merely start with one; the name must already be tidy.
  if (!checked.ok || checked.value.emoji !== draft.emoji || checked.value.name !== draft.name) return null
  const { name, emoji } = checked.value
  return name.length <= MAX_NAME && emoji.length <= MAX_EMOJI ? { name, emoji } : null
}

/** How many Items a Shared Catalog brings. */
export function sharedItemCount(groups: SharedGroup[]): number {
  return groups.reduce((n, g) => n + g.items.length, 0)
}

/** The app's address with the Shared Catalog in its fragment. */
export function shareLink(appUrl: string, payload: string): string {
  return fragmentLink(appUrl, FRAGMENT, payload)
}

/** The encoded Catalog in an address fragment, or null when the fragment isn't a shared link. */
export function sharedPayload(hash: string): string | null {
  return hash.startsWith(FRAGMENT) ? hash.slice(FRAGMENT.length) : null
}

/**
 * The state after accepting a Shared Catalog: its groups, in its order and with colours picked afresh, and its
 * Items with fresh ids; an empty Round (its counts pointed at the old Items) and no pins. History isn't touched:
 * placed Rounds keep their snapshots (ADR-0001).
 */
export function replaceCatalog(
  shared: SharedGroup[],
  newId: () => string,
): { catalog: Catalog; groups: Groups; round: ComposingRound; pins: Pins } {
  let groups: Groups = []
  const catalog: Catalog = []
  for (const { name, starter, items } of shared) {
    groups = addGroup(groups, name, newId(), starter)
    const group = groups.at(-1)!.id
    for (const item of items) catalog.push({ id: newId(), ...item, group })
  }
  return { catalog, groups, round: emptyRound(), pins: [] }
}
