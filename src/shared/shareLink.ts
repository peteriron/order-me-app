/**
 * Packing for the app's share links (the Items link in items/sharedCatalog.ts, the Round link in show/sharedRound.ts):
 * text is deflated and written as base64url after a fragment such as `#items=`, so it never reaches a server. A link
 * is untrusted input; unpack refuses anything that isn't valid or inflates too large.
 */

/** Far beyond any real Catalog; guards against a crafted link that inflates into something huge. */
export const MAX_TEXT_BYTES = 64 * 1024
/** The encoded payload before inflation: base64 of deflate that could inflate to MAX_TEXT_BYTES fits well within this. */
export const MAX_PAYLOAD_LENGTH = 96 * 1024
/** Limits on what a link may bring, far beyond any real Catalog or Round, so a crafted link can't flood the app. */
export const MAX_LINK_ITEMS = 200

/** Deflates and base64url-encodes a link's text. */
export async function pack(text: string): Promise<string> {
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream('deflate-raw'))
  return toBase64Url(new Uint8Array(await new Response(stream).arrayBuffer()))
}

/** The text of a link payload. Throws when it isn't valid base64url, deflate or UTF-8, or inflates too large. */
export async function unpack(payload: string): Promise<string> {
  // 64 KB inflated is the real limit; base64 of a deflate stream that could reach it stays well under 96 KB.
  // Refuse a bigger payload before atob() allocates it.
  if (payload.length > MAX_PAYLOAD_LENGTH) throw new Error('Shared link too large')
  return inflate(fromBase64Url(payload))
}

/** The app's address with `fragment` and `payload` after it, replacing any fragment it had. */
export function fragmentLink(appUrl: string, fragment: string, payload: string): string {
  const url = new URL(appUrl)
  url.hash = ''
  return `${url.href.replace(/#$/, '')}${fragment}${payload}`
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
