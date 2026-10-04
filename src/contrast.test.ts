import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/**
 * WCAG AA for both themes, read straight from the tokens in styles.css so a palette tweak can't quietly
 * break legibility. 4.5:1 for text, 3:1 for non-text marks (the snack dot).
 */
const css = readFileSync(new URL('./styles.css', import.meta.url), 'utf8')

function tokens(selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`)
  if (start < 0) throw new Error(`No token block for ${selector}`)
  const block = css.slice(start, css.indexOf('}', start))
  return Object.fromEntries([...block.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})/gi)].map(([, name, hex]) => [name, hex]))
}

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

const TEXT = 4.5
const MARK = 3
const pairs: [foreground: string, background: string, minimum: number][] = [
  ['text', 'bg', TEXT],
  ['text', 'surface', TEXT],
  ['text', 'surface-2', TEXT],
  ['text-muted', 'bg', TEXT],
  ['text-muted', 'surface', TEXT],
  ['text-muted', 'surface-2', TEXT],
  ['accent', 'bg', TEXT],
  ['accent', 'surface', TEXT],
  ['on-accent', 'accent-fill', TEXT],
  ['danger', 'surface', TEXT],
  ['on-danger', 'danger', TEXT],
  ['snack', 'bg', MARK],
]

/** `--name: rgb(r g b / a)` from a token block, laid over an opaque background: the colour the eye actually sees. */
function blended(selector: string, name: string, over: string): string {
  const start = css.indexOf(`${selector} {`)
  const block = css.slice(start, css.indexOf('}', start))
  const match = block.match(new RegExp(`--${name}:\\s*rgb\\((\\d+) (\\d+) (\\d+) / ([\\d.]+)\\)`))
  if (!match) throw new Error(`No rgb() token --${name} in ${selector}`)
  const [r, g, b, alpha] = match.slice(1).map(Number)
  const base = [1, 3, 5].map((i) => parseInt(over.slice(i, i + 2), 16))
  return `#${[r, g, b].map((c, i) => Math.round(c * alpha + base[i] * (1 - alpha)).toString(16).padStart(2, '0')).join('')}`
}

describe.each([
  ['dark', ':root'],
  ['light', ":root[data-theme='light']"],
])('%s theme: the active tab', (_theme, selector) => {
  const palette = { ...tokens(':root'), ...tokens(selector) }
  // The tab bar sits on --surface; the active tab tints it with --accent-soft and labels it in --accent.
  it('labels the active tab in --accent on --accent-soft over --surface, at 4.5:1', () => {
    const tint = blended(selector, 'accent-soft', palette.surface)
    expect(contrast(palette.accent, tint)).toBeGreaterThanOrEqual(TEXT)
  })
})

describe.each([
  ['dark', ':root'],
  ['light', ":root[data-theme='light']"],
])('%s theme', (_theme, selector) => {
  const palette = { ...tokens(':root'), ...tokens(selector) }
  it.each(pairs)('%s on %s meets %s:1', (fg, bg, minimum) => {
    expect(contrast(palette[fg], palette[bg])).toBeGreaterThanOrEqual(minimum)
  })
})

/** `--name: 12%` from a token block: how much of the emoji's colour a coloured tile mixes in (#83). */
function percent(selector: string, name: string): number {
  const start = css.indexOf(`${selector} {`)
  const block = css.slice(start, css.indexOf('}', start))
  const match = block.match(new RegExp(`--${name}:\\s*([\\d.]+)%`))
  if (!match) throw new Error(`No percentage token --${name} in ${selector}`)
  return Number(match[1]) / 100
}

/** `color-mix(in srgb, colour p, surface)`, as CSS draws the top of a coloured tile. */
function mix(colour: number[], surface: string, p: number): string {
  const base = [1, 3, 5].map((i) => parseInt(surface.slice(i, i + 2), 16))
  return `#${colour.map((c, i) => Math.round(c * p + base[i] * (1 - p)).toString(16).padStart(2, '0')).join('')}`
}

/** Every colour an emoji could have, in steps of 51 per channel: 216 colours, black to white. */
const anyColour = [0, 51, 102, 153, 204, 255].flatMap((r) =>
  [0, 51, 102, 153, 204, 255].flatMap((g) => [0, 51, 102, 153, 204, 255].map((b) => [r, g, b])),
)

describe.each([
  ['dark', ':root'],
  ['light', ":root[data-theme='light']"],
])('%s theme: coloured tiles', (_theme, selector) => {
  const palette = { ...tokens(':root'), ...tokens(selector) }
  it('keeps the tile name at 4.5:1 on the strongest tint, whatever the emoji colour', () => {
    const strongest = percent(selector, 'tint-counted')
    const worst = Math.min(...anyColour.map((c) => contrast(palette.text, mix(c, palette.surface, strongest))))
    expect(worst).toBeGreaterThanOrEqual(TEXT)
  })

  it('tints a counted tile more than a resting one', () => {
    expect(percent(selector, 'tint-counted')).toBeGreaterThan(percent(selector, 'tint-rest'))
  })
})
