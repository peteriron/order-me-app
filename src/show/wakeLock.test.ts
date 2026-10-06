import { describe, expect, it, vi } from 'vitest'
import { keepScreenAwake, type WakeLockHost } from './wakeLock.ts'

/** A fake page: a wake lock that hands out sentinels, and a visibility state the test can flip. */
function fakeHost(options: { refuse?: boolean } = {}) {
  const sentinels: { release: ReturnType<typeof vi.fn>; released: boolean }[] = []
  let onVisibility: (() => void) | null = null
  const host: WakeLockHost = {
    wakeLock: {
      request: vi.fn(async () => {
        if (options.refuse) throw new DOMException('low battery', 'NotAllowedError')
        const sentinel = { released: false, release: vi.fn(async () => void (sentinel.released = true)) }
        sentinels.push(sentinel)
        return sentinel
      }),
    },
    visibilityState: 'visible',
    addEventListener: (_type, listener) => void (onVisibility = listener),
    removeEventListener: () => void (onVisibility = null),
  }
  const setVisible = (visible: boolean) => {
    host.visibilityState = visible ? 'visible' : 'hidden'
    // The browser drops the lock itself when the page is hidden.
    if (!visible) sentinels.forEach((s) => (s.released = true))
    onVisibility?.()
  }
  return { host, sentinels, setVisible, listening: () => onVisibility !== null }
}

const settle = () => new Promise((resolve) => setTimeout(resolve))

describe('keeping the screen awake', () => {
  it('holds a wake lock until released', async () => {
    const { host, sentinels } = fakeHost()
    const release = keepScreenAwake(host)
    await settle()
    expect(sentinels).toHaveLength(1)
    expect(host.wakeLock!.request).toHaveBeenCalledWith('screen')

    release()
    await settle()
    expect(sentinels[0]!.release).toHaveBeenCalled()
  })

  it('takes the lock again when the Operator comes back to the app', async () => {
    const { host, sentinels, setVisible } = fakeHost()
    keepScreenAwake(host)
    await settle()
    setVisible(false)
    setVisible(true)
    await settle()
    expect(sentinels).toHaveLength(2)
    expect(sentinels[1]!.released).toBe(false)
  })

  it('takes a fresh lock when the page comes back while the first request is still in flight', async () => {
    const { host, sentinels, setVisible } = fakeHost()
    keepScreenAwake(host)
    setVisible(false)
    setVisible(true)
    await settle()
    await settle()
    // One request at a time, and no lock leaked: the dropped one is replaced, not overwritten.
    expect(host.wakeLock!.request).toHaveBeenCalledTimes(2)
    expect(sentinels).toHaveLength(2)
    expect(sentinels[1]!.released).toBe(false)
  })

  it('stops listening once released', async () => {
    const { host, listening } = fakeHost()
    const release = keepScreenAwake(host)
    release()
    expect(listening()).toBe(false)
  })

  it('releases a lock that arrives after the Counter view has already closed', async () => {
    const { host, sentinels } = fakeHost()
    const release = keepScreenAwake(host)
    release()
    await settle()
    expect(sentinels[0]!.release).toHaveBeenCalled()
  })

  it('does nothing where wake locks are unsupported or refused', async () => {
    expect(() => keepScreenAwake({ ...fakeHost().host, wakeLock: undefined })()).not.toThrow()
    const refused = fakeHost({ refuse: true })
    const release = keepScreenAwake(refused.host)
    await settle()
    expect(() => release()).not.toThrow()
  })
})
