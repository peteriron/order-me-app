import { expect, test, type Page } from '@playwright/test'
import { touchDrag } from './touch.ts'

const items = (page: Page) => page.getByRole('region', { name: 'Items' })
const drinks = (page: Page) => items(page).getByRole('region', { name: 'Drinks' })
const row = (page: Page, name: string) => drinks(page).locator('.item-row', { has: page.getByRole('button', { name: `Edit ${name}`, exact: true }) })
const listedDrinks = (page: Page) => drinks(page).getByRole('button', { name: /^Edit / })
const tab = (page: Page, name: string) => page.getByRole('navigation').getByRole('button', { name })

/** Drags one finger across a row, from its right part towards its left (or the other way). */
async function swipeRow(page: Page, name: string, direction: 'left' | 'right', distance = 140) {
  const box = (await row(page, name).boundingBox())!
  const y = box.y + box.height / 2
  const right = box.x + box.width - 60
  const from = direction === 'left' ? right : right - distance
  await touchDrag(page, { x: from, y }, { x: direction === 'left' ? from - distance : from + distance, y })
  // Chromium on Linux (CI) drops a tap that lands within moments of a touch drag ending (see pins.spec.ts); a person
  // pauses before tapping on anyway.
  await page.waitForTimeout(800)
}

test.beforeEach(async ({ page }) => {
  await page.goto('./')
  await tab(page, 'Settings').tap()
  await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeInViewport({ ratio: 1 })
})

test('swiping a row left reveals a red delete button; tapping it deletes at once, and Undo puts it back in place', async ({ page }) => {
  await expect(listedDrinks(page).nth(2)).toHaveText(/Still water/)
  await swipeRow(page, 'Still water', 'left')
  const deleteButton = drinks(page).getByRole('button', { name: 'Delete Still water' })
  await expect(deleteButton).toBeVisible()
  // Still on Settings: the swipe was the row's, not the page's.
  await expect(tab(page, 'Settings')).toHaveAttribute('aria-current', 'page')

  await deleteButton.tap()
  await expect(drinks(page).getByRole('button', { name: 'Edit Still water' })).toHaveCount(0)
  await expect(page.getByRole('alertdialog')).toHaveCount(0)
  await page.getByRole('status').filter({ hasText: 'Still water deleted' }).getByRole('button', { name: 'Undo' }).tap()
  await expect(listedDrinks(page).nth(2)).toHaveText(/Still water/)
})

test('swiping an open row back, or tapping elsewhere, closes it without deleting or opening anything', async ({ page }) => {
  await swipeRow(page, 'Cola', 'left')
  await expect(drinks(page).getByRole('button', { name: 'Delete Cola' })).toBeVisible()
  await swipeRow(page, 'Cola', 'right')
  await expect(drinks(page).getByRole('button', { name: 'Delete Cola' })).toHaveCount(0)
  await expect(tab(page, 'Settings')).toHaveAttribute('aria-current', 'page')

  await swipeRow(page, 'Cola', 'left')
  await expect(drinks(page).getByRole('button', { name: 'Delete Cola' })).toBeVisible()
  await drinks(page).getByRole('button', { name: 'Edit Fanta' }).tap()
  await expect(drinks(page).getByRole('button', { name: 'Delete Cola' })).toHaveCount(0)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(drinks(page).getByRole('button', { name: 'Edit Cola', exact: true })).toBeVisible()
})

test('a left-to-right swipe on a closed row still goes back to Show', async ({ page }) => {
  await swipeRow(page, 'Cola', 'right', 200)
  await expect(tab(page, 'Show')).toHaveAttribute('aria-current', 'page')
})

test('a pinned row’s drag handle still reorders and never reveals delete', async ({ page }) => {
  for (const name of ['Lager', 'Duvel']) await drinks(page).getByRole('button', { name: `Pin ${name}`, exact: true }).tap()
  const handle = row(page, 'Duvel').locator('.item-row-handle')
  const from = (await handle.boundingBox())!
  const top = (await row(page, 'Lager').boundingBox())!
  // Up to the first pinned row, drifting left on the way.
  await touchDrag(page, { x: from.x + from.width / 2, y: from.y + from.height / 2 }, { x: from.x - 30, y: top.y + 8 }, { steps: 16, durationMs: 400 })
  await expect(listedDrinks(page).nth(0)).toHaveText(/Duvel/)
  await expect(drinks(page).getByRole('button', { name: /^Delete / })).toHaveCount(0)
})
