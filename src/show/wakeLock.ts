/** The slice of `navigator` and `document` the wake lock needs; the real ones satisfy it (see `browserHost`). */
export interface WakeLockHost {
  wakeLock?: { request(type: 'screen'): Promise<{ release(): Promise<void>; released: boolean }> }
  visibilityState: DocumentVisibilityState
  addEventListener(type: 'visibilitychange', listener: () => void): void
  removeEventListener(type: 'visibilitychange', listener: () => void): void
}

export function browserHost(): WakeLockHost {
  return {
    wakeLock: navigator.wakeLock,
    get visibilityState() {
      return document.visibilityState
    },
    addEventListener: (type, listener) => document.addEventListener(type, listener),
    removeEventListener: (type, listener) => document.removeEventListener(type, listener),
  }
}

/**
 * Keeps the screen on so it doesn't go dark while the bartender reads it. The browser drops the lock whenever the
 * page is hidden, so it is taken again on coming back. Silently does nothing where unsupported or refused
 * (e.g. low battery). Returns a function that lets the screen sleep again.
 */
export function keepScreenAwake(host: WakeLockHost): () => void {
  if (!host.wakeLock) return () => {}
  let active = true
  let sentinel: { release(): Promise<void>; released: boolean } | null = null
  /** One request at a time: two in flight would leak the first lock (its sentinel gets overwritten). */
  let pending = false

  const acquire = async (retriesLeft = 3) => {
    if (pending) return
    if (sentinel && !sentinel.released) return
    pending = true
    let dropped = false
    try {
      const next = await host.wakeLock!.request('screen')
      if (!active) {
        // Released while the request was in flight: give it straight back.
        void next.release().catch(() => {})
      } else if (next.released) {
        // The page was hidden while the request was in flight, and the browser dropped the lock.
        dropped = true
      } else {
        sentinel = next
      }
    } catch {
      // Refused or unsupported: the screen may sleep, and that's all.
    } finally {
      pending = false
      if (dropped && active && retriesLeft > 0 && host.visibilityState === 'visible') void acquire(retriesLeft - 1)
    }
  }
  const onVisibility = () => {
    if (host.visibilityState === 'visible') void acquire()
  }

  void acquire()
  host.addEventListener('visibilitychange', onVisibility)
  return () => {
    active = false
    host.removeEventListener('visibilitychange', onVisibility)
    void sentinel?.release().catch(() => {})
  }
}
