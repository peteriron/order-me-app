/** Pixels a finger may drift before we decide whether a gesture is a swipe, a scroll or a tap. */
export const DECIDE_AFTER_PX = 10
/** How much more horizontal than vertical a movement must be to count as a page swipe. */
export const HORIZONTAL_BIAS = 1.4
/** Share of the page width a slow drag must travel to change page. */
export const DISTANCE_THRESHOLD = 0.25
/** Speed (px/ms) above which even a short flick changes page. */
export const FLING_VELOCITY = 0.5
/** How far the track follows the finger past the first or last page. */
export const EDGE_RESISTANCE = 0.3

export type GestureIntent = 'undecided' | 'swipe' | 'other'

/** Classifies a gesture from the finger's travel so far. Once 'swipe' or 'other', callers keep that answer. */
export function classify(dx: number, dy: number): GestureIntent {
  if (Math.abs(dx) > DECIDE_AFTER_PX && Math.abs(dx) > Math.abs(dy) * HORIZONTAL_BIAS) return 'swipe'
  if (Math.abs(dy) > DECIDE_AFTER_PX || Math.abs(dx) > DECIDE_AFTER_PX) return 'other'
  return 'undecided'
}

/** Where the track should sit while dragging: 1:1 with the finger, with resistance past either end. */
export function dragOffset(dx: number, page: number, lastPage: number): number {
  const pastEdge = (page === 0 && dx > 0) || (page === lastPage && dx < 0)
  return pastEdge ? dx * EDGE_RESISTANCE : dx
}

/** How far back from release the flick speed is measured. */
export const VELOCITY_WINDOW_MS = 100

export interface Sample {
  x: number
  /** Event timestamp, ms. */
  t: number
}

/**
 * Finger speed (px/ms) at release: how far it travelled in the last VELOCITY_WINDOW_MS, divided by that window.
 * Where the finger was at the start of the window is taken from the latest sample at or before that moment (between
 * samples the finger may simply have rested). Robust to what goes wrong on real phones:
 * - a pause before the flick doesn't dilute it (averaging over the whole gesture would);
 * - a busy phone coalescing the moves into one or two events still yields the same travel.
 */
export function releaseVelocity(samples: Sample[]): number {
  const last = samples.at(-1)
  const first = samples[0]
  if (!last || !first || last.t <= first.t) return 0
  // Gestures shorter than the window: average over the whole gesture.
  if (last.t - first.t < VELOCITY_WINDOW_MS) return (last.x - first.x) / (last.t - first.t)
  const windowStart = last.t - VELOCITY_WINDOW_MS
  const from = samples.findLast((s) => s.t <= windowStart) ?? first
  return (last.x - from.x) / VELOCITY_WINDOW_MS
}

/** The page a released swipe lands on. Positive dx means the finger moved right, towards earlier pages. */
export function settle(args: { page: number; lastPage: number; dx: number; velocity: number; width: number }): number {
  const { page, lastPage, dx, velocity, width } = args
  let next = page
  if (dx <= -width * DISTANCE_THRESHOLD || velocity <= -FLING_VELOCITY) next = page + 1
  else if (dx >= width * DISTANCE_THRESHOLD || velocity >= FLING_VELOCITY) next = page - 1
  return Math.min(Math.max(next, 0), lastPage)
}
