import { useCallback, useEffect, useState } from 'react'
import { add, clear, markOrdered, remove, type GridSections, type Locale } from '../domain/index.ts'
import { loadAppState, saveAppState, type AppState, type KeyValueStore } from '../storage/index.ts'

/** window.localStorage, or an in-memory stand-in when the browser refuses access (e.g. some private modes). */
function browserStore(): KeyValueStore {
  try {
    return window.localStorage
  } catch {
    const data = new Map<string, string>()
    return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) }
  }
}

export function useAppState(locale: Locale) {
  const [store] = useState(browserStore)
  const [state, setState] = useState<AppState>(() =>
    loadAppState(store, { locale, newId: () => crypto.randomUUID() }),
  )

  // Save on every change so a killed tab or locked phone loses nothing.
  useEffect(() => saveAppState(store, state), [store, state])

  const addItem = useCallback((itemId: string) => setState((s) => ({ ...s, round: add(s.round, itemId) })), [])
  const removeItem = useCallback((itemId: string) => setState((s) => ({ ...s, round: remove(s.round, itemId) })), [])
  const clearRound = useCallback(() => setState((s) => ({ ...s, round: clear(s.round) })), [])


  /** Places the composing Round and returns a function that undoes exactly that placement. */
  const placeRound = (sections: GridSections) => {
    const meta = { id: crypto.randomUUID(), placedAt: new Date().toISOString() }
    const { next, undo } = markOrdered(state, sections, meta)
    setState({ ...state, ...next })
    return () => setState((s) => ({ ...s, ...undo(s) }))
  }

  return { state, addItem, removeItem, clearRound, placeRound }
}
