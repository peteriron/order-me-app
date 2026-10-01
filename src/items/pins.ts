import type { Catalog, Item, ItemDraft } from './catalog.ts'

/**
 * Pinned Items: Item ids in the Operator's order. One list covers both sections; a section's pin order is this list
 * filtered to its Items. Pins are the Operator's own and never part of a Shared Catalog.
 */
export type Pins = string[]

/** Pins an Item last among the pinned Items, or unpins it. */
export function togglePin(pins: Pins, itemId: string): Pins {
  return pins.includes(itemId) ? pins.filter((id) => id !== itemId) : [...pins, itemId]
}

/** `items` with the pinned ones first, in pin order; the rest keep the order they came in. */
export function pinnedFirst(items: Item[], pins: Pins): Item[] {
  const rank = new Map(pins.map((id, n) => [id, n]))
  const pinned = items.filter((i) => rank.has(i.id)).sort((a, b) => rank.get(a.id)! - rank.get(b.id)!)
  return [...pinned, ...items.filter((i) => !rank.has(i.id))]
}

/** Moves a pinned Item to position `to` among its own section's pinned Items. The other section's pins stay put. */
export function movePin(pins: Pins, catalog: Catalog, itemId: string, to: number): Pins {
  if (!pins.includes(itemId)) return pins
  const category = new Map(catalog.map((i) => [i.id, i.category]))
  const inSection = (id: string) => category.get(id) === category.get(itemId)

  const section = pins.filter((id) => inSection(id) && id !== itemId)
  section.splice(Math.min(Math.max(to, 0), section.length), 0, itemId)
  // Refill the section's slots in the full list with its new order.
  let next = 0
  return pins.map((id) => (inSection(id) ? section[next++]! : id))
}

/** After an edit: a pinned Item that changed category stays pinned, last among the other section's pins. */
export function pinsAfterEdit(pins: Pins, catalog: Catalog, itemId: string, draft: ItemDraft): Pins {
  const before = catalog.find((i) => i.id === itemId)
  if (!pins.includes(itemId) || before?.category === draft.category) return pins
  return [...pins.filter((id) => id !== itemId), itemId]
}
