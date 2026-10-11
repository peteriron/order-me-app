import type { Item, Sections } from './items/catalog.ts'
import type { Groups } from './items/groups.ts'

/** Two groups for unit tests, with ids that read like v5's categories: Items use `group: 'drink'` or `'snack'`. */
export const TEST_GROUPS: Groups = [
  { id: 'drink', name: 'Drinks', colour: 0 },
  { id: 'snack', name: 'Snacks', colour: 1 },
]

/** Sections as `{ groupId: items }`, to compare in tests. */
export function byGroup(sections: Sections): Record<string, Item[]> {
  return Object.fromEntries(sections.map((s) => [s.group.id, s.items]))
}

/** Sections from `{ drink: [...], snack: [...] }`, in TEST_GROUPS order. */
export function sections(items: Partial<Record<string, Item[]>>): Sections {
  return TEST_GROUPS.map((group) => ({ group, items: items[group.id] ?? [] }))
}
