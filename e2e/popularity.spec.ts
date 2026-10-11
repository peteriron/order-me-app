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
        return { itemId: item.id, name: item.name, emoji: item.emoji, count: 1 }
      }),
    }))
    localStorage.setItem('order-me', JSON.stringify(state))
  }, rounds)
  await page.reload()
}

/** The first four tiles in the Round page's Soda box: Popularity orders the tiles within each box. */
const firstDrinks = (page: Page) =>
  page
    .getByRole('region', { name: 'Soda' })
    .locator('.tile-name')
    .allTextContents()
    .then((names) => names.slice(0, 4))

const showPage = (page: Page) => page.getByRole('region', { name: 'Round for the counter' })

const popularitySwitch = (page: Page) => page.getByRole('switch', { name: /Order by popularity/ })

async function turnOnPopularity(page: Page) {
  await page.getByRole('navigation').getByRole('button', { name: 'Settings' }).tap()
  await popularitySwitch(page).check()
  await page.getByRole('navigation').getByRole('button', { name: 'Round' }).tap()
}

test.beforeEach(async ({ page }) => {
  await page.goto('./')
})

test('Catalog order by default; turning on Order by popularity reorders the grid at once, mid-Round too', async ({ page }) => {
  await seedHistory(page, [
    { daysAgo: 1, items: ['Sprite'] },
    { daysAgo: 2, items: ['Sprite', 'Fanta'] },
  ])
  expect(await firstDrinks(page)).toEqual(['Cola', 'Cola Zero', 'Still water', 'Sparkling water'])
  await page.getByRole('navigation').getByRole('button', { name: 'Settings' }).tap()
  await expect(popularitySwitch(page)).not.toBeChecked()

  // A Round being composed doesn't hold the order back: flipping the setting is a deliberate choice, like a pin.
  await page.getByRole('navigation').getByRole('button', { name: 'Round' }).tap()
  await page.getByRole('button', { name: /^Cola(,|$)/ }).tap()
  await turnOnPopularity(page)
  expect(await firstDrinks(page)).toEqual(['Sprite', 'Fanta', 'Cola', 'Cola Zero'])

  await page.reload()
  expect(await firstDrinks(page)).toEqual(['Sprite', 'Fanta', 'Cola', 'Cola Zero'])
  await page.getByRole('navigation').getByRole('button', { name: 'Settings' }).tap()
  await popularitySwitch(page).uncheck()
  await page.getByRole('navigation').getByRole('button', { name: 'Round' }).tap()
  expect(await firstDrinks(page)).toEqual(['Cola', 'Cola Zero', 'Still water', 'Sparkling water'])
})

test('most ordered first; tiles hold still while composing, and reorder on place and on Undo', async ({ page }) => {
  await seedHistory(page, [
    { daysAgo: 1, items: ['Sprite'] },
    { daysAgo: 2, items: ['Sprite'] },
    { daysAgo: 3, items: ['Fanta'] },
    // Too old to count.
    { daysAgo: 120, items: ['Juice', 'Juice'] },
  ])
  await turnOnPopularity(page)
  expect(await firstDrinks(page)).toEqual(['Sprite', 'Fanta', 'Cola', 'Cola Zero'])

  for (let n = 0; n < 3; n++) await page.getByRole('button', { name: /^Fanta(,|$)/ }).tap()
  expect(await firstDrinks(page)).toEqual(['Sprite', 'Fanta', 'Cola', 'Cola Zero'])

  await page.getByRole('region', { name: 'Round total' }).getByRole('button', { name: 'Show' }).tap()
  await showPage(page).getByRole('button', { name: 'Ordered' }).tap()
  // Fanta and Sprite now tie on two Rounds each, so the Catalog order decides: Fanta is listed first.
  await expect.poll(() => firstDrinks(page)).toEqual(['Fanta', 'Sprite', 'Cola', 'Cola Zero'])

  await page.getByRole('status').getByRole('button', { name: 'Undo' }).tap()
  await expect.poll(() => firstDrinks(page)).toEqual(['Sprite', 'Fanta', 'Cola', 'Cola Zero'])
})
