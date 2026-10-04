/**
 * The main colour of an Item's emoji, for its tile's gradient (#83). Measured on the phone, by drawing the emoji
 * with the phone's own emoji font, so it matches what the Operator sees; remembered per emoji until the app restarts.
 */

/** Below this spread between an RGB pixel's strongest and weakest channel it counts as white, grey or black. */
const MIN_CHROMA = 48
/** Hue buckets: pixels in the same twelfth of the colour wheel count as one colour. */
const HUES = 12

/**
 * The main colour in RGBA pixel data (as a canvas returns it), as `#rrggbb`: the hue most pixels have, averaged over
 * those pixels. White, grey, black and transparent pixels don't count; half-transparent ones count partly. Null when
 * nothing has colour.
 */
export function dominantColour(data: Uint8ClampedArray): string | null {
  const buckets = Array.from({ length: HUES }, () => ({ weight: 0, r: 0, g: 0, b: 0 }))
  for (let i = 0; i + 3 < data.length; i += 4) {
    const [r, g, b, a] = [data[i]!, data[i + 1]!, data[i + 2]!, data[i + 3]!]
    const max = Math.max(r, g, b)
    const chroma = max - Math.min(r, g, b)
    if (a === 0 || chroma < MIN_CHROMA) continue
    const bucket = buckets[Math.floor((hue(r, g, b, max, chroma) / 360) * HUES) % HUES]!
    const weight = a / 255
    bucket.weight += weight
    bucket.r += r * weight
    bucket.g += g * weight
    bucket.b += b * weight
  }
  const main = buckets.reduce((best, bucket) => (bucket.weight > best.weight ? bucket : best))
  if (main.weight === 0) return null
  return `#${[main.r, main.g, main.b].map((c) => Math.round(c / main.weight).toString(16).padStart(2, '0')).join('')}`
}

/** Hue in degrees, 0–360. */
function hue(r: number, g: number, b: number, max: number, chroma: number): number {
  const h = max === r ? ((g - b) / chroma) % 6 : max === g ? (b - r) / chroma + 2 : (r - g) / chroma + 4
  return (h * 60 + 360) % 360
}

const SIZE = 40
const EMOJI_FONT = `32px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`
const measured = new Map<string, string | null>()
let context: CanvasRenderingContext2D | null | undefined

/** The emoji's main colour on this phone, or null (no colour, or no canvas). Measured once per emoji. */
export function emojiColour(emoji: string): string | null {
  const known = measured.get(emoji)
  if (known !== undefined) return known
  context ??= document.createElement('canvas').getContext('2d', { willReadFrequently: true })
  let colour: string | null = null
  if (context) {
    context.canvas.width = context.canvas.height = SIZE
    context.font = EMOJI_FONT
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.fillText(emoji, SIZE / 2, SIZE / 2)
    colour = dominantColour(context.getImageData(0, 0, SIZE, SIZE).data)
  }
  measured.set(emoji, colour)
  return colour
}
