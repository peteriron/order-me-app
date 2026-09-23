import { expect, test, type Page } from '@playwright/test'

type Point = { x: number; y: number }

/** Drags one finger from `from` to `to` using real touch input, so the browser's own scroll and tap handling take part. */
async function touchDrag(page: Page, from: Point, to: Point, { steps = 12, durationMs = 240 } = {}) {
  const cdp = await page.context().newCDPSession(page)
  const at = (p: Point) => [{ x: p.x, y: p.y }]
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: at(from) })
  for (let i = 1; i <= steps; i++) {
    await page.waitForTimeout(durationMs / steps)
    const p = { x: from.x + ((to.x - from.x) * i) / steps, y: from.y + ((to.y - from.y) * i) / steps }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: at(p) })
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await cdp.detach()
}

const width = (page: Page) => page.viewportSize()!.width
const middle = (page: Page) => ({ x: width(page) / 2, y: page.viewportSize()!.height / 2 })

/** Asserts which page is on screen: its heading is visible and the footer marks it as current. */
async function expectOnPage(page: Page, heading: string, footerLabel: string) {
  await expect(page.getByRole('heading', { name: heading, level: 1, includeHidden: true })).toBeInViewport({ ratio: 1 })
  await expect(page.getByRole('navigation', { name: 'Pages' }).getByRole('button', { name: footerLabel })).toHaveAttribute(
    'aria-current',
    'page',
  )
}

test.beforeEach(async ({ page }) => {
  await page.goto('./')
})

test('opens on the Round page', async ({ page }) => {
  await expectOnPage(page, 'This round is for me', 'Round')
})

test('swiping right from Round shows History, swiping left shows Items', async ({ page }) => {
  const { x, y } = middle(page)
  await touchDrag(page, { x: 40, y }, { x: width(page) - 40, y })
  await expectOnPage(page, 'History', 'History')

  await touchDrag(page, { x: width(page) - 40, y }, { x: 40, y })
  await expectOnPage(page, 'This round is for me', 'Round')

  await touchDrag(page, { x: x + 150, y }, { x: x - 150, y })
  await expectOnPage(page, 'Items', 'Items')
})

test('a quick flick changes page even when it is short', async ({ page }) => {
  const { x, y } = middle(page)
  await touchDrag(page, { x: x + 30, y }, { x: x - 40, y }, { steps: 4, durationMs: 40 })
  await expectOnPage(page, 'Items', 'Items')
})

test('a short, slow drag snaps back to the same page', async ({ page }) => {
  const { x, y } = middle(page)
  await touchDrag(page, { x, y }, { x: x - 60, y }, { steps: 12, durationMs: 700 })
  await expectOnPage(page, 'This round is for me', 'Round')
})

test('there is no page beyond History or Items', async ({ page }) => {
  const { y } = middle(page)
  await touchDrag(page, { x: width(page) - 40, y }, { x: 40, y })
  await expectOnPage(page, 'Items', 'Items')
  await touchDrag(page, { x: width(page) - 40, y }, { x: 40, y })
  await expectOnPage(page, 'Items', 'Items')
})

test('a slightly sideways tap on a tile adds it and stays on Round', async ({ page }) => {
  const box = (await page.getByRole('button', { name: /^Duvel/ }).boundingBox())!
  const start = { x: box.x + box.width / 2, y: box.y + box.height / 2 }
  await touchDrag(page, start, { x: start.x + 8, y: start.y + 3 }, { steps: 2, durationMs: 60 })

  await expect(page.getByRole('button', { name: 'Duvel, 1 in round' })).toBeVisible()
  await expectOnPage(page, 'This round is for me', 'Round')
})

test('scrolling the grid vertically never changes page', async ({ page }) => {
  const { x, y } = middle(page)
  await touchDrag(page, { x, y: y + 200 }, { x: x - 30, y: y - 200 }, { steps: 16, durationMs: 400 })
  // The Round page scrolled down to Snacks (so its title is off the top) and no page change happened.
  await expect(page.getByRole('heading', { name: 'Snacks' })).toBeInViewport()
  await expect(page.getByRole('navigation', { name: 'Pages' }).getByRole('button', { name: 'Round' })).toHaveAttribute(
    'aria-current',
    'page',
  )
})

test('footer labels navigate between pages', async ({ page }) => {
  const footer = page.getByRole('navigation', { name: 'Pages' })
  await footer.getByRole('button', { name: 'History' }).tap()
  await expectOnPage(page, 'History', 'History')
  await footer.getByRole('button', { name: 'Items' }).tap()
  await expectOnPage(page, 'Items', 'Items')
  await footer.getByRole('button', { name: 'Round' }).tap()
  await expectOnPage(page, 'This round is for me', 'Round')
})

test('pages that are off screen are hidden from assistive tech', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'History', level: 1 })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Items', level: 1 })).toHaveCount(0)
})

test('pages stay aligned when something off screen is scrolled into view', async ({ page }) => {
  // Focus moves, screen readers and find-in-page all scroll things into view; that must never shift the pager.
  // The Items page sits to the right of Round, so it is the one the browser *can* scroll towards.
  await page.evaluate(() => document.querySelectorAll('.pager-page')[2].querySelector('h1')!.scrollIntoView())
  await expectOnPage(page, 'This round is for me', 'Round')

  await page.getByRole('navigation', { name: 'Pages' }).getByRole('button', { name: 'History' }).tap()
  await expectOnPage(page, 'History', 'History')
})
