import { expect, test, type Page } from '@playwright/test'
import { touchDrag } from './touch.ts'

const itemsPage = (page: Page) => page.getByRole('region', { name: 'Items' })
const itemsDrinks = (page: Page) => itemsPage(page).getByRole('region', { name: 'Soda' })
/** The Item names in the Items page's Soda box, top to bottom. */
const listedDrinks = (page: Page) => itemsDrinks(page).getByRole('button', { name: /^Edit / })
/** The tiles in the Round page's Soda box, in grid order (nothing is in the Round, so every button is a tile). */
const drinkTiles = (page: Page) => page.getByRole('region', { name: 'Soda' }).getByRole('button')

async function goTo(page: Page, name: 'History' | 'Round' | 'Settings') {
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

  await goTo(page, 'Settings')
  await pin(page, 'Sprite', 'Fanta')
  await expect(itemsDrinks(page).getByRole('button', { name: 'Pin Fanta' })).toHaveAttribute('aria-pressed', 'true')
  await expect(listedDrinks(page).nth(0)).toHaveText(/Sprite/)
  await expect(listedDrinks(page).nth(1)).toHaveText(/Fanta/)

  await goTo(page, 'Round')
  await expect(drinkTiles(page).nth(0)).toHaveText(/Sprite/)
  await expect(drinkTiles(page).nth(1)).toHaveText(/Fanta/)
  await expect(drinkTiles(page).nth(2)).toHaveText(/^🥤Cola$/)

  await page.reload()
  await expect(drinkTiles(page).nth(0)).toHaveText(/Sprite/)
  await expect(drinkTiles(page).nth(1)).toHaveText(/Fanta/)

  await goTo(page, 'Settings')
  await itemsDrinks(page).getByRole('button', { name: 'Pin Sprite' }).tap()
  await goTo(page, 'Round')
  await expect(drinkTiles(page).nth(0)).toHaveText(/Fanta/)
})

test('dragging a pinned Item’s handle reorders it, without swiping the page', async ({ page }) => {
  await goTo(page, 'Settings')
  await pin(page, 'Cola Zero', 'Cola', 'Fanta')
  // Pinning scrolled the box into view; back to the top, so the page title shows whether the page moved.
  await page.getByRole('heading', { name: 'Settings', level: 1 }).scrollIntoViewIfNeeded()

  const handle = itemsDrinks(page).locator('.item-row', { has: page.getByRole('button', { name: 'Edit Fanta' }) }).locator('.item-row-handle')
  const from = (await handle.boundingBox())!
  const beerRow = (await listedDrinks(page).nth(0).boundingBox())!
  // Up to the top row, drifting sideways towards the Round page on the way: the page must not follow.
  await touchDrag(
    page,
    { x: from.x + from.width / 2, y: from.y + from.height / 2 },
    { x: from.x + from.width / 2 + 120, y: beerRow.y + 8 },
    { steps: 16, durationMs: 400 },
  )

  await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeInViewport({ ratio: 1 })
  await expect(listedDrinks(page).nth(0)).toHaveText(/Fanta/)
  await expect(listedDrinks(page).nth(1)).toHaveText(/Cola Zero/)
  await expect(listedDrinks(page).nth(2)).toHaveText(/^🥤Cola$/)

  // Chromium on Linux drops a tap that lands within moments of a touch drag ending (CI showed no click at all),
  // quicker than any finger moves on. Pause like a person would before tapping on.
  await page.waitForTimeout(800)
  await goTo(page, 'Round')
  await expect(drinkTiles(page).nth(0)).toHaveText(/Fanta/)
  await expect(drinkTiles(page).nth(1)).toHaveText(/Cola Zero/)
  await expect(drinkTiles(page).nth(2)).toHaveText(/^🥤Cola$/)
})

test('Move up and Move down reorder pinned Items from the keyboard', async ({ page }) => {
  await goTo(page, 'Settings')
  await pin(page, 'Cola Zero', 'Cola', 'Fanta')

  const moveFantaUp = itemsDrinks(page).getByRole('button', { name: 'Move Fanta up' })
  await moveFantaUp.focus()
  await page.keyboard.press('Enter')
  await page.keyboard.press('Enter')
  await expect(listedDrinks(page).nth(0)).toHaveText(/Fanta/)
  // Focus follows the Item, and the first one can't go further up.
  await expect(moveFantaUp).toBeFocused()
  await expect(moveFantaUp).toHaveAttribute('aria-disabled', 'true')

  await itemsDrinks(page).getByRole('button', { name: 'Move Cola Zero down' }).focus()
  await page.keyboard.press('Enter')
  await expect(listedDrinks(page).nth(1)).toHaveText(/^🥤Cola$/)
  await expect(listedDrinks(page).nth(2)).toHaveText(/Cola Zero/)
  // Unpinned Items have no Move buttons.
  await expect(itemsDrinks(page).getByRole('button', { name: 'Move Still water up' })).toHaveCount(0)
})
