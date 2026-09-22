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

/** The page a released swipe lands on. Positive dx means the finger moved right, towards earlier pages. */
export function settle(args: { page: number; lastPage: number; dx: number; ms: number; width: number }): number {
  const { page, lastPage, dx, ms, width } = args
  const velocity = dx / Math.max(ms, 1)
  let next = page
  if (dx <= -width * DISTANCE_THRESHOLD || velocity <= -FLING_VELOCITY) next = page + 1
  else if (dx >= width * DISTANCE_THRESHOLD || velocity >= FLING_VELOCITY) next = page - 1
  return Math.min(Math.max(next, 0), lastPage)
}
