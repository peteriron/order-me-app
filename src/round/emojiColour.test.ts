import { describe, expect, it } from 'vitest'
import { dominantColour } from './emojiColour.ts'

type Rgba = [r: number, g: number, b: number, a: number]

/** Pixel data as a canvas returns it: `n` pixels of each colour, RGBA in a row. */
function pixels(...runs: [colour: Rgba, n: number][]): Uint8ClampedArray {
  return Uint8ClampedArray.from(runs.flatMap(([colour, n]) => Array.from({ length: n }, () => colour).flat()))
}

const TRANSPARENT: Rgba = [0, 0, 0, 0]
const WHITE: Rgba = [250, 250, 250, 255]
const GREY: Rgba = [128, 128, 130, 255]
const BLACK: Rgba = [12, 10, 10, 255]
const BEER: Rgba = [230, 150, 30, 255]
const FOAM: Rgba = [245, 240, 230, 255]
const BLUE: Rgba = [40, 110, 220, 255]

describe('the main colour of an emoji', () => {
  it('is the colour most of its pixels have, ignoring the transparent background', () => {
    expect(dominantColour(pixels([TRANSPARENT, 500], [BEER, 300], [BLUE, 50]))).toBe('#e6961e')
  })

  it('ignores white, grey and black, even when they are most of the emoji', () => {
    // 🥛: mostly white glass, a little blue label.
    expect(dominantColour(pixels([WHITE, 400], [GREY, 100], [BLACK, 100], [BLUE, 20]))).toBe('#286edc')
    // 🍺: foam on top barely counts against the beer.
    expect(dominantColour(pixels([FOAM, 300], [BEER, 200]))).toBe('#e6961e')
  })

  it('averages the shades of the winning colour', () => {
    expect(dominantColour(pixels([[220, 140, 20, 255], 1], [[240, 160, 40, 255], 1]))).toBe('#e6961e')
  })

  it('is none when nothing in the emoji has colour, or nothing is drawn', () => {
    expect(dominantColour(pixels([WHITE, 100], [GREY, 100], [BLACK, 100]))).toBeNull()
    expect(dominantColour(pixels([TRANSPARENT, 100]))).toBeNull()
  })

  it('counts half-transparent edge pixels less than solid ones', () => {
    expect(dominantColour(pixels([[230, 150, 30, 60], 100], [BLUE, 40]))).toBe('#286edc')
  })
})
