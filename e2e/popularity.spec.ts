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

test('most ordered first; tiles hold still while composing, and reorder on place and on Undo', async ({ page }) => {
  await seedHistory(page, [
    { daysAgo: 1, items: ['Rosé wine'] },
    { daysAgo: 2, items: ['Rosé wine'] },
    { daysAgo: 3, items: ['Mint tea'] },
    // Too old to count.
    { daysAgo: 120, items: ['Red wine', 'Red wine'] },
  ])
  expect(await firstDrinks(page)).toEqual(['Rosé wine', 'Mint tea', 'Cola', 'Cola Zero'])

  for (let n = 0; n < 3; n++) await page.getByRole('button', { name: /^Mint tea(,|$)/ }).tap()
  expect(await firstDrinks(page)).toEqual(['Rosé wine', 'Mint tea', 'Cola', 'Cola Zero'])

  await page.getByRole('region', { name: 'Round total' }).getByRole('button', { name: 'Show' }).tap()
  await counterView(page).getByRole('button', { name: 'Mark as ordered' }).tap()
  // Mint tea and Rosé wine now tie on two Rounds each, so the Catalog order decides: Mint tea is listed first.
  await expect.poll(() => firstDrinks(page)).toEqual(['Mint tea', 'Rosé wine', 'Cola', 'Cola Zero'])

  await page.getByRole('status').getByRole('button', { name: 'Undo' }).tap()
  await expect.poll(() => firstDrinks(page)).toEqual(['Rosé wine', 'Mint tea', 'Cola', 'Cola Zero'])
})
