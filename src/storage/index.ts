import {
  emptyRound,
  seedCatalog,
  type Catalog,
  type ComposingRound,
  type Locale,
  type PlacedRound,
} from '../domain/index.ts'
import { DEFAULT_SETTINGS, type Settings } from '../app/settings.ts'

/** The slice of the Web Storage API this module needs; window.localStorage satisfies it. */
export interface KeyValueStore {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export interface AppState {
  catalog: Catalog
  round: ComposingRound
  /** Placed Rounds, newest first. */
  history: PlacedRound[]
  settings: Settings
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
interface StoredV3 extends AppState {
  version: 3
}

type Stored = StoredV1 | StoredV2 | StoredV3

/** Reads the saved app state, seeding and saving the starter Catalog on first launch. */
export function loadAppState(store: KeyValueStore, seed: Seed): AppState {
  const saved = read(store)
  if (saved) return upgrade(saved)

  const fresh: AppState = {
    catalog: seedCatalog(seed.locale, seed.newId),
    round: emptyRound(),
    history: [],
    settings: DEFAULT_SETTINGS,
  }
  saveAppState(store, fresh)
  return fresh
}

/** Saves the app state. Failures (storage blocked or full) are swallowed: the app keeps working in memory. */
export function saveAppState(store: KeyValueStore, state: AppState): void {
  const stored: StoredV3 = { version: 3, ...state }
  try {
    store.setItem(KEY, JSON.stringify(stored))
  } catch {
    // Nothing useful to do mid-round; the next successful save catches up.
  }
}

function upgrade(saved: Stored): AppState {
  switch (saved.version) {
    case 1:
      return { catalog: saved.catalog, round: saved.round, history: [], settings: DEFAULT_SETTINGS }
    case 2:
      return { catalog: saved.catalog, round: saved.round, history: saved.history, settings: DEFAULT_SETTINGS }
    case 3:
      return { catalog: saved.catalog, round: saved.round, history: saved.history, settings: saved.settings }
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
