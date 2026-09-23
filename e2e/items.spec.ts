import { expect, test, type Page } from '@playwright/test'

const itemsPage = (page: Page) => page.getByRole('region', { name: 'Items' })
const sheet = (page: Page) => page.getByRole('dialog')
const roundBar = (page: Page) => page.getByRole('region', { name: 'Round total' })

async function goTo(page: Page, name: 'History' | 'Round' | 'Items') {
  await page.getByRole('navigation', { name: 'Pages' }).getByRole('button', { name }).tap()
}

async function tapTiles(page: Page, ...names: string[]) {
  for (const name of names) await page.getByRole('button', { name: new RegExp(`^${name}`) }).tap()
}

test.beforeEach(async ({ page }) => {
  await page.goto('./')
})

test('lists every Item A–Z under Drinks and Snacks, with Add Item at the top', async ({ page }) => {
  await goTo(page, 'Items')
  await expect(itemsPage(page).getByRole('heading', { name: 'Items', level: 1 })).toBeInViewport()
  await expect(itemsPage(page)).toContainText('21 in your Catalog')
  await expect(itemsPage(page).getByRole('button', { name: 'Add Item' })).toBeVisible()

  const snacks = itemsPage(page).getByRole('region', { name: 'Snacks' }).getByRole('button')
  await expect(snacks).toHaveText([/Bitterballen/, /Cheese/, /Chips/, /Nuts/])
  await expect(itemsPage(page).getByRole('region', { name: 'Drinks' }).getByRole('button')).toHaveCount(17)
})

test('adds an Item that appears in the Catalog and as a tile, and survives a reload', async ({ page }) => {
  await goTo(page, 'Items')
  await itemsPage(page).getByRole('button', { name: 'Add Item' }).tap()

  await expect(sheet(page)).toHaveAccessibleName('Add Item')
  await expect(sheet(page).getByLabel('Name')).toBeFocused()
  await sheet(page).getByLabel('Name').fill('Kriek')
  await sheet(page).getByRole('radio', { name: '🍒' }).check()
  await sheet(page).getByRole('button', { name: 'Add', exact: true }).tap()

  await expect(sheet(page)).toHaveCount(0)
  await expect(itemsPage(page).getByRole('region', { name: 'Drinks' }).getByRole('button', { name: 'Edit Kriek' })).toBeVisible()

  await page.reload()
  await expect(page.getByRole('region', { name: 'Drinks' }).first().getByRole('button', { name: 'Kriek' })).toBeVisible()
})

test('will not add an Item without a name', async ({ page }) => {
  await goTo(page, 'Items')
  await itemsPage(page).getByRole('button', { name: 'Add Item' }).tap()
  await sheet(page).getByLabel('Name').fill('   ')
  await sheet(page).getByRole('button', { name: 'Add', exact: true }).tap()

  await expect(sheet(page)).toContainText('Give the Item a name')
  await expect(itemsPage(page)).toContainText('21 in your Catalog')
})

test('a typed emoji can be used instead of one from the picker', async ({ page }) => {
  await goTo(page, 'Items')
  await itemsPage(page).getByRole('button', { name: 'Add Item' }).tap()
  await sheet(page).getByLabel('Name').fill('Maté')
  await sheet(page).getByLabel('Or type your own').fill('🧉')
  await sheet(page).getByRole('button', { name: 'Add', exact: true }).tap()

  await expect(itemsPage(page).getByRole('button', { name: 'Edit Maté' })).toContainText('🧉')
})

test('Cancel throws away every change made in the sheet', async ({ page }) => {
  await goTo(page, 'Items')
  await itemsPage(page).getByRole('button', { name: 'Edit Duvel' }).tap()

  await expect(sheet(page)).toHaveAccessibleName('Edit Item')
  await sheet(page).getByLabel('Name').fill('Something else')
  await sheet(page).getByRole('radio', { name: 'Snack' }).check()
  await sheet(page).getByRole('button', { name: 'Cancel' }).tap()

  await expect(sheet(page)).toHaveCount(0)
  await expect(itemsPage(page).getByRole('region', { name: 'Drinks' }).getByRole('button', { name: 'Edit Duvel' })).toBeVisible()
  await expect(itemsPage(page).getByRole('button', { name: 'Edit Something else' })).toHaveCount(0)
})

test('renaming an Item keeps its count, and a new category moves its tile', async ({ page }) => {
  await tapTiles(page, 'Duvel', 'Duvel')
  await goTo(page, 'Items')
  await itemsPage(page).getByRole('button', { name: 'Edit Duvel' }).tap()
  await sheet(page).getByLabel('Name').fill('Duvel 666')
  await sheet(page).getByRole('radio', { name: 'Snack' }).check()
  await sheet(page).getByRole('button', { name: 'Save' }).tap()

  await goTo(page, 'Round')
  const roundSnacks = page.getByRole('region', { name: 'Snacks' }).first()
  await expect(roundSnacks.getByRole('button', { name: 'Duvel 666, 2 in round' })).toBeVisible()
  await expect(roundBar(page)).toContainText('2 items')
})

test('deleting an Item asks first, takes it out of the Round, and leaves history alone', async ({ page }) => {
  // Place a Round with Chips, then start composing another one with Chips in it.
  await tapTiles(page, 'Chips')
  await page.getByRole('button', { name: 'Show' }).tap()
  await page.getByRole('button', { name: 'Mark as ordered' }).tap()
  await tapTiles(page, 'Chips', 'Cola')

  await goTo(page, 'Items')
  await itemsPage(page).getByRole('button', { name: 'Edit Chips' }).tap()
  await sheet(page).getByRole('button', { name: 'Delete' }).tap()

  const confirm = page.getByRole('alertdialog', { name: 'Delete “Chips”? History keeps it.' })
  await confirm.getByRole('button', { name: 'Delete' }).tap()

  await expect(confirm).toHaveCount(0)
  await expect(sheet(page)).toHaveCount(0)
  await expect(itemsPage(page).getByRole('button', { name: 'Edit Chips' })).toHaveCount(0)
  await expect(itemsPage(page)).toContainText('20 in your Catalog')

  await goTo(page, 'Round')
  await expect(page.getByRole('button', { name: /^Chips/ })).toHaveCount(0)
  await expect(roundBar(page)).toContainText('1 item')

  await goTo(page, 'History')
  await expect(page.getByRole('region', { name: 'History' }).getByRole('article')).toContainText('1 Chips')
})

test('Cancel in the delete confirmation keeps the Item and the sheet', async ({ page }) => {
  await goTo(page, 'Items')
  await itemsPage(page).getByRole('button', { name: 'Edit Chips' }).tap()
  await sheet(page).getByRole('button', { name: 'Delete' }).tap()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Cancel' }).tap()

  await expect(sheet(page)).toHaveAccessibleName('Edit Item')
  await sheet(page).getByRole('button', { name: 'Cancel' }).tap()
  await expect(itemsPage(page).getByRole('button', { name: 'Edit Chips' })).toBeVisible()
})
