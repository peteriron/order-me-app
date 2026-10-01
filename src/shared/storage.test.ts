import { describe, expect, it } from 'vitest'
import { add, countOf } from '../round/round.ts'
import { loadAppState, saveAppState, type KeyValueStore } from './storage.ts'

/** In-memory stand-in for window.localStorage. */
function memoryStore(): KeyValueStore & { data: Map<string, string> } {
  const data = new Map<string, string>()
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
  }
}

const ids = () => {
  let n = 0
  return () => `id-${++n}`
}

describe('app state storage', () => {
  it('first launch: the starter Catalog, an empty Round, no history, default settings', () => {
    const state = loadAppState(memoryStore(), { locale: 'en', newId: ids() })
    expect(state.catalog).toHaveLength(21)
    expect(state.round.counts).toEqual({})
    expect(state.history).toEqual([])
    expect(state.pins).toEqual([])
    // Language follows the phone; dark theme.
    expect(state.settings).toEqual({ language: 'system', theme: 'dark' })
  })

  it('seeds only once: a later launch in another language keeps the Operator’s Catalog', () => {
    const store = memoryStore()
    loadAppState(store, { locale: 'nl', newId: ids() })
    const again = loadAppState(store, { locale: 'en', newId: ids() })
    expect(again.catalog.map((i) => i.name)).toContain('Plat water')
    expect(again.catalog.map((i) => i.name)).not.toContain('Still water')
  })

  it('restores the composing Round saved before a restart', () => {
    const store = memoryStore()
    const first = loadAppState(store, { locale: 'en', newId: ids() })
    const duvel = first.catalog.find((i) => i.name === 'Duvel')!
    saveAppState(store, { ...first, round: add(add(first.round, duvel.id), duvel.id) })

    const restarted = loadAppState(store, { locale: 'en', newId: ids() })
    expect(countOf(restarted.round, duvel.id)).toBe(2)
    expect(restarted.catalog).toEqual(first.catalog)
  })

  it('still starts with the starter Catalog when the browser blocks storage', () => {
    const blocked: KeyValueStore = {
      getItem: () => { throw new DOMException('denied', 'SecurityError') },
      setItem: () => { throw new DOMException('denied', 'SecurityError') },
    }
    const state = loadAppState(blocked, { locale: 'en', newId: ids() })
    expect(state.catalog).toHaveLength(21)
    expect(() => saveAppState(blocked, state)).not.toThrow()
  })

  it('starts fresh when the saved data is unreadable', () => {
    const store = memoryStore()
    store.setItem('order-me', '{not json')
    const state = loadAppState(store, { locale: 'en', newId: ids() })
    expect(state.catalog).toHaveLength(21)
  })

  it('restores placed Rounds after a restart', () => {
    const store = memoryStore()
    const first = loadAppState(store, { locale: 'en', newId: ids() })
    const placed = {
      id: 'r1',
      placedAt: '2026-09-22T21:14:00.000Z',
      lines: [{ itemId: 'x', name: 'Duvel', category: 'drink' as const, emoji: '🍺', count: 3 }],
    }
    saveAppState(store, { ...first, history: [placed] })

    expect(loadAppState(store, { locale: 'en', newId: ids() }).history).toEqual([placed])
  })

  it('upgrades a save from before history existed, keeping the Catalog and the composing Round', () => {
    const store = memoryStore()
    const catalog = [{ id: 'd', name: 'Duvel', category: 'drink', emoji: '🍺' }]
    store.setItem('order-me', JSON.stringify({ version: 1, catalog, round: { counts: { d: 2 } } }))

    const state = loadAppState(store, { locale: 'en', newId: ids() })
    expect(state.catalog).toEqual(catalog)
    expect(countOf(state.round, 'd')).toBe(2)
    expect(state.history).toEqual([])
  })

  it('remembers the chosen language and theme after a restart', () => {
    const store = memoryStore()
    const first = loadAppState(store, { locale: 'en', newId: ids() })
    saveAppState(store, { ...first, settings: { language: 'nl', theme: 'light' } })
    expect(loadAppState(store, { locale: 'en', newId: ids() }).settings).toEqual({ language: 'nl', theme: 'light' })
  })

  it('remembers Pinned Items and their order after a restart', () => {
    const store = memoryStore()
    const first = loadAppState(store, { locale: 'en', newId: ids() })
    saveAppState(store, { ...first, pins: ['id-3', 'id-1'] })
    expect(loadAppState(store, { locale: 'en', newId: ids() }).pins).toEqual(['id-3', 'id-1'])
  })

  it('upgrades a save from before pins existed: everything kept, nothing pinned', () => {
    const store = memoryStore()
    const catalog = [{ id: 'd', name: 'Duvel', category: 'drink', emoji: '🍺' }]
    const history = [{ id: 'r1', placedAt: '2026-09-22T21:14:00.000Z', lines: [] }]
    const settings = { language: 'nl', theme: 'light' }
    store.setItem('order-me', JSON.stringify({ version: 3, catalog, round: { counts: { d: 1 } }, history, settings }))

    const state = loadAppState(store, { locale: 'en', newId: ids() })
    expect(state).toEqual({ catalog, round: { counts: { d: 1 } }, history, settings, pins: [] })
  })

  it('upgrades a save from before settings existed, keeping history', () => {
    const store = memoryStore()
    const catalog = [{ id: 'd', name: 'Duvel', category: 'drink', emoji: '🍺' }]
    const history = [{ id: 'r1', placedAt: '2026-09-22T21:14:00.000Z', lines: [] }]
    store.setItem('order-me', JSON.stringify({ version: 2, catalog, round: { counts: {} }, history }))

    const state = loadAppState(store, { locale: 'en', newId: ids() })
    expect(state.history).toEqual(history)
    expect(state.settings).toEqual({ language: 'system', theme: 'dark' })
  })
})
