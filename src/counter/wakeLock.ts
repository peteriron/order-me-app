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

  const acquire = async () => {
    if (sentinel && !sentinel.released) return
    try {
      const next = await host.wakeLock!.request('screen')
      // Released while the request was in flight: give it straight back.
      if (active) sentinel = next
      else void next.release()
    } catch {
      // Refused or unsupported: the screen may sleep, and that's all.
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
