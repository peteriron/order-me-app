import { emptyRound, type ComposingRound } from '../round/round.ts'
import { checkDraft, type Catalog, type Category, type Item, type ItemDraft } from './catalog.ts'
import type { Pins } from './pins.ts'
import { starterRow } from './starter.ts'

/**
 * A Shared Catalog travels in the app's own link, after `#items=`, so it never reaches a server. Only what each Item
 * looks like goes along: no ids, History, Round, settings or pins.
 *
 * Format v2: the text "2", then one line per Item.
 * - A starter Item: `*` and its starter key (starter.ts), so it arrives as a starter Item and follows the friend's
 *   language. If its category or emoji was changed: a tab, then `d`/`s` and the emoji.
 * - Any other Item: `d` or `s` (drink or snack), the emoji, a tab, the name. Names can't hold tabs or newlines
 *   (checkDraft collapses whitespace).
 * The text is deflated and written as base64url: the 28-Item starter Catalog makes a link of under 300 bytes, a QR
 * code that scans easily. Format v1 (names only, the first version) is still read.
 */
const FRAGMENT = '#items='
const VERSION = '2'
const CATEGORY_CODES = { drink: 'd', snack: 's' } as const
const CATEGORIES: Record<string, Category> = { d: 'drink', s: 'snack' }
/** Far beyond any real Catalog; guards against a crafted link that inflates into something huge. */
const MAX_TEXT_BYTES = 64 * 1024
/** Limits on what a link may bring, far beyond any real Catalog or Round, so a crafted link can't flood the app. */
export const MAX_LINK_ITEMS = 200
const MAX_NAME = 60
/** The Item sheet's limit for a typed emoji (in UTF-16 units): one emoji, even a multi-part one, fits. */
const MAX_EMOJI = 16

/** An Item as it arrives from a shared link: what it looks like, and whether it's a starter Item. */
export type SharedItem = ItemDraft & { starter?: string }

export async function encodeCatalog(catalog: Catalog): Promise<string> {
  return pack([VERSION, ...catalog.map(itemLine)].join('\n'))
}

/** One Item as a line of a shared link (format v2, see above). The Round link (sharedRound.ts) uses it too. */
export function itemLine(item: Item): string {
  const looks = `${CATEGORY_CODES[item.category]}${item.emoji}`
  const row = item.starter ? starterRow(item.starter) : undefined
  if (!row) return `${looks}\t${item.name}`
  const changed = item.category !== row.category || item.emoji !== row.emoji
  return changed ? `*${row.key}\t${looks}` : `*${row.key}`
}

/** Reads an Item line; `starterMarks` is false for format v1, which had none. Null when anything is invalid. */
export function parseItemLine(line: string, starterMarks = true): SharedItem | null {
  return line.startsWith('*') ? (starterMarks ? starterLine(line.slice(1)) : null) : plainLine(line)
}

/** Deflates and base64url-encodes a link's text. */
export async function pack(text: string): Promise<string> {
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream('deflate-raw'))
  return toBase64Url(new Uint8Array(await new Response(stream).arrayBuffer()))
}

/** The text of a link payload. Throws when it isn't valid base64url, deflate or UTF-8, or inflates too large. */
export async function unpack(payload: string): Promise<string> {
  return inflate(fromBase64Url(payload))
}

/** The Items in a shared link, or null when it can't be read in full: a link is used whole or not at all. */
export async function decodeCatalog(payload: string): Promise<SharedItem[] | null> {
  try {
    const text = await unpack(payload)
    const [version, ...lines] = text.split('\n')
    if ((version !== '1' && version !== VERSION) || lines.length === 0 || lines.length > MAX_LINK_ITEMS) return null
    const items: SharedItem[] = []
    for (const line of lines) {
      const item = parseItemLine(line, version === VERSION)
      if (!item) return null
      items.push(item)
    }
    return items
  } catch {
    return null
  }
}

/** `d🍺<tab>Duvel`: category, emoji, name. Null when any part is missing or invalid. */
function plainLine(line: string): SharedItem | null {
  const tab = line.indexOf('\t')
  const category = CATEGORIES[line[0] ?? '']
  if (!category || tab < 0) return null
  return checkedItem({ name: line.slice(tab + 1), category, emoji: line.slice(1, tab) })
}

/** `duvel`, or `duvel<tab>s🧊` when its category or emoji was changed. Null for an unknown starter key. */
function starterLine(text: string): SharedItem | null {
  const [key = '', looks] = text.split('\t')
  const row = starterRow(key)
  if (!row) return null
  const category = looks === undefined ? row.category : CATEGORIES[looks[0] ?? '']
  if (!category) return null
  const item = checkedItem({ name: row.en, category, emoji: looks === undefined ? row.emoji : looks.slice(1) })
  return item && { ...item, starter: row.key }
}

function checkedItem(draft: ItemDraft): SharedItem | null {
  const checked = checkDraft(draft)
  // The emoji must be exactly one, not merely start with one; the name must already be tidy.
  if (!checked.ok || checked.value.emoji !== draft.emoji) return null
  return checked.value.name.length <= MAX_NAME && checked.value.emoji.length <= MAX_EMOJI ? checked.value : null
}

/** The app's address with the Shared Catalog in its fragment. */
export function shareLink(appUrl: string, payload: string): string {
  return fragmentLink(appUrl, FRAGMENT, payload)
}

/** The encoded Catalog in an address fragment, or null when the fragment isn't a shared link. */
export function sharedPayload(hash: string): string | null {
  return hash.startsWith(FRAGMENT) ? hash.slice(FRAGMENT.length) : null
}

/** The app's address with `fragment` and `payload` after it, replacing any fragment it had. */
export function fragmentLink(appUrl: string, fragment: string, payload: string): string {
  const url = new URL(appUrl)
  url.hash = ''
  return `${url.href.replace(/#$/, '')}${fragment}${payload}`
}

/**
 * The state after accepting a Shared Catalog: its Items with fresh ids, an empty Round (its counts pointed at the
 * old Items) and no pins. History isn't touched: placed Rounds keep their snapshots (ADR-0001).
 */
export function replaceCatalog(
  items: SharedItem[],
  newId: () => string,
): { catalog: Catalog; round: ComposingRound; pins: Pins } {
  return { catalog: items.map((draft) => ({ id: newId(), ...draft })), round: emptyRound(), pins: [] }
}

async function inflate(bytes: Uint8Array): Promise<string> {
  const reader = new Blob([bytes as BlobPart]).stream().pipeThrough(new DecompressionStream('deflate-raw')).getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.length
    if (size > MAX_TEXT_BYTES) {
      await reader.cancel()
      throw new Error('Shared link too large')
    }
    chunks.push(value)
  }
  // fatal: a cut-off multi-byte character is an error, not a replacement character.
  return new TextDecoder('utf-8', { fatal: true }).decode(await new Blob(chunks as BlobPart[]).arrayBuffer())
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(text: string): Uint8Array {
  if (!/^[\w-]+$/.test(text)) throw new Error('Not base64url')
  const binary = atob(text.replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(binary, (c) => c.charCodeAt(0))
}
