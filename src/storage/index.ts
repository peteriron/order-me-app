import { emptyRound, seedCatalog, type Catalog, type ComposingRound, type Locale } from '../domain/index.ts'

/** The slice of the Web Storage API this module needs; window.localStorage satisfies it. */
export interface KeyValueStore {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export interface AppState {
  catalog: Catalog
  round: ComposingRound
}

interface Seed {
  locale: Locale
  newId: () => string
}

const KEY = 'order-me'
const SCHEMA_VERSION = 1

interface StoredV1 extends AppState {
  version: typeof SCHEMA_VERSION
}

/** Reads the saved app state, seeding and saving the starter Catalog on first launch. */
export function loadAppState(store: KeyValueStore, seed: Seed): AppState {
  const saved = read(store)
  if (saved) return { catalog: saved.catalog, round: saved.round }

  const fresh: AppState = { catalog: seedCatalog(seed.locale, seed.newId), round: emptyRound() }
  saveAppState(store, fresh)
  return fresh
}

/** Saves the app state. Failures (storage blocked or full) are swallowed: the app keeps working in memory. */
export function saveAppState(store: KeyValueStore, state: AppState): void {
  const stored: StoredV1 = { version: SCHEMA_VERSION, ...state }
  try {
    store.setItem(KEY, JSON.stringify(stored))
  } catch {
    // Nothing useful to do mid-round; the next successful save catches up.
  }
}

function read(store: KeyValueStore): StoredV1 | null {
  try {
    const raw = store.getItem(KEY)
    return raw === null ? null : (JSON.parse(raw) as StoredV1)
  } catch {
    return null
  }
}
