import { expect, test, type Page } from '@playwright/test'
import { seedHistory } from './helpers.ts'

const firstDrinks = (page: Page) =>
  page
    // The Round page's Drinks section (the Items page has one too).
    .locator('section[aria-labelledby="round-heading-drink"]')
    .locator('.tile-name')
    .allTextContents()
    .then((names) => names.slice(0, 4))

const showPage = (page: Page) => page.getByRole('region', { name: 'Round for the counter' })

test.beforeEach(async ({ page }) => {
  await page.goto('./')
})

test('most ordered first; tiles hold still while composing, and reorder on place and on Undo', async ({ page }) => {
  await seedHistory(page, [
    { daysAgo: 1, lines: [['Rosé wine', 1]] },
    { daysAgo: 2, lines: [['Rosé wine', 1]] },
    { daysAgo: 3, lines: [['Mint tea', 1]] },
    // Too old to count.
    { daysAgo: 120, lines: [['Red wine', 1], ['Red wine', 1]] },
  ])
  expect(await firstDrinks(page)).toEqual(['Rosé wine', 'Mint tea', 'Cola', 'Cola Zero'])

  for (let n = 0; n < 3; n++) await page.getByRole('button', { name: /^Mint tea(,|$)/ }).tap()
  expect(await firstDrinks(page)).toEqual(['Rosé wine', 'Mint tea', 'Cola', 'Cola Zero'])

  await page.getByRole('region', { name: 'Round total' }).getByRole('button', { name: 'Show' }).tap()
  await showPage(page).getByRole('button', { name: 'Ordered' }).tap()
  // Mint tea and Rosé wine now tie on two Rounds each, so the Catalog order decides: Mint tea is listed first.
  await expect.poll(() => firstDrinks(page)).toEqual(['Mint tea', 'Rosé wine', 'Cola', 'Cola Zero'])

  await page.getByRole('status').getByRole('button', { name: 'Undo' }).tap()
  await expect.poll(() => firstDrinks(page)).toEqual(['Rosé wine', 'Mint tea', 'Cola', 'Cola Zero'])
})
