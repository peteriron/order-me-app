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
