import { expect, test, type Page } from '@playwright/test'
import { touchDrag } from './touch.ts'

const itemsPage = (page: Page) => page.getByRole('region', { name: 'Items' })
const itemsDrinks = (page: Page) => itemsPage(page).getByRole('region', { name: 'Drinks' })
/** The Item names on the Items page's Drinks list, top to bottom. */
const listedDrinks = (page: Page) => itemsDrinks(page).getByRole('button', { name: /^Edit / })
/** The tiles in the Round page's Drinks section, in grid order (nothing is in the Round, so every button is a tile). */
const drinkTiles = (page: Page) => page.getByRole('region', { name: 'Drinks' }).getByRole('button')

async function goTo(page: Page, name: 'History' | 'Round' | 'Items') {
  await page.getByRole('navigation', { name: 'Pages' }).getByRole('button', { name }).tap()
}

async function pin(page: Page, ...names: string[]) {
  for (const name of names) await itemsDrinks(page).getByRole('button', { name: `Pin ${name}`, exact: true }).tap()
}

test.beforeEach(async ({ page }) => {
  await page.goto('./')
})

test('pinning moves an Item to the front on the Items page and the Round page, and survives a reload', async ({ page }) => {
  await expect(drinkTiles(page).first()).toHaveText(/^🥤Cola$/)

  await goTo(page, 'Items')
  await pin(page, 'Red wine', 'Mint tea')
  await expect(itemsDrinks(page).getByRole('button', { name: 'Pin Mint tea' })).toHaveAttribute('aria-pressed', 'true')
  await expect(listedDrinks(page).nth(0)).toHaveText(/Red wine/)
  await expect(listedDrinks(page).nth(1)).toHaveText(/Mint tea/)

  await goTo(page, 'Round')
  await expect(drinkTiles(page).nth(0)).toHaveText(/Red wine/)
  await expect(drinkTiles(page).nth(1)).toHaveText(/Mint tea/)
  await expect(drinkTiles(page).nth(2)).toHaveText(/^🥤Cola$/)

  await page.reload()
  await expect(drinkTiles(page).nth(0)).toHaveText(/Red wine/)
  await expect(drinkTiles(page).nth(1)).toHaveText(/Mint tea/)

  await goTo(page, 'Items')
  await itemsDrinks(page).getByRole('button', { name: 'Pin Red wine' }).tap()
  await goTo(page, 'Round')
  await expect(drinkTiles(page).nth(0)).toHaveText(/Mint tea/)
})

test('dragging a pinned Item’s handle reorders it, without swiping the page', async ({ page }) => {
  await goTo(page, 'Items')
  await pin(page, 'Lager', 'Cola', 'Mint tea')

  const handle = itemsDrinks(page).locator('.item-row', { has: page.getByRole('button', { name: 'Edit Mint tea' }) }).locator('.item-row-handle')
  const from = (await handle.boundingBox())!
  const beerRow = (await listedDrinks(page).nth(0).boundingBox())!
  // Up to the top row, drifting sideways towards the Round page on the way: the page must not follow.
  await touchDrag(
    page,
    { x: from.x + from.width / 2, y: from.y + from.height / 2 },
    { x: from.x + from.width / 2 + 120, y: beerRow.y + 8 },
    { steps: 16, durationMs: 400 },
  )

  await expect(page.getByRole('heading', { name: 'Items', level: 1 })).toBeInViewport({ ratio: 1 })
  await expect(listedDrinks(page).nth(0)).toHaveText(/Mint tea/)
  await expect(listedDrinks(page).nth(1)).toHaveText(/Lager/)
  await expect(listedDrinks(page).nth(2)).toHaveText(/Cola/)

  // Chromium on Linux drops a tap that lands within moments of a touch drag ending (CI showed no click at all),
  // quicker than any finger moves on. Pause like a person would before tapping on.
  await page.waitForTimeout(800)
  await goTo(page, 'Round')
  await expect(drinkTiles(page).nth(0)).toHaveText(/Mint tea/)
  await expect(drinkTiles(page).nth(1)).toHaveText(/Lager/)
  await expect(drinkTiles(page).nth(2)).toHaveText(/Cola/)
})

test('Move up and Move down reorder pinned Items from the keyboard', async ({ page }) => {
  await goTo(page, 'Items')
  await pin(page, 'Lager', 'Cola', 'Mint tea')

  const moveMintTeaUp = itemsDrinks(page).getByRole('button', { name: 'Move Mint tea up' })
  await moveMintTeaUp.focus()
  await page.keyboard.press('Enter')
  await page.keyboard.press('Enter')
  await expect(listedDrinks(page).nth(0)).toHaveText(/Mint tea/)
  // Focus follows the Item, and the first one can't go further up.
  await expect(moveMintTeaUp).toBeFocused()
  await expect(moveMintTeaUp).toHaveAttribute('aria-disabled', 'true')

  await itemsDrinks(page).getByRole('button', { name: 'Move Lager down' }).focus()
  await page.keyboard.press('Enter')
  await expect(listedDrinks(page).nth(1)).toHaveText(/Cola/)
  await expect(listedDrinks(page).nth(2)).toHaveText(/Lager/)
  // Unpinned Items have no Move buttons.
  await expect(itemsDrinks(page).getByRole('button', { name: 'Move Water up' })).toHaveCount(0)
})
