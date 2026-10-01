import { emptyRound, type ComposingRound } from '../round/round.ts'
import { checkDraft, type Catalog, type ItemDraft } from './catalog.ts'
import type { Pins } from './pins.ts'

/**
 * A Shared Catalog travels in the app's own link, after `#items=`, so it never reaches a server. Only each Item's
 * name, category and emoji go along: no ids, History, Round, settings or pins.
 *
 * Format: the text "1" (format version), then one line per Item: `d` or `s` (drink or snack), the emoji, a tab,
 * the name. Names can't hold tabs or newlines (checkDraft collapses whitespace). The text is deflated and written as
 * base64url, which keeps the 21-Item starter Catalog under 450 bytes of link: a QR code that scans easily.
 */
const FRAGMENT = '#items='
const VERSION = '1'
const CATEGORY_CODES = { drink: 'd', snack: 's' } as const
/** Far beyond any real Catalog; guards against a crafted link that inflates into something huge. */
const MAX_TEXT_BYTES = 64 * 1024

export async function encodeCatalog(catalog: Catalog): Promise<string> {
  const lines = catalog.map((item) => `${CATEGORY_CODES[item.category]}${item.emoji}\t${item.name}`)
  const stream = new Blob([[VERSION, ...lines].join('\n')]).stream().pipeThrough(new CompressionStream('deflate-raw'))
  return toBase64Url(new Uint8Array(await new Response(stream).arrayBuffer()))
}

/** The Items in a shared link, or null when it can't be read in full: a link is used whole or not at all. */
export async function decodeCatalog(payload: string): Promise<ItemDraft[] | null> {
  try {
    const text = await inflate(fromBase64Url(payload))
    const [version, ...lines] = text.split('\n')
    if (version !== VERSION || lines.length === 0) return null
    const items: ItemDraft[] = []
    for (const line of lines) {
      const category = line[0] === 'd' ? 'drink' : line[0] === 's' ? 'snack' : null
      const tab = line.indexOf('\t')
      if (!category || tab < 0) return null
      const emoji = line.slice(1, tab)
      const checked = checkDraft({ name: line.slice(tab + 1), category, emoji })
      // The emoji must be exactly one, not merely start with one.
      if (!checked.ok || checked.value.emoji !== emoji) return null
      items.push(checked.value)
    }
    return items
  } catch {
    return null
  }
}

/** The app's address with the Shared Catalog in its fragment. */
export function shareLink(appUrl: string, payload: string): string {
  const url = new URL(appUrl)
  url.hash = ''
  return `${url.href.replace(/#$/, '')}${FRAGMENT}${payload}`
}

/** The encoded Catalog in an address fragment, or null when the fragment isn't a shared link. */
export function sharedPayload(hash: string): string | null {
  return hash.startsWith(FRAGMENT) ? hash.slice(FRAGMENT.length) : null
}

/**
 * The state after accepting a Shared Catalog: its Items with fresh ids, an empty Round (its counts pointed at the
 * old Items) and no pins. History isn't touched: placed Rounds keep their snapshots (ADR-0001).
 */
export function replaceCatalog(
  items: ItemDraft[],
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
      throw new Error('Shared Catalog too large')
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
