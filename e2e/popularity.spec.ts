import { expect, test, type Page } from '@playwright/test'

/** Writes placed Rounds (each a list of catalog Item names, placed `daysAgo`) into the saved app state, then reloads. */
async function seedHistory(page: Page, rounds: { daysAgo: number; items: string[] }[]) {
  await page.evaluate((rounds) => {
    const state = JSON.parse(localStorage.getItem('order-me')!)
    state.history = rounds.map((r, n) => ({
      id: `seed-${n}`,
      placedAt: new Date(Date.now() - r.daysAgo * 86_400_000).toISOString(),
      lines: r.items.map((name) => {
        const item = state.catalog.find((i: { name: string }) => i.name === name)
        return { itemId: item.id, name: item.name, category: item.category, emoji: item.emoji, count: 1 }
      }),
    }))
    localStorage.setItem('order-me', JSON.stringify(state))
  }, rounds)
  await page.reload()
}

const firstDrinks = (page: Page) =>
  page
    // The Round page's Drinks section (the Items page has one too).
    .locator('section[aria-labelledby="round-heading-drink"]')
    .locator('.tile-name')
    .allTextContents()
    .then((names) => names.slice(0, 4))

const counterView = (page: Page) => page.getByRole('dialog', { name: 'Round for the counter' })

test.beforeEach(async ({ page }) => {
  await page.goto('./')
})

test('before anything is placed, drinks are A–Z', async ({ page }) => {
  expect(await firstDrinks(page)).toEqual(['0.0 Beer', 'Beer', 'Cava', 'Coffee'])
})

test('the drinks ordered most over the last 90 days come first', async ({ page }) => {
  await seedHistory(page, [
    { daysAgo: 1, items: ['Tea', 'Chips'] },
    { daysAgo: 2, items: ['Tea'] },
    { daysAgo: 3, items: ['Rosé'] },
    { daysAgo: 120, items: ['Red wine', 'Red wine'] },
  ])
  expect(await firstDrinks(page)).toEqual(['Tea', 'Rosé', '0.0 Beer', 'Beer'])
})

test('tiles hold still while composing, and reorder once the Round is placed and again on Undo', async ({ page }) => {
  await seedHistory(page, [
    { daysAgo: 1, items: ['Tea'] },
    { daysAgo: 2, items: ['Tea'] },
    { daysAgo: 3, items: ['Rosé'] },
  ])

  for (let n = 0; n < 3; n++) await page.getByRole('button', { name: /^Rosé/ }).tap()
  expect(await firstDrinks(page)).toEqual(['Tea', 'Rosé', '0.0 Beer', 'Beer'])

  await page.getByRole('region', { name: 'Round total' }).getByRole('button', { name: 'Show' }).tap()
  await counterView(page).getByRole('button', { name: 'Mark as ordered' }).tap()
  // Rosé and Tea now tie on two Rounds each, so A–Z decides.
  await expect.poll(() => firstDrinks(page)).toEqual(['Rosé', 'Tea', '0.0 Beer', 'Beer'])

  await page.getByRole('status').getByRole('button', { name: 'Undo' }).tap()
  await expect.poll(() => firstDrinks(page)).toEqual(['Tea', 'Rosé', '0.0 Beer', 'Beer'])
})
