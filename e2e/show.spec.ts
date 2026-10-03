import { expect, test, type Page } from '@playwright/test'
import { touchDrag } from './touch.ts'

async function tapTiles(page: Page, ...names: string[]) {
  for (const name of names) await page.getByRole('button', { name: new RegExp(`^${name}(,|$)`) }).tap()
}

const showPage = (page: Page) => page.getByRole('region', { name: 'Round for the counter' })
const roundBar = (page: Page) => page.getByRole('region', { name: 'Round total' })
const footerTab = (page: Page, name: string) => page.getByRole('navigation', { name: 'Pages' }).getByRole('button', { name })
const showHeading = (page: Page) => showPage(page).getByRole('heading', { name: 'Round for the counter', level: 1 })

/** The Round bar's Show button slides to the Show page. */
async function openShowPage(page: Page) {
  await roundBar(page).getByRole('button', { name: 'Show' }).tap()
  await expect(showHeading(page)).toBeInViewport({ ratio: 1 })
}

/** On the Round page, settled: the Round bar is fully on screen (the page itself may be scrolled). */
async function expectOnRoundPage(page: Page) {
  await expect(footerTab(page, 'Round')).toHaveAttribute('aria-current', 'page')
  await expect(roundBar(page)).toBeInViewport({ ratio: 1 })
}

test.beforeEach(async ({ page }) => {
  await page.goto('./')
})

test('Show slides to the Show page: drinks then snacks in grid order, with the total', async ({ page }) => {
  await tapTiles(page, 'Duvel', 'Duvel', 'Chips', 'Cola')
  await openShowPage(page)

  await expect(footerTab(page, 'Show')).toHaveAttribute('aria-current', 'page')
  await expect(showPage(page).getByRole('listitem')).toHaveText([/^1\s*×\s*🥤\s*Cola/, /^2\s*×\s*🍺\s*Duvel/, /^1\s*×\s*🥔\s*Chips/])
  await expect(showPage(page).getByRole('heading', { name: 'Snacks' })).toBeVisible()
  await expect(showPage(page).getByTestId('counter-total')).toHaveText('4')
})

test('Show is a swipe page between Round and Items, with the Round bar but no Back to Round', async ({ page }) => {
  await tapTiles(page, 'Duvel')
  const { width, height } = page.viewportSize()!
  await touchDrag(page, { x: width - 40, y: height / 2 }, { x: 40, y: height / 2 })
  await expect(footerTab(page, 'Show')).toHaveAttribute('aria-current', 'page')
  await expect(showHeading(page)).toBeInViewport({ ratio: 1 })
  await expect(showPage(page).getByRole('listitem')).toHaveText([/^1\s*×\s*🍺\s*Duvel/])

  await expect(showPage(page).getByRole('region', { name: 'Round total' })).toContainText('1 item')
  await expect(showPage(page).getByRole('button', { name: 'Back to Round' })).toHaveCount(0)
  // Two share buttons on the title line: Text and QR.
  await expect(showPage(page).getByRole('button', { name: 'Share as text' })).toHaveText('Text')
  await expect(showPage(page).getByRole('button', { name: 'Share as QR code' })).toHaveText('QR')

  await touchDrag(page, { x: 40, y: height / 2 }, { x: width - 40, y: height / 2 })
  await expectOnRoundPage(page)
  await expect(roundBar(page)).toContainText('1 item')
})

test('with an empty Round the Show page says so and leads back to Round', async ({ page }) => {
  await footerTab(page, 'Show').tap()
  await expect(showPage(page)).toContainText('Nothing in this Round yet. Tap drinks on the Round page.')
  await expect(showPage(page).getByRole('button', { name: 'Ordered' })).toHaveCount(0)
  await expect(showPage(page).getByRole('button', { name: /^Share/ })).toHaveCount(0)

  await showPage(page).getByRole('button', { name: 'Back to Round' }).tap()
  await expectOnRoundPage(page)
})

test('−/+ on a line adjust the Round, and removing the last Item shows the empty state', async ({ page }) => {
  await tapTiles(page, 'Duvel', 'Cola')
  await openShowPage(page)

  await showPage(page).getByRole('button', { name: 'Add one Duvel' }).tap()
  await showPage(page).getByRole('button', { name: 'Remove one Cola' }).tap()
  await expect(showPage(page).getByRole('listitem')).toHaveText([/^2\s*×\s*🍺\s*Duvel/])
  await expect(showPage(page).getByTestId('counter-total')).toHaveText('2')

  await showPage(page).getByRole('button', { name: 'Remove one Duvel' }).tap()
  await showPage(page).getByRole('button', { name: 'Remove one Duvel' }).tap()
  await expect(showPage(page)).toContainText('Nothing in this Round yet.')
  await expect(footerTab(page, 'Show')).toHaveAttribute('aria-current', 'page')
})

test('Ordered empties the Round, slides back to Round, and Undo brings it back', async ({ page }) => {
  await tapTiles(page, 'Duvel', 'Duvel', 'Chips')
  await openShowPage(page)
  await showPage(page).getByRole('button', { name: 'Ordered' }).tap()

  await expectOnRoundPage(page)
  await expect(roundBar(page)).toContainText('Tap a drink to start')
  const toast = page.getByRole('status').filter({ hasText: 'Round placed' })
  await expect(toast).toBeVisible()

  await toast.getByRole('button', { name: 'Undo' }).tap()
  await expect(toast).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Duvel, 2 in round' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Chips, 1 in round' })).toBeVisible()
})

test('Clear on the Show bar empties the Round and stays on Show; Undo brings it back', async ({ page }) => {
  await tapTiles(page, 'Duvel', 'Duvel', 'Cola')
  await openShowPage(page)
  const bar = showPage(page).getByRole('region', { name: 'Round total' })
  await expect(bar).toContainText('3 items')
  await expect(bar.getByRole('button', { name: 'Ordered' })).toBeVisible()

  await bar.getByRole('button', { name: 'Clear' }).tap()
  await expect(footerTab(page, 'Show')).toHaveAttribute('aria-current', 'page')
  await expect(showPage(page)).toContainText('Nothing in this Round yet.')
  // No bar while the Round is empty: the empty state says it all.
  await expect(showPage(page).getByRole('region', { name: 'Round total' })).toHaveCount(0)

  await page.getByRole('status').filter({ hasText: 'Round cleared' }).getByRole('button', { name: 'Undo' }).tap()
  await expect(showPage(page).getByRole('listitem')).toHaveText([/^1\s*×\s*🥤\s*Cola/, /^2\s*×\s*🍺\s*Duvel/])
})

test('Clear on the Round page has the same Undo', async ({ page }) => {
  await tapTiles(page, 'Duvel', 'Duvel')
  await roundBar(page).getByRole('button', { name: 'Clear' }).tap()
  await expect(roundBar(page)).toContainText('Tap a drink to start')
  await page.getByRole('status').filter({ hasText: 'Round cleared' }).getByRole('button', { name: 'Undo' }).tap()
  await expect(page.getByRole('button', { name: 'Duvel, 2 in round' })).toBeVisible()
})

test('the Undo toast goes away after 5 seconds', async ({ page }) => {
  await page.clock.install()
  await page.goto('./')
  await tapTiles(page, 'Duvel')
  await openShowPage(page)
  await showPage(page).getByRole('button', { name: 'Ordered' }).tap()

  const toast = page.getByRole('status').filter({ hasText: 'Round placed' })
  await expect(toast).toBeVisible()
  await page.clock.fastForward(4_000)
  await expect(toast).toBeVisible()
  await page.clock.fastForward(1_100)
  await expect(toast).toHaveCount(0)
})

test('long names fit their line instead of breaking mid-word', async ({ page }) => {
  await tapTiles(page, 'Bitterballen', 'Sparkling water')
  await openShowPage(page)

  const overflowing = await showPage(page)
    .locator('.counter-what')
    .evaluateAll((els) => els.filter((el) => el.scrollWidth > el.clientWidth).map((el) => el.textContent))
  expect(overflowing).toEqual([])
  // Still one piece: the name wasn't split across lines inside a word.
  const bitterballen = showPage(page).getByRole('listitem').filter({ hasText: 'Bitterballen' }).locator('.counter-what')
  const lineHeight = await bitterballen.evaluate((el) => parseFloat(getComputedStyle(el).lineHeight))
  expect((await bitterballen.boundingBox())!.height).toBeLessThan(lineHeight * 1.5)
})
