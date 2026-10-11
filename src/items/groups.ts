import type { Locale } from '../shared/i18n.ts'
import type { Catalog, Item } from './catalog.ts'
import { isStarterGroupName, legacyGroupKey, OTHER_DRINKS, STARTER_GROUPS, type LegacyItem } from './starter.ts'

/**
 * A group of Items, drawn as a box on the Round and Items pages (v6). Groups replace v5's drink and snack categories.
 * A group has a name and a colour of its own, which the app picks; the Operator only names it.
 */
export interface Group {
  id: string
  name: string
  /** Which of the GROUP_COLOURS tints its box gets (`--group-0` … in styles.css). Picked once, when it's made. */
  colour: number
  /** Set on starter groups: which one (starter.ts). Its name then follows the app's language until renamed. */
  starter?: string
}

/** The Operator's groups, in their order: the order of the boxes. */
export type Groups = Group[]

/** How many box tints styles.css defines (`--group-0` to `--group-7`), in both themes. */
export const GROUP_COLOURS = 8

/** The colour for a new group: the tint used least so far, the first such in palette order. */
export function nextColour(groups: Groups): number {
  const uses = Array.from({ length: GROUP_COLOURS }, (_, colour) => groups.filter((g) => g.colour === colour).length)
  return uses.indexOf(Math.min(...uses))
}

/** A new group, last, with the next colour. */
export function addGroup(groups: Groups, name: string, id: string, starter?: string): Groups {
  return [...groups, { id, name, colour: nextColour(groups), ...(starter ? { starter } : {}) }]
}

/** The starter groups a first launch starts with, named in the device's language. */
export function seedGroups(locale: Locale, newId: () => string): Groups {
  return STARTER_GROUPS.reduce<Groups>((groups, row) => addGroup(groups, row.names[locale], newId(), row.key), [])
}

/** The group that is the starter group `key`, if there is one. */
export function starterGroup(groups: Groups, key: string): Group | undefined {
  return groups.find((g) => g.starter === key)
}

/**
 * Turns a v5 Catalog (categories) into groups: the six starter groups, and "Other drinks" just before Snacks when
 * there are drinks of the Operator's own. Starter Items go to their matching group, the Operator's own drinks to
 * Other drinks and their own snacks to Snacks (legacyGroupKey). Item ids, names and emoji stay as they were.
 */
export function fromCategories(
  legacy: LegacyItem[],
  locale: Locale,
  newId: () => string,
): { catalog: Catalog; groups: Groups } {
  const keys = legacy.map(legacyGroupKey)
  let groups = seedGroups(locale, newId)
  if (keys.includes(OTHER_DRINKS.key)) {
    const other = addGroup(groups, OTHER_DRINKS.names[locale], newId(), OTHER_DRINKS.key).at(-1)!
    const snacks = groups.findIndex((g) => g.starter === 'snacks')
    groups = [...groups.slice(0, snacks), other, ...groups.slice(snacks)]
  }
  const catalog = legacy.map(({ category: _category, ...item }, n): Item => ({
    ...item,
    group: starterGroup(groups, keys[n]!)!.id,
  }))
  return { catalog, groups }
}

export type GroupNameProblem = 'groupNameRequired'

/** Longest group name the sheet takes: it has to fit a tiny label. */
export const MAX_GROUP_NAME = 30

/** Tidies a typed group name (trimmed, single spaces) or says it's missing. */
export function checkGroupName(name: string): { ok: true; value: string } | { ok: false; problem: GroupNameProblem } {
  const tidy = name.trim().replace(/\s+/g, ' ').slice(0, MAX_GROUP_NAME)
  return tidy ? { ok: true, value: tidy } : { ok: false, problem: 'groupNameRequired' }
}

/**
 * Renames a group. A starter group stays one only when the name is what it's called in some language (saving the
 * name the sheet showed isn't a rename); otherwise the name is the Operator's and no longer follows the language.
 */
export function renameGroup(groups: Groups, groupId: string, name: string): Groups {
  return groups.map((group): Group => {
    if (group.id !== groupId) return group
    const { starter, ...rest } = group
    return starter && isStarterGroupName(starter, name) ? { ...rest, name, starter } : { ...rest, name }
  })
}

/** Moves a group to position `to` (clamped): the order of the boxes. */
export function moveGroup(groups: Groups, groupId: string, to: number): Groups {
  const group = groups.find((g) => g.id === groupId)
  if (!group) return groups
  const rest = groups.filter((g) => g.id !== groupId)
  const at = Math.min(Math.max(to, 0), rest.length)
  return [...rest.slice(0, at), group, ...rest.slice(at)]
}
