import { useMemo, useState } from 'react'
import type { PlacedRound } from '../history/history.ts'
import type { Catalog, Sections } from '../items/catalog.ts'
import type { Groups } from '../items/groups.ts'
import type { Pins } from '../items/pins.ts'
import { gridSections, tileOrder } from './tileOrder.ts'

/**
 * Tiles for the Round page: Pinned Items first, then Catalog order, or Popularity order when `byPopularity`. The
 * order is computed once at app start and again whenever `placements` changes (a Round placed or its placing undone)
 * or the Operator flips the setting, and held fixed otherwise, so tiles never move by themselves while a Round is
 * being composed. Pins and the setting apply right away: both are deliberate choices.
 */
export function useTileOrder(
  catalog: Catalog,
  groups: Groups,
  pins: Pins,
  history: PlacedRound[],
  placements: number,
  byPopularity: boolean,
): Sections {
  const rank = () => ({ placements, byPopularity, order: tileOrder(catalog, history, new Date(), byPopularity) })
  const [ranked, setRanked] = useState(rank)
  // Recompute during render rather than in an effect, so the old order is never painted after a placement.
  if (ranked.placements !== placements || ranked.byPopularity !== byPopularity) setRanked(rank())
  return useMemo(() => gridSections(catalog, groups, ranked.order, pins), [catalog, groups, ranked.order, pins])
}
