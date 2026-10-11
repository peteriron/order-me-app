import type { PlacedRound } from '../history/history.ts'
import { seedCatalog, type Catalog } from '../items/catalog.ts'
import { fromCategories, type Groups } from '../items/groups.ts'
import type { Pins } from '../items/pins.ts'
import { recognizeStarters, type LegacyItem } from '../items/starter.ts'
import type { ShowOrder } from '../show/showOrder.ts'
import { emptyRound, type ComposingRound } from '../round/round.ts'
import { DEFAULT_SETTINGS, withDefaults, type Settings } from '../settings/settings.ts'
import type { Locale } from '../shared/i18n.ts'

/** The slice of the Web Storage API this module needs; window.localStorage satisfies it. */
export interface KeyValueStore {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export interface AppState {
  catalog: Catalog
  /** The groups (boxes), in the Operator's order (v6 of the app). */
  groups: Groups
  round: ComposingRound
  /** Placed Rounds, newest first. */
  history: PlacedRound[]
  settings: Settings
  /** Pinned Items, in the Operator's order. */
  pins: Pins
  /** The line order of the last shared Round received (#49); empty if none. */
  showOrder: ShowOrder
}

interface Seed {
  locale: Locale
  newId: () => string
}

const KEY = 'order-me'

/** v1: Catalog + composing Round (#1). Up to v6, Items had a category (drink or snack) instead of a group. */
interface StoredV1 {
  version: 1
  catalog: LegacyItem[]
  round: ComposingRound
}

/** v2: adds history of placed Rounds (#3). */
interface StoredV2 extends Omit<StoredV1, 'version'> {
  version: 2
  history: PlacedRound[]
}

/** v3: adds settings (#11). */
interface StoredV3 extends Omit<StoredV2, 'version'> {
  version: 3
  settings: Settings
}

/** v4: adds Pinned Items (#29). */
interface StoredV4 extends Omit<StoredV3, 'version'> {
  version: 4
  pins: Pins
}

/** v5: starter Items are marked (Item.starter), so their names follow the app language (#43). */
interface StoredV5 extends Omit<StoredV4, 'version'> {
  version: 5
}

/** v6: adds the Show order from a shared Round (#49). */
interface StoredV6 extends Omit<StoredV5, 'version'> {
  version: 6
  showOrder: ShowOrder
}

/** v7: groups replace the drink and snack categories (app v6). */
interface StoredV7 extends AppState {
  version: 7
}

type Stored = StoredV1 | StoredV2 | StoredV3 | StoredV4 | StoredV5 | StoredV6 | StoredV7

/** The state as saved before groups: everything but the groups, with v5's Items. */
type LegacyState = Omit<AppState, 'catalog' | 'groups'> & { catalog: LegacyItem[] }

/** True when nothing has been saved yet (or it can't be read): the next load is a first launch. */
export function isFirstLaunch(store: KeyValueStore): boolean {
  return read(store) === null
}

/** Deletes the saved app state, so the next load is a first launch again. Only this app's key: the origin is shared. */
export function forgetAppState(store: KeyValueStore): void {
  try {
    store.removeItem(KEY)
  } catch {
    // Storage blocked: there was nothing saved to forget.
  }
}

/** Reads the saved app state, seeding and saving the starter Catalog on first launch. */
export function loadAppState(store: KeyValueStore, seed: Seed): AppState {
  const saved = read(store)
  if (saved) return upgrade(saved, seed)

  const fresh: AppState = {
    ...seedCatalog(seed.locale, seed.newId),
    round: emptyRound(),
    history: [],
    settings: DEFAULT_SETTINGS,
    pins: [],
    showOrder: [],
  }
  saveAppState(store, fresh)
  return fresh
}

/** Saves the app state. Failures (storage blocked or full) are swallowed: the app keeps working in memory. */
export function saveAppState(store: KeyValueStore, state: AppState): void {
  const stored: StoredV7 = { version: 7, ...state }
  try {
    store.setItem(KEY, JSON.stringify(stored))
  } catch {
    // Nothing useful to do mid-round; the next successful save catches up.
  }
}

function upgrade(saved: Stored, seed: Seed): AppState {
  const state = saved.version === 7 ? withoutVersion(saved) : upgradeToV7(saved, seed)
  // Settings added since the save (orderByPopularity, v6 of the app) start at their default.
  return { ...state, settings: withDefaults(state.settings) }
}

/**
 * Groups replace categories: starter Items go to their starter group, the Operator's own drinks to "Other drinks"
 * and their own snacks to Snacks (fromCategories). Item ids stay, so the Round, pins, Show order and History still
 * point at the same Items.
 */
function upgradeToV7(saved: Exclude<Stored, StoredV7>, seed: Seed): AppState {
  const { catalog, ...rest } = upgradeToV6(saved)
  return { ...rest, ...fromCategories(catalog, seed.locale, seed.newId) }
}

function upgradeToV6(saved: Exclude<Stored, StoredV7>): LegacyState {
  if (saved.version === 6) return withoutVersion(saved)
  return { ...upgradeToV5(saved), showOrder: [] }
}

function upgradeToV5(saved: Exclude<Stored, StoredV6 | StoredV7>): Omit<LegacyState, 'showOrder'> {
  if (saved.version === 5) return withoutVersion(saved)
  // Before v5, starter Items weren't marked: recognise them by name (starter.ts).
  const earlier = upgradeToV4(saved)
  return { ...earlier, catalog: recognizeStarters(earlier.catalog) }
}

/** The saved state without its storage version: that belongs to the save, not to the app state. */
function withoutVersion<T extends { version: number }>({ version: _version, ...state }: T): Omit<T, 'version'> {
  return state
}

function upgradeToV4(saved: Exclude<Stored, StoredV5 | StoredV6 | StoredV7>): Omit<LegacyState, 'showOrder'> {
  switch (saved.version) {
    case 1:
      return { catalog: saved.catalog, round: saved.round, history: [], settings: DEFAULT_SETTINGS, pins: [] }
    case 2:
      return { catalog: saved.catalog, round: saved.round, history: saved.history, settings: DEFAULT_SETTINGS, pins: [] }
    case 3:
      return { catalog: saved.catalog, round: saved.round, history: saved.history, settings: saved.settings, pins: [] }
    case 4:
      return { catalog: saved.catalog, round: saved.round, history: saved.history, settings: saved.settings, pins: saved.pins }
  }
}

/**
 * The saved state, or null when there is none or it can't be used: unreadable, or not the shape of any version (the
 * origin is shared with other GitHub Pages projects, so the key could hold anything). The app then starts fresh
 * rather than failing to open.
 */
function read(store: KeyValueStore): Stored | null {
  try {
    const raw = store.getItem(KEY)
    const saved: unknown = raw === null ? null : JSON.parse(raw)
    return isStored(saved) ? saved : null
  } catch {
    return null
  }
}

/** A light check of what every version has: a known version, a Catalog list and a Round with counts (and groups from v7). */
function isStored(saved: unknown): saved is Stored {
  if (typeof saved !== 'object' || saved === null) return false
  const { version, catalog, round, groups } = saved as Record<string, unknown>
  return (
    (version !== 7 || Array.isArray(groups)) &&
    typeof version === 'number' &&
    version >= 1 &&
    version <= 7 &&
    Array.isArray(catalog) &&
    typeof round === 'object' &&
    round !== null &&
    typeof (round as Record<string, unknown>).counts === 'object'
  )
}
