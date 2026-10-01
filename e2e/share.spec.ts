import { expect, test, type Page } from '@playwright/test'

declare global {
  interface Window {
    shared: string[]
    copied: string[]
    wakeLocks: { released: boolean }[]
  }
}

/**
 * Stands in for the phone: records what was shared or copied, and what wake locks were taken.
 * `share` is the share sheet's behaviour: 'ok', 'cancel', or 'none' (no share sheet at all).
 */
async function fakePhone(page: Page, share: 'ok' | 'cancel' | 'none') {
  await page.addInitScript((share) => {
    window.shared = []
    window.copied = []
    window.wakeLocks = []
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value:
        share === 'none'
          ? undefined
          : async ({ text }: { text: string }) => {
              if (share === 'cancel') throw new DOMException('Share canceled', 'AbortError')
              window.shared.push(text)
            },
    })
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async (text: string) => void window.copied.push(text) },
    })
    Object.defineProperty(navigator, 'wakeLock', {
      configurable: true,
      value: {
        request: async () => {
          const sentinel = { released: false, release: async () => void (sentinel.released = true) }
          window.wakeLocks.push(sentinel)
          return sentinel
        },
      },
    })
  }, share)
}

const showPage = (page: Page) => page.getByRole('region', { name: 'Round for the counter' })

async function composeAndShow(page: Page) {
  for (const name of ['Duvel', 'Duvel', 'Chips', 'Cola']) {
    await page.getByRole('button', { name: new RegExp(`^${name}(,|$)`) }).tap()
  }
  await page.getByRole('region', { name: 'Round total' }).getByRole('button', { name: 'Show' }).tap()
  await expect(showPage(page).getByRole('listitem').first()).toBeInViewport()
}

test('Share sends the Round as plain text through the share sheet', async ({ page }) => {
  await fakePhone(page, 'ok')
  await page.goto('./')
  await composeAndShow(page)
  await showPage(page).getByRole('button', { name: 'Share' }).tap()

  await expect.poll(() => page.evaluate(() => window.shared)).toEqual(['1× Cola\n2× Duvel\n1× Chips\nTotal: 4'])
  expect(await page.evaluate(() => window.copied)).toEqual([])
  await expect(page.getByRole('status')).toHaveCount(0)
})

test('without a share sheet, Share copies the text and says so', async ({ page }) => {
  await fakePhone(page, 'none')
  await page.goto('./')
  await composeAndShow(page)
  await showPage(page).getByRole('button', { name: 'Share' }).tap()

  await expect(page.getByRole('status')).toHaveText('Copied to clipboard')
  expect(await page.evaluate(() => window.copied)).toEqual(['1× Cola\n2× Duvel\n1× Chips\nTotal: 4'])
})

test('the screen stays awake while the Show page is on screen, and may sleep once you swipe away', async ({ page }) => {
  await fakePhone(page, 'ok')
  await page.goto('./')
  expect(await page.evaluate(() => window.wakeLocks.length)).toBe(0)

  await composeAndShow(page)
  await expect.poll(() => page.evaluate(() => window.wakeLocks)).toEqual([{ released: false }])

  await page.getByRole('navigation', { name: 'Pages' }).getByRole('button', { name: 'Round' }).tap()
  await expect.poll(() => page.evaluate(() => window.wakeLocks)).toEqual([{ released: true }])
})
