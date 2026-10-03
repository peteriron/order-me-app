import type { Catalog, Item } from '../items/catalog.ts'
import type { Pins } from '../items/pins.ts'
import { fragmentLink, itemLine, pack, parseItemLine, unpack, type SharedItem } from '../items/sharedCatalog.ts'
import { starterRow } from '../items/starter.ts'
import type { ComposingRound, RoundLine } from '../round/round.ts'
import type { ShowOrder } from './showOrder.ts'

/**
 * A shared Round travels in the app's own link, after `#round=`, so it never reaches a server: a one-time hand-over
 * of the Round as the sender's Show tab lists it, not a live sync.
 *
 * Format v1: the text "1", then one line per Round line, in the sender's Show order: the count, a tab, then the
 * Item as an Item line of the Items link (sharedCatalog.ts: a starter mark, or category, emoji and name). Packed the
 * same way as the Items link.
 */
const FRAGMENT = '#round='
const VERSION = '1'
/** Far beyond any real Round; a bigger count is a broken or crafted link. */
const MAX_COUNT = 999

export interface SharedLine {
  item: SharedItem
  count: number
}

export async function encodeRound(lines: RoundLine[]): Promise<string> {
  return pack([VERSION, ...lines.map(({ item, count }) => `${count}\t${itemLine(item)}`)].join('\n'))
}

/** The lines of a shared Round, or null when the link can't be read in full: used whole or not at all. */
export async function decodeRound(payload: string): Promise<SharedLine[] | null> {
  try {
    const [version, ...rows] = (await unpack(payload)).split('\n')
    if (version !== VERSION || rows.length === 0) return null
    const lines: SharedLine[] = []
    for (const row of rows) {
      const tab = row.indexOf('\t')
      const count = Number(row.slice(0, tab))
      const item = tab > 0 ? parseItemLine(row.slice(tab + 1)) : null
      if (!item || !Number.isInteger(count) || count < 1 || count > MAX_COUNT) return null
      lines.push({ item, count })
    }
    return lines
  } catch {
    return null
  }
}

/** The app's address with the shared Round in its fragment. */
export function roundLink(appUrl: string, payload: string): string {
  return fragmentLink(appUrl, FRAGMENT, payload)
}

/** The encoded Round in an address fragment, or null when the fragment isn't a shared Round. */
export function roundPayload(hash: string): string | null {
  return hash.startsWith(FRAGMENT) ? hash.slice(FRAGMENT.length) : null
}

type Receiving = { catalog: Catalog; round: ComposingRound; pins: Pins; showOrder: ShowOrder }

/**
 * Takes in a shared Round: each line is matched to one of the receiver's Items (a starter Item by its mark, any Item
 * by name and category, ignoring case, in either language for starter Items), drinks the receiver doesn't have are
 * added to their Catalog, unpinned, and the shared Round replaces theirs. The sender's line order becomes their Show
 * order (#49). Nothing of theirs is removed or renamed; History and pins aren't touched. `undo` brings back their
 * Round and Show order and removes the added Items.
 */
export function receiveRound(
  state: Receiving,
  lines: SharedLine[],
  newId: () => string,
): { next: Pick<Receiving, 'catalog' | 'round' | 'showOrder'>; undo: (current: Receiving) => Partial<Receiving> } {
  const catalog = [...state.catalog]
  const added = new Set<string>()
  const counts: Record<string, number> = {}
  /** The sender's line order, once per Item. */
  const order: string[] = []
  for (const { item, count } of lines) {
    let match = findMatch(catalog, item)
    if (!match) {
      match = { id: newId(), ...item }
      catalog.push(match)
      added.add(match.id)
    }
    if (!(match.id in counts)) order.push(match.id)
    counts[match.id] = (counts[match.id] ?? 0) + count
  }
  const previous = { round: state.round, showOrder: state.showOrder }
  return {
    next: { catalog, round: { counts }, showOrder: order },
    undo: (current) => ({
      ...previous,
      catalog: current.catalog.filter((i) => !added.has(i.id)),
      pins: current.pins.filter((id) => !added.has(id)),
    }),
  }
}

function findMatch(catalog: Catalog, shared: SharedItem): Item | undefined {
  if (shared.starter) {
    const same = catalog.find((i) => i.starter === shared.starter)
    if (same) return same
  }
  const wanted = namesOf(shared)
  return catalog.find((i) => i.category === shared.category && [...namesOf(i)].some((name) => wanted.has(name)))
}

/** An Item's names to match on, lower-cased: its own, and for a starter Item both its English and Dutch name. */
function namesOf(item: SharedItem): Set<string> {
  const row = item.starter ? starterRow(item.starter) : undefined
  return new Set([item.name, row?.en, row?.nl].filter((n) => n !== undefined).map((n) => n.toLocaleLowerCase()))
}
