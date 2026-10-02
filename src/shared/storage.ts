import type { PlacedRound } from '../history/history.ts'
import { seedCatalog, type Catalog } from '../items/catalog.ts'
import type { Pins } from '../items/pins.ts'
import { recognizeStarters } from '../items/starter.ts'
import { emptyRound, type ComposingRound } from '../round/round.ts'
import { DEFAULT_SETTINGS, type Settings } from '../settings/settings.ts'
import type { Locale } from './i18n.ts'

/** The slice of the Web Storage API this module needs; window.localStorage satisfies it. */
export interface KeyValueStore {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export interface AppState {
  catalog: Catalog
  round: ComposingRound
  /** Placed Rounds, newest first. */
  history: PlacedRound[]
  settings: Settings
  /** Pinned Items, in the Operator's order. */
  pins: Pins
}

interface Seed {
  locale: Locale
  newId: () => string
}

const KEY = 'order-me'

/** v1: Catalog + composing Round (#1). */
interface StoredV1 {
  version: 1
  catalog: Catalog
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
interface StoredV5 extends AppState {
  version: 5
}

type Stored = StoredV1 | StoredV2 | StoredV3 | StoredV4 | StoredV5

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
  if (saved) return upgrade(saved)

  const fresh: AppState = {
    catalog: seedCatalog(seed.locale, seed.newId),
    round: emptyRound(),
    history: [],
    settings: DEFAULT_SETTINGS,
    pins: [],
  }
  saveAppState(store, fresh)
  return fresh
}

/** Saves the app state. Failures (storage blocked or full) are swallowed: the app keeps working in memory. */
export function saveAppState(store: KeyValueStore, state: AppState): void {
  const stored: StoredV5 = { version: 5, ...state }
  try {
    store.setItem(KEY, JSON.stringify(stored))
  } catch {
    // Nothing useful to do mid-round; the next successful save catches up.
  }
}

function upgrade(saved: Stored): AppState {
  if (saved.version === 5) return saved
  // Before v5, starter Items weren't marked: recognise them by name (starter.ts).
  const earlier = upgradeToV4(saved)
  return { ...earlier, catalog: recognizeStarters(earlier.catalog) }
}

function upgradeToV4(saved: Exclude<Stored, StoredV5>): AppState {
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

function read(store: KeyValueStore): Stored | null {
  try {
    const raw = store.getItem(KEY)
    return raw === null ? null : (JSON.parse(raw) as Stored)
  } catch {
    return null
  }
}
