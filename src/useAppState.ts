import { useEffect, useMemo, useState } from 'react'
import { deletePlacedRound, markOrdered } from './history/history.ts'
import { addToCatalog, deleteItem, editItem, type ItemDraft, type Sections } from './items/catalog.ts'
import { movePin, pinsAfterEdit, togglePin } from './items/pins.ts'
import { replaceCatalog, type SharedItem } from './items/sharedCatalog.ts'
import { add, emptyRound, remove, type ComposingRound } from './round/round.ts'
import type { ThemeSetting } from './settings/settings.ts'
import type { LanguageSetting, Locale } from './shared/i18n.ts'
import { resetApp } from './settings/reset.ts'
import {
  forgetAppState,
  isFirstLaunch,
  loadAppState,
  saveAppState,
  type AppState,
  type KeyValueStore,
} from './shared/storage.ts'

/** window.localStorage, or an in-memory stand-in when the browser refuses access (e.g. some private modes). */
function browserStore(): KeyValueStore {
  try {
    return window.localStorage
  } catch {
    const data = new Map<string, string>()
    return {
      getItem: (k) => data.get(k) ?? null,
      setItem: (k, v) => void data.set(k, v),
      removeItem: (k) => void data.delete(k),
    }
  }
}

/** `seedLocale` only matters on first launch, when the starter Catalog is created. */
export function useAppState(seedLocale: Locale) {
  const [store] = useState(browserStore)
  /** Read before the first load saves the starter Catalog: a shared link opened now replaces it without asking. */
  const [firstLaunch] = useState(() => isFirstLaunch(store))
  const [state, setState] = useState<AppState>(() =>
    loadAppState(store, { locale: seedLocale, newId: () => crypto.randomUUID() }),
  )

  // Save on every change so a killed tab or locked phone loses nothing.
  useEffect(() => saveAppState(store, state), [store, state])

  /**
   * Goes up on every place and undo-place, and when a Shared Catalog replaces the Catalog: the moments the tile
   * order is recomputed (see useTileOrder).
   */
  const [placements, setPlacements] = useState(0)

  // Every action goes through setState's updater, so the object never changes and features can hold on to it.
  const actions = useMemo(() => {
    const update = (change: (s: AppState) => Partial<AppState>) => setState((s) => ({ ...s, ...change(s) }))
    return {
      addToRound: (itemId: string) => update((s) => ({ round: add(s.round, itemId) })),
      removeFromRound: (itemId: string) => update((s) => ({ round: remove(s.round, itemId) })),
      /** Empties the Round in one go. Deliberately no undo (see PRD). */
      clearRound: () => update(() => ({ round: emptyRound() })),
      replaceRound: (round: ComposingRound) => update(() => ({ round })),
      deleteRound: (roundId: string) => update((s) => ({ history: deletePlacedRound(s.history, roundId) })),
      /** Adds a new Item to the Catalog, and optionally straight into the composing Round ("+ New" tile). */
      createItem: (draft: ItemDraft, options: { addToRound?: boolean } = {}) => {
        const id = crypto.randomUUID()
        update((s) => ({
          catalog: addToCatalog(s.catalog, draft, id),
          round: options.addToRound ? add(s.round, id) : s.round,
        }))
      },
      updateItem: (itemId: string, draft: ItemDraft) =>
        update((s) => ({ catalog: editItem(s.catalog, itemId, draft), pins: pinsAfterEdit(s.pins, s.catalog, itemId, draft) })),
      removeFromCatalog: (itemId: string) => update((s) => deleteItem(s, itemId)),
      togglePin: (itemId: string) => update((s) => ({ pins: togglePin(s.pins, itemId) })),
      /** Moves a pinned Item to position `to` among its section's pinned Items. */
      movePin: (itemId: string, to: number) => update((s) => ({ pins: movePin(s.pins, s.catalog, itemId, to) })),
      clearHistory: () => update(() => ({ history: [] })),
      /** Replaces the Catalog with a Shared Catalog: fresh ids, empty Round, no pins, History kept. */
      replaceCatalog: (items: SharedItem[]) => {
        update(() => replaceCatalog(items, () => crypto.randomUUID()))
        setPlacements((n) => n + 1)
      },
      setLanguage: (language: LanguageSetting) => update((s) => ({ settings: { ...s.settings, language } })),
      setTheme: (theme: ThemeSetting) => update((s) => ({ settings: { ...s.settings, theme } })),
      /** Back to a first install, with the newest version (see resetApp). Resolves 'offline' when it couldn't. */
      resetApp: () => {
        const appUrl = new URL(import.meta.env.BASE_URL, location.href).href
        return resetApp(
          {
            fetch: (url, init) => fetch(url, init),
            caches: 'caches' in window ? caches : undefined,
            serviceWorker: navigator.serviceWorker,
            forgetAppState: () => forgetAppState(store),
            reload: (url) => location.replace(url),
          },
          appUrl,
        )
      },
    }
  }, [store])

  /** Places the composing Round and returns a function that undoes exactly that placement. */
  const placeRound = (sections: Sections) => {
    const meta = { id: crypto.randomUUID(), placedAt: new Date().toISOString() }
    const { next, undo } = markOrdered(state, sections, meta)
    setState({ ...state, ...next })
    setPlacements((n) => n + 1)
    return () => {
      setState((s) => ({ ...s, ...undo(s) }))
      setPlacements((n) => n + 1)
    }
  }

  return { state, firstLaunch, placements, actions, placeRound }
}

export type AppActions = ReturnType<typeof useAppState>['actions']
