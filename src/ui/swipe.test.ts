import { describe, expect, it } from 'vitest'
import { releaseVelocity, settle } from './swipe.ts'

const width = 400

describe('release velocity', () => {
  it('is the distance travelled over the last 100ms before release', () => {
    // 5px every 16ms, steadily: about 30px in the last 100ms
    const samples = Array.from({ length: 10 }, (_, i) => ({ x: -5 * i, t: 16 * i }))
    expect(releaseVelocity(samples)).toBeCloseTo(-5 / 16, 1)
  })

  it('ignores a pause before the flick: a hesitating finger still flicks', () => {
    const samples = [
      { x: 0, t: 0 }, // touch down, then rest for 400ms
      { x: -17, t: 410 },
      { x: -35, t: 420 },
      { x: -52, t: 430 },
      { x: -70, t: 440 },
    ]
    expect(settle({ page: 1, lastPage: 2, dx: -70, velocity: releaseVelocity(samples), width })).toBe(2)
  })

  it('still sees a flick when a busy phone merges the moves into one', () => {
    // Touch down, one coalesced move carrying the whole flick, then release at the same spot.
    const samples = [
      { x: 0, t: 0 },
      { x: -70, t: 214 },
      { x: -70, t: 216 },
    ]
    expect(settle({ page: 1, lastPage: 2, dx: -70, velocity: releaseVelocity(samples), width })).toBe(2)
  })

  it('a slow drag stays slow', () => {
    // 60px over 700ms
    const samples = Array.from({ length: 13 }, (_, i) => ({ x: -5 * i, t: (700 / 12) * i }))
    expect(Math.abs(releaseVelocity(samples))).toBeLessThan(0.2)
  })

  it('is zero when the finger never moved', () => {
    expect(releaseVelocity([{ x: 10, t: 0 }])).toBe(0)
    expect(releaseVelocity([])).toBe(0)
  })
})

describe('where a released swipe lands', () => {
  it('a fast flick changes page even when short', () => {
    expect(settle({ page: 1, lastPage: 2, dx: -70, velocity: -1.2, width })).toBe(2)
    expect(settle({ page: 1, lastPage: 2, dx: 70, velocity: 1.2, width })).toBe(0)
  })

  it('a slow drag needs a quarter of the width', () => {
    expect(settle({ page: 1, lastPage: 2, dx: -60, velocity: -0.1, width })).toBe(1)
    expect(settle({ page: 1, lastPage: 2, dx: -120, velocity: -0.1, width })).toBe(2)
  })

  it('never goes past the first or last page', () => {
    expect(settle({ page: 0, lastPage: 2, dx: 200, velocity: 2, width })).toBe(0)
    expect(settle({ page: 2, lastPage: 2, dx: -200, velocity: -2, width })).toBe(2)
  })
})
