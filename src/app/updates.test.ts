import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CHECK_EVERY_MS, watchForUpdates, type UpdateHost } from './updates.ts'

/** A fake page: a service worker container, online state and visibility the test can change. */
function fakeHost({ controlled = true, online = true } = {}) {
  const worker = new EventTarget()
  const page = new EventTarget()
  const update = vi.fn(async () => {})
  const host: UpdateHost & { onLine: boolean; visibilityState: DocumentVisibilityState } = {
    serviceWorker: Object.assign(worker, {
      controller: controlled ? {} : null,
      getRegistration: async () => ({ update }),
    }),
    page,
    onLine: online,
    visibilityState: 'visible',
  }
  return {
    host,
    update,
    /** A new version's service worker takes over this page (skipWaiting + clientsClaim). */
    takeOver: () => worker.dispatchEvent(new Event('controllerchange')),
    comeBack: () => {
      host.visibilityState = 'visible'
      page.dispatchEvent(new Event('visibilitychange'))
    },
    goOnline: () => {
      host.onLine = true
      page.dispatchEvent(new Event('online'))
    },
  }
}

const settle = () => vi.advanceTimersByTimeAsync(0)

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('checking for a new version', () => {
  it('checks at start, on coming back to the app, on coming back online, and every 30 minutes', async () => {
    const { host, update, comeBack, goOnline } = fakeHost()
    watchForUpdates(host, () => {})
    await settle()
    expect(update).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(CHECK_EVERY_MS)
    expect(update).toHaveBeenCalledTimes(2)
    comeBack()
    await settle()
    expect(update).toHaveBeenCalledTimes(3)
    goOnline()
    await settle()
    expect(update).toHaveBeenCalledTimes(4)
  })

  it('doesn’t try while offline, and a failed check is quiet', async () => {
    const { host, update, goOnline } = fakeHost({ online: false })
    update.mockRejectedValue(new TypeError('Failed to fetch'))
    watchForUpdates(host, () => {})
    await vi.advanceTimersByTimeAsync(CHECK_EVERY_MS)
    expect(update).not.toHaveBeenCalled()
    goOnline()
    await settle()
    expect(update).toHaveBeenCalledTimes(1)
  })

  it('stops checking once stopped', async () => {
    const { host, update, comeBack } = fakeHost()
    const stop = watchForUpdates(host, () => {})
    await settle()
    stop()
    comeBack()
    await vi.advanceTimersByTimeAsync(CHECK_EVERY_MS * 2)
    expect(update).toHaveBeenCalledTimes(1)
  })
})

describe('a new version being ready', () => {
  it('is reported when a new version takes over a page an older one was running', () => {
    const { host, takeOver } = fakeHost()
    const ready = vi.fn()
    watchForUpdates(host, ready)
    takeOver()
    expect(ready).toHaveBeenCalledTimes(1)
  })

  it('isn’t reported for the very first install, which takes over a page nothing ran before', () => {
    const { host, takeOver } = fakeHost({ controlled: false })
    const ready = vi.fn()
    watchForUpdates(host, ready)
    takeOver()
    expect(ready).not.toHaveBeenCalled()
    // A later version after that first install is an update.
    takeOver()
    expect(ready).toHaveBeenCalledTimes(1)
  })

  it('does nothing in a browser without service workers', async () => {
    const ready = vi.fn()
    const stop = watchForUpdates({ serviceWorker: undefined, page: new EventTarget(), onLine: true, visibilityState: 'visible' }, ready)
    await vi.advanceTimersByTimeAsync(CHECK_EVERY_MS)
    stop()
    expect(ready).not.toHaveBeenCalled()
  })
})
