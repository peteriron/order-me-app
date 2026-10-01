import { describe, expect, it } from 'vitest'
import { resetApp, type ResetHost } from './reset.ts'

const APP = 'https://peteriron.github.io/order-me-app/'

/** A browser on the shared peteriron.github.io origin, where another Pages project also keeps caches and a worker. */
function fakeBrowser({ online }: { online: boolean }) {
  const log: string[] = []
  const cacheNames = [`workbox-precache-v2-${APP}`, 'workbox-precache-v2-https://peteriron.github.io/other-project/']
  const registration = (scope: string) => ({ scope, unregister: async () => (log.push(`unregister ${scope}`), true) })
  const host: ResetHost = {
    fetch: async (url) => {
      log.push(`fetch ${url}`)
      if (!online) throw new TypeError('Failed to fetch')
      return { ok: true }
    },
    caches: { keys: async () => cacheNames, delete: async (name) => (log.push(`delete cache ${name}`), true) },
    serviceWorker: {
      getRegistrations: async () => [registration(APP), registration('https://peteriron.github.io/other-project/')],
    },
    forgetAppState: () => log.push('forget state'),
    reload: (url) => log.push(`reload ${url}`),
  }
  return { host, log }
}

describe('resetting the app', () => {
  it('checks the connection first, then drops this app’s worker, caches and state, and reloads the newest version', async () => {
    const { host, log } = fakeBrowser({ online: true })
    expect(await resetApp(host, APP)).toBe('reset')
    expect(log[0]).toMatch(/^fetch https:\/\/peteriron\.github\.io\/order-me-app\/\?reset-check=\d+$/)
    expect(log.slice(1)).toEqual([
      `unregister ${APP}`,
      `delete cache workbox-precache-v2-${APP}`,
      'forget state',
      `reload ${APP}`,
    ])
  })

  it('leaves other projects on the same origin alone', async () => {
    const { host, log } = fakeBrowser({ online: true })
    await resetApp(host, APP)
    expect(log.join('\n')).not.toContain('other-project')
  })

  it('does nothing at all when offline, so the app is never left without its offline copy', async () => {
    const { host, log } = fakeBrowser({ online: false })
    expect(await resetApp(host, APP)).toBe('offline')
    expect(log).toHaveLength(1) // only the connection check
  })

  it('still resets the data and reloads in a browser without service workers or Cache Storage', async () => {
    const { host, log } = fakeBrowser({ online: true })
    expect(await resetApp({ ...host, caches: undefined, serviceWorker: undefined }, APP)).toBe('reset')
    expect(log.slice(1)).toEqual(['forget state', `reload ${APP}`])
  })
})
