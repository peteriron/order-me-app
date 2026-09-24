import { useCallback, useEffect, useState } from 'react'
import {
  add,
  addToCatalog,
  clear,
  deleteItem,
  deletePlacedRound,
  editItem,
  markOrdered,
  remove,
  type ComposingRound,
  type GridSections,
  type ItemDraft,
  type Locale,
} from '../domain/index.ts'
import { loadAppState, saveAppState, type AppState, type KeyValueStore } from '../storage/index.ts'
import type { LanguageSetting, ThemeSetting } from './settings.ts'

/** window.localStorage, or an in-memory stand-in when the browser refuses access (e.g. some private modes). */
function browserStore(): KeyValueStore {
  try {
    return window.localStorage
  } catch {
    const data = new Map<string, string>()
    return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) }
  }
}

/** `seedLocale` only matters on first launch, when the starter Catalog is created. */
export function useAppState(seedLocale: Locale) {
  const [store] = useState(browserStore)
  const [state, setState] = useState<AppState>(() =>
    loadAppState(store, { locale: seedLocale, newId: () => crypto.randomUUID() }),
  )

  // Save on every change so a killed tab or locked phone loses nothing.
  useEffect(() => saveAppState(store, state), [store, state])

  const addToRound = useCallback((itemId: string) => setState((s) => ({ ...s, round: add(s.round, itemId) })), [])
  const removeFromRound = useCallback((itemId: string) => setState((s) => ({ ...s, round: remove(s.round, itemId) })), [])
  const clearRound = useCallback(() => setState((s) => ({ ...s, round: clear(s.round) })), [])
  /** Adds a new Item to the Catalog, and optionally straight into the composing Round ("+ New" tile). */
  const createItem = useCallback((draft: ItemDraft, options: { addToRound?: boolean } = {}) => {
    const id = crypto.randomUUID()
    setState((s) => ({
      ...s,
      catalog: addToCatalog(s.catalog, draft, id),
      round: options.addToRound ? add(s.round, id) : s.round,
    }))
  }, [])
  const updateItem = useCallback(
    (itemId: string, draft: ItemDraft) => setState((s) => ({ ...s, catalog: editItem(s.catalog, itemId, draft) })),
    [],
  )
  const removeFromCatalog = useCallback((itemId: string) => setState((s) => ({ ...s, ...deleteItem(s, itemId) })), [])
  const clearHistory = useCallback(() => setState((s) => ({ ...s, history: [] })), [])
  const setLanguage = useCallback(
    (language: LanguageSetting) => setState((s) => ({ ...s, settings: { ...s.settings, language } })),
    [],
  )
  const setTheme = useCallback(
    (theme: ThemeSetting) => setState((s) => ({ ...s, settings: { ...s.settings, theme } })),
    [],
  )
  const replaceRound = useCallback((round: ComposingRound) => setState((s) => ({ ...s, round })), [])
  const deleteRound = useCallback(
    (roundId: string) => setState((s) => ({ ...s, history: deletePlacedRound(s.history, roundId) })),
    [],
  )


  /** Places the composing Round and returns a function that undoes exactly that placement. */
  const placeRound = (sections: GridSections) => {
    const meta = { id: crypto.randomUUID(), placedAt: new Date().toISOString() }
    const { next, undo } = markOrdered(state, sections, meta)
    setState({ ...state, ...next })
    return () => setState((s) => ({ ...s, ...undo(s) }))
  }

  return {
    state,
    addToRound,
    removeFromRound,
    clearRound,
    replaceRound,
    deleteRound,
    placeRound,
    createItem,
    updateItem,
    removeFromCatalog,
    clearHistory,
    setLanguage,
    setTheme,
  }
}
