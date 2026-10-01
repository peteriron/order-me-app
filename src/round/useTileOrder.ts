import { useMemo, useState } from 'react'
import type { PlacedRound } from '../history/history.ts'
import type { Catalog, Sections } from '../items/catalog.ts'
import type { Pins } from '../items/pins.ts'
import type { Locale } from '../shared/i18n.ts'
import { gridSections, popularityOrder } from './tileOrder.ts'

/**
 * Tiles for the Round page: Pinned Items first, then Popularity order. The Popularity order is computed once at app
 * start and again whenever `placements` changes (a Round placed or its placing undone), and held fixed otherwise,
 * so tiles never move while a Round is being composed. Pins apply right away.
 */
export function useTileOrder(
  catalog: Catalog,
  pins: Pins,
  history: PlacedRound[],
  locale: Locale,
  placements: number,
): Sections {
  const rank = () => ({ placements, order: popularityOrder(catalog, history, locale, new Date()) })
  const [ranked, setRanked] = useState(rank)
  // Recompute during render rather than in an effect, so the old order is never painted after a placement.
  if (ranked.placements !== placements) setRanked(rank())
  return useMemo(() => gridSections(catalog, ranked.order, pins), [catalog, ranked.order, pins])
}
