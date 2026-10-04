import { useEffect, useState } from 'react'

/** How often an open app checks for a new version, on top of starting and coming back to it. */
export const CHECK_EVERY_MS = 30 * 60 * 1000

/** The slice of the browser this module needs, so tests can stand in for it. */
export interface UpdateHost {
  serviceWorker:
    | (EventTarget & { controller: object | null; getRegistration: () => Promise<{ update: () => Promise<unknown> } | undefined> })
    | undefined
  /** Where `visibilitychange` and `online` arrive. */
  page: EventTarget
  readonly onLine: boolean
  readonly visibilityState: DocumentVisibilityState
}

/**
 * Asks the service worker to look for a new version (it downloads one and takes over the page: skipWaiting +
 * clientsClaim), and calls `onReady` once a new version has taken over a page an older one was running, so the
 * Operator can reload into it. Browsers only check on their own when a page is opened, which an installed app on a
 * phone rarely is. Checks need a connection; offline they're skipped, and a failed one is quiet. Returns `stop`.
 */
export function watchForUpdates(host: UpdateHost, onReady: () => void): () => void {
  const sw = host.serviceWorker
  if (!sw) return () => {}

  // The very first install also takes over the page, but nothing ran before it: that's not an update.
  let controlled = sw.controller !== null
  const onControllerChange = () => {
    if (controlled) onReady()
    controlled = true
  }
  const check = () => {
    if (!host.onLine) return
    sw.getRegistration()
      .then((registration) => registration?.update())
      .catch(() => {
        // Offline after all, or the server is unreachable: the next check tries again.
      })
  }
  const onVisible = () => host.visibilityState === 'visible' && check()

  sw.addEventListener('controllerchange', onControllerChange)
  host.page.addEventListener('visibilitychange', onVisible)
  host.page.addEventListener('online', check)
  const timer = setInterval(check, CHECK_EVERY_MS)
  check()

  return () => {
    sw.removeEventListener('controllerchange', onControllerChange)
    host.page.removeEventListener('visibilitychange', onVisible)
    host.page.removeEventListener('online', check)
    clearInterval(timer)
  }
}

/** The browser as an UpdateHost: `online` arrives on window, `visibilitychange` on document. */
function browserHost(): UpdateHost {
  const page: EventTarget = {
    addEventListener: (type: string, listener: EventListener) => (type === 'online' ? window : document).addEventListener(type, listener),
    removeEventListener: (type: string, listener: EventListener) =>
      (type === 'online' ? window : document).removeEventListener(type, listener),
    dispatchEvent: () => false,
  }
  return {
    serviceWorker: 'serviceWorker' in navigator ? navigator.serviceWorker : undefined,
    page,
    get onLine() {
      return navigator.onLine
    },
    get visibilityState() {
      return document.visibilityState
    },
  }
}

/** Loads the new version. Everything is saved on every tap, so nothing is lost. */
const reload = () => location.reload()

/** True once a new version is ready, and `update` to load it. */
export function useUpdate() {
  const [ready, setReady] = useState(false)
  useEffect(() => watchForUpdates(browserHost(), () => setReady(true)), [])
  return { ready, update: reload }
}
