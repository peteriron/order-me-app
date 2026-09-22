import { expect, test, type Page } from '@playwright/test'

async function tapTiles(page: Page, ...names: string[]) {
  for (const name of names) await page.getByRole('button', { name: new RegExp(`^${name}`) }).tap()
}

const counterView = (page: Page) => page.getByRole('dialog', { name: 'Round for the counter' })
const roundBar = (page: Page) => page.getByRole('region', { name: 'Round total' })

async function openCounterView(page: Page) {
  await roundBar(page).getByRole('button', { name: 'Show' }).tap()
  await expect(counterView(page)).toBeVisible()
}

test.beforeEach(async ({ page }) => {
  await page.goto('./')
})

test('Show opens the Counter view: drinks then snacks in grid order, with the total', async ({ page }) => {
  await tapTiles(page, 'Duvel', 'Duvel', 'Chips', 'Cola')
  await openCounterView(page)

  await expect(counterView(page).getByRole('listitem')).toHaveText([/^1\s*×\s*🥤\s*Cola/, /^2\s*×\s*🍺\s*Duvel/, /^1\s*×\s*🥔\s*Chips/])
  await expect(counterView(page).getByRole('heading', { name: 'Snacks' })).toBeVisible()
  await expect(counterView(page).getByTestId('counter-total')).toHaveText('4')
})

test('Back returns to the grid without changing the Round', async ({ page }) => {
  await tapTiles(page, 'Duvel', 'Duvel')
  await openCounterView(page)
  await counterView(page).getByRole('button', { name: 'Back to Round' }).tap()

  await expect(counterView(page)).toHaveCount(0)
  await expect(roundBar(page)).toContainText('2 items')
})

test('−/+ on a line adjust the Round, and a line at zero disappears', async ({ page }) => {
  await tapTiles(page, 'Duvel', 'Cola')
  await openCounterView(page)

  await counterView(page).getByRole('button', { name: 'Add one Duvel' }).tap()
  await counterView(page).getByRole('button', { name: 'Remove one Cola' }).tap()

  await expect(counterView(page).getByRole('listitem')).toHaveText([/^2\s*×\s*🍺\s*Duvel/])
  await expect(counterView(page).getByTestId('counter-total')).toHaveText('2')
})

test('removing the last Item closes the Counter view', async ({ page }) => {
  await tapTiles(page, 'Duvel')
  await openCounterView(page)
  await counterView(page).getByRole('button', { name: 'Remove one Duvel' }).tap()

  await expect(counterView(page)).toHaveCount(0)
  await expect(roundBar(page)).toContainText('Tap a drink to start')
})

test('Clear in the Counter view empties the Round and closes it', async ({ page }) => {
  await tapTiles(page, 'Duvel', 'Cola')
  await openCounterView(page)
  await counterView(page).getByRole('button', { name: 'Clear' }).tap()

  await expect(counterView(page)).toHaveCount(0)
  await expect(roundBar(page)).toContainText('Tap a drink to start')
})

test('Mark as ordered empties the Round, and Undo brings it back', async ({ page }) => {
  await tapTiles(page, 'Duvel', 'Duvel', 'Chips')
  await openCounterView(page)
  await counterView(page).getByRole('button', { name: 'Mark as ordered' }).tap()

  await expect(counterView(page)).toHaveCount(0)
  await expect(roundBar(page)).toContainText('Tap a drink to start')
  const toast = page.getByRole('status').filter({ hasText: 'Round placed' })
  await expect(toast).toBeVisible()

  await toast.getByRole('button', { name: 'Undo' }).tap()
  await expect(toast).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Duvel, 2 in round' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Chips, 1 in round' })).toBeVisible()
})

test('a placed Round stays placed after a reload', async ({ page }) => {
  await tapTiles(page, 'Duvel')
  await openCounterView(page)
  await counterView(page).getByRole('button', { name: 'Mark as ordered' }).tap()
  await expect(roundBar(page)).toContainText('Tap a drink to start')

  await page.reload()
  await expect(roundBar(page)).toContainText('Tap a drink to start')
})

test('the Undo toast goes away after 5 seconds', async ({ page }) => {
  await page.clock.install()
  await page.goto('./')
  await tapTiles(page, 'Duvel')
  await openCounterView(page)
  await counterView(page).getByRole('button', { name: 'Mark as ordered' }).tap()

  const toast = page.getByRole('status').filter({ hasText: 'Round placed' })
  await expect(toast).toBeVisible()
  await page.clock.fastForward(4_000)
  await expect(toast).toBeVisible()
  await page.clock.fastForward(1_100)
  await expect(toast).toHaveCount(0)
})

test('long names fit their line instead of breaking mid-word', async ({ page }) => {
  await tapTiles(page, 'Bitterballen', 'Sparkling water')
  await openCounterView(page)

  const overflowing = await counterView(page)
    .locator('.counter-what')
    .evaluateAll((els) => els.filter((el) => el.scrollWidth > el.clientWidth).map((el) => el.textContent))
  expect(overflowing).toEqual([])
  // Still one piece: the name wasn't split across lines inside a word.
  const bitterballen = counterView(page).getByRole('listitem').filter({ hasText: 'Bitterballen' }).locator('.counter-what')
  const lineHeight = await bitterballen.evaluate((el) => parseFloat(getComputedStyle(el).lineHeight))
  expect((await bitterballen.boundingBox())!.height).toBeLessThan(lineHeight * 1.5)
})
