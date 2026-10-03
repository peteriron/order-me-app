import type { Sections } from '../items/catalog.ts'
import { pinnedFirst } from '../items/pins.ts'

/**
 * The Show order: Item ids in the order of the last shared Round this phone received (#49), so it lists a Round the
 * way the sender did. Empty on a phone that never received one.
 */
export type ShowOrder = string[]

/**
 * The Round's sections as the Show tab lists them: per category, the Items in the Show order first, in that order,
 * then the rest in grid order. Share as text, Share Round and History read the Round in this order too.
 */
export function showSections(grid: Sections, showOrder: ShowOrder): Sections {
  if (showOrder.length === 0) return grid
  return { drink: pinnedFirst(grid.drink, showOrder), snack: pinnedFirst(grid.snack, showOrder) }
}
