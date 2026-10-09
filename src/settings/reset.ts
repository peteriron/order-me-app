/**
 * The slice of the browser that a reset needs; the real one is wired in `browserResetHost`. GitHub Pages serves
 * every project of an account from one origin, which shares storage, Cache Storage and service workers, so a reset
 * only ever touches what belongs to this app's scope (its address).
 */
export interface ResetHost {
  fetch(url: string, init: RequestInit): Promise<{ ok: boolean }>
  caches?: { keys(): Promise<string[]>; delete(name: string): Promise<boolean> }
  serviceWorker?: { getRegistrations(): Promise<readonly { scope: string; unregister(): Promise<boolean> }[]> }
  forgetAppState(): void
  reload(url: string): void
}

/**
 * Resets the app to a first install: no saved Items, pins, Round, History or settings, and no offline copy, then
 * reloads the newest version from the server. Only when the server can be reached: without a connection the
 * offline copy is all there is, and dropping it would leave nothing to load.
 */
export async function resetApp(host: ResetHost, appUrl: string): Promise<'reset' | 'offline'> {
  try {
    // A query the precache doesn't know, and no HTTP cache: only a real answer from the server counts.
    // A hanging connection must not leave the Operator with no answer at all.
    const response = await host.fetch(`${appUrl}?reset-check=${Date.now()}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    })
    if (!response.ok) return 'offline'
  } catch {
    return 'offline'
  }

  try {
    const registrations = (await host.serviceWorker?.getRegistrations()) ?? []
    await Promise.all(registrations.filter((r) => r.scope === appUrl).map((r) => r.unregister()))
    // Workbox names its caches after the scope, e.g. "workbox-precache-v2-https://…/order-me-app/".
    const names = (await host.caches?.keys()) ?? []
    await Promise.all(names.filter((name) => name.endsWith(appUrl)).map((name) => host.caches!.delete(name)))
  } catch {
    // Worst case the old offline copy lingers until the next update; the reset itself still happens.
  }
  host.forgetAppState()
  host.reload(appUrl)
  return 'reset'
}
