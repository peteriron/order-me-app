import { describe, expect, it } from 'vitest'
import { decodeRound } from '../show/sharedRound.ts'
import { MAX_PAYLOAD_LENGTH, MAX_TEXT_BYTES, pack, unpack } from './shareLink.ts'

/**
 * The size caps are the anti-zip-bomb defence: `unpack` refuses an oversized payload before `atob` allocates it, and
 * stops inflation as soon as more than 64 KB has come out (shareLink.ts). These tests pin both boundaries with the
 * real compression streams, not mocks.
 */

/** Deflates raw bytes and base64url-encodes them, the way `pack` does for text: for payloads that aren't valid UTF-8. */
async function packBytes(bytes: Uint8Array): Promise<string> {
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(new CompressionStream('deflate-raw'))
  const deflated = new Uint8Array(await new Response(stream).arrayBuffer())
  let binary = ''
  for (const byte of deflated) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

describe('packing share-link payloads', () => {
  it('round-trips text, including emoji and line breaks', async () => {
    const text = '2\nd🍺\tDuvel\n2\n999\t*cola\nremark with\nline breaks ✓'
    expect(await unpack(await pack(text))).toBe(text)
  })

  it('accepts exactly the inflated limit and refuses one byte more', async () => {
    expect(await unpack(await pack('x'.repeat(MAX_TEXT_BYTES)))).toHaveLength(MAX_TEXT_BYTES)
    await expect(pack('x'.repeat(MAX_TEXT_BYTES + 1)).then(unpack)).rejects.toThrow('too large')
  })

  it('counts the inflated limit in bytes, not characters', async () => {
    // 32,768 two-byte characters are exactly 64 KB when inflated; one more character goes over.
    const twoByte = 'é'.repeat(MAX_TEXT_BYTES / 2)
    expect(await unpack(await pack(twoByte))).toBe(twoByte)
    await expect(pack(twoByte + 'é').then(unpack)).rejects.toThrow('too large')
  })

  it('refuses an encoded payload over the length cap before inflating it', async () => {
    await expect(unpack('A'.repeat(MAX_PAYLOAD_LENGTH + 1))).rejects.toThrow('too large')
  })

  it('refuses anything that is not base64url, valid deflate or valid UTF-8', async () => {
    await expect(unpack('not base64!')).rejects.toThrow('Not base64url')
    await expect(unpack('bm90IGRlZmxhdGU')).rejects.toThrow() // valid base64url, not a deflate stream
    // A lone lead byte of a multi-byte character: the fatal decoder must reject it, not repair it to U+FFFD.
    await expect(unpack(await packBytes(new Uint8Array([0xc3])))).rejects.toThrow()
  })

  it('a decoder refuses an oversized payload as a whole, without applying any of it', async () => {
    expect(await decodeRound('A'.repeat(MAX_PAYLOAD_LENGTH + 1))).toBeNull()
  })
})
