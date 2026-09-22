import { describe, expect, it } from 'vitest'
import { add, countOf } from '../domain/index.ts'
import { loadAppState, saveAppState, type KeyValueStore } from './index.ts'

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
  it('seeds the starter Catalog on first launch, with an empty Round', () => {
    const state = loadAppState(memoryStore(), { locale: 'en', newId: ids() })
    expect(state.catalog).toHaveLength(21)
    expect(state.round.counts).toEqual({})
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
})
