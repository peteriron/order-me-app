import { expect, type Page } from '@playwright/test'

/** Waits until the service worker has installed and controls this page. */
export async function waitForServiceWorker(page: Page) {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
    if (!navigator.serviceWorker.controller) {
      await new Promise((resolve) => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }))
    }
  })
}

/**
 * The app sets the title from an effect; waiting for it means the mount save has run, so a write straight into
 * localStorage won't be overwritten by it (WebKit exposed that race; Chromium usually won it by timing).
 */
export async function waitForMounted(page: Page) {
  await expect(page).toHaveTitle('This round is on me')
}

/** A Round to seed into History: `daysAgo` days back at `time` (default 21:00), with [name, count] lines. */
export interface SeedRound {
  daysAgo: number
  time?: [hour: number, minute: number]
  /** [catalog Item name, count, optional name as it was when placed] */
  lines: [string, number, string?][]
}

/** Writes placed Rounds straight into the saved app state (dates relative to the browser's today), then reloads. */
export async function seedHistory(page: Page, rounds: SeedRound[]) {
  await waitForMounted(page)
  await page.evaluate((rounds) => {
    const state = JSON.parse(localStorage.getItem('order-me')!)
    const byName = (name: string) => state.catalog.find((i: { name: string }) => i.name === name)
    state.history = rounds.map((r, n) => {
      const placedAt = new Date()
      placedAt.setDate(placedAt.getDate() - r.daysAgo)
      const [hour, minute] = r.time ?? [21, 0]
      placedAt.setHours(hour, minute, 0, 0)
      return {
        id: `seed-${n}`,
        placedAt: placedAt.toISOString(),
        lines: r.lines.map(([name, count, nameThen]) => {
          const item = byName(name)
          return { itemId: item.id, name: nameThen ?? item.name, category: item.category, emoji: item.emoji, count }
        }),
      }
    })
    localStorage.setItem('order-me', JSON.stringify(state))
  }, rounds)
  await page.reload()
  await waitForMounted(page)
}
