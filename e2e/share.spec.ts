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
 * `share` is the share sheet's behaviour: 'ok', 'cancel', 'fail' (any other error), or 'none' (no share sheet at all).
 * `clipboard` is whether the clipboard works: 'ok', or 'fail' (the write rejects).
 */
async function fakePhone(page: Page, share: 'ok' | 'cancel' | 'fail' | 'none', clipboard: 'ok' | 'fail' = 'ok') {
  await page.addInitScript(
    ({ share, clipboard }) => {
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
                if (share === 'fail') throw new DOMException('Share failed', 'NotAllowedError')
                window.shared.push(text)
              },
      })
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          writeText: async (text: string) => {
            if (clipboard === 'fail') throw new DOMException('Write failed', 'NotAllowedError')
            window.copied.push(text)
          },
        },
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
    },
    { share, clipboard },
  )
}

const showPage = (page: Page) => page.getByRole('region', { name: 'Round for the counter' })

async function composeAndShow(page: Page) {
  for (const name of ['Duvel', 'Duvel', 'Chips', 'Cola']) {
    await page.getByRole('button', { name: new RegExp(`^${name}(,|$)`) }).tap()
  }
  await page.getByRole('region', { name: 'Round total' }).getByRole('button', { name: 'Show' }).tap()
  await expect(showPage(page).getByRole('listitem').first()).toBeInViewport()
}

test('Share as text sends the Round as plain text through the share sheet', async ({ page }) => {
  await fakePhone(page, 'ok')
  await page.goto('./')
  await composeAndShow(page)
  // The Text button shares straight away: no sheet in between.
  await showPage(page).getByRole('button', { name: 'Share as text' }).tap()
  await expect(page.getByRole('dialog')).toHaveCount(0)

  await expect.poll(() => page.evaluate(() => window.shared)).toEqual(['1× Cola\n2× Duvel\n1× Chips\nTotal: 4'])
  expect(await page.evaluate(() => window.copied)).toEqual([])
  await expect(page.getByRole('status')).toHaveCount(0)
})

test('without a share sheet, Share as text copies the text and says so', async ({ page }) => {
  await fakePhone(page, 'none')
  await page.goto('./')
  await composeAndShow(page)
  // The Text button shares straight away: no sheet in between.
  await showPage(page).getByRole('button', { name: 'Share as text' }).tap()
  await expect(page.getByRole('dialog')).toHaveCount(0)

  await expect(page.getByRole('status')).toHaveText('Copied to clipboard')
  expect(await page.evaluate(() => window.copied)).toEqual(['1× Cola\n2× Duvel\n1× Chips\nTotal: 4'])
})

test('cancelling the share sheet copies nothing and says nothing', async ({ page }) => {
  await fakePhone(page, 'cancel')
  await page.goto('./')
  await composeAndShow(page)
  await showPage(page).getByRole('button', { name: 'Share as text' }).tap()

  // Closing the sheet is the Operator's choice, not a failure: no copy, no toast.
  await expect(page.getByRole('status')).toHaveCount(0)
  expect(await page.evaluate(() => window.copied)).toEqual([])
})

test('when neither the share sheet nor the clipboard works, Share as text says it failed', async ({ page }) => {
  // The share sheet fails for a real reason (not a cancel), and the clipboard write rejects too.
  await fakePhone(page, 'fail', 'fail')
  await page.goto('./')
  await composeAndShow(page)
  await showPage(page).getByRole('button', { name: 'Share as text' }).tap()

  await expect(page.getByRole('status')).toHaveText('Couldn’t copy')
})

test('with no share sheet and a broken clipboard, Share as text says it failed', async ({ page }) => {
  await fakePhone(page, 'none', 'fail')
  await page.goto('./')
  await composeAndShow(page)
  await showPage(page).getByRole('button', { name: 'Share as text' }).tap()

  await expect(page.getByRole('status')).toHaveText('Couldn’t copy')
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
