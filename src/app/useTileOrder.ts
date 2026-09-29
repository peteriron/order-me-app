import { useMemo, useState } from 'react'
import {
  gridSections,
  popularityOrder,
  type Catalog,
  type GridSections,
  type Locale,
  type PlacedRound,
} from '../domain/index.ts'

/**
 * Tiles for the Round page in Popularity order. The order is computed once at app start and again whenever
 * `placements` changes (a Round placed or its placing undone), and held fixed otherwise, so tiles never move
 * while a Round is being composed.
 */
export function useTileOrder(
  catalog: Catalog,
  history: PlacedRound[],
  locale: Locale,
  placements: number,
): GridSections {
  const rank = () => ({ placements, order: popularityOrder(catalog, history, locale, new Date()) })
  const [ranked, setRanked] = useState(rank)
  // Recompute during render rather than in an effect, so the old order is never painted after a placement.
  if (ranked.placements !== placements) setRanked(rank())
  return useMemo(() => gridSections(catalog, ranked.order), [catalog, ranked.order])
}
