import { expect, test, type Page } from '@playwright/test'

async function openSettings(page: Page, pageLabel = 'Settings') {
  await page.getByRole('navigation').getByRole('button', { name: pageLabel }).tap()
}

const setting = (page: Page, group: string, option: string) =>
  page.getByRole('group', { name: group }).getByRole('radio', { name: option })

const theme = (page: Page) => page.evaluate(() => document.documentElement.dataset.theme)
const background = (page: Page) => page.evaluate(() => getComputedStyle(document.body).backgroundColor)

test.beforeEach(async ({ page }) => {
  await page.goto('./')
})

test('switching to Dutch changes the app text and the starter Items at once, and sticks', async ({ page }) => {
  await openSettings(page)
  await setting(page, 'Language', 'Nederlands').check()

  await expect(page.getByRole('navigation').getByRole('button', { name: 'Geschiedenis' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Instellingen' })).toBeVisible()
  // The Catalog was seeded in English on this phone; its starter Items follow the language now.
  await expect(page.getByRole('button', { name: 'Water plat bewerken' })).toBeAttached()
  await expect(page.getByRole('button', { name: 'Still water bewerken' })).toHaveCount(0)

  await page.reload()
  await openSettings(page, 'Instellingen')
  await expect(setting(page, 'Taal', 'Nederlands')).toBeChecked()

  await setting(page, 'Taal', 'Systeem').check()
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
})

test('starter Items follow the language on the Round page; an added or renamed Item stays as typed', async ({ page }) => {
  await openSettings(page)
  const items = page.getByRole('region', { name: 'Items' })
  // An Item of the Operator's own, and a starter Item renamed.
  await items.getByRole('button', { name: 'Add Item' }).tap()
  await page.getByRole('dialog').getByLabel('Name').fill('Kriek')
  await page.getByRole('dialog').getByRole('button', { name: 'Add', exact: true }).tap()
  await items.getByRole('button', { name: 'Edit Cola Zero' }).tap()
  await page.getByRole('dialog').getByLabel('Name').fill('Coke Zero')
  await page.getByRole('dialog').getByRole('button', { name: 'Save' }).tap()

  await setting(page, 'Language', 'Nederlands').check()
  await page.getByRole('navigation').getByRole('button', { name: 'Rondje' }).tap()
  const drinks = page.getByRole('region', { name: 'Dranken' })
  await expect(drinks.getByRole('button', { name: 'Water plat', exact: true })).toBeVisible()
  await expect(drinks.getByRole('button', { name: 'Pils', exact: true })).toBeVisible()
  await expect(drinks.getByRole('button', { name: 'Coke Zero', exact: true })).toBeVisible()
  await expect(drinks.getByRole('button', { name: 'Kriek', exact: true })).toBeVisible()
})

test('dark is the default, even when the phone prefers light', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' })
  await page.reload()
  expect(await theme(page)).toBe('dark')
  expect(await background(page)).toBe('rgb(14, 14, 16)')
})

test('choosing Light switches the colours and survives a reload', async ({ page }) => {
  await openSettings(page)
  await setting(page, 'Theme', 'Light').check()
  await expect.poll(() => theme(page)).toBe('light')
  expect(await background(page)).toBe('rgb(250, 250, 249)')

  await page.reload()
  expect(await theme(page)).toBe('light')
})

test('System follows the phone’s light/dark preference live', async ({ page }) => {
  await openSettings(page)
  await setting(page, 'Theme', 'System').check()

  await page.emulateMedia({ colorScheme: 'light' })
  await expect.poll(() => theme(page)).toBe('light')
  await page.emulateMedia({ colorScheme: 'dark' })
  await expect.poll(() => theme(page)).toBe('dark')
})

test('Clear history asks first, empties history but not the Round or Catalog, then is disabled', async ({ page }) => {
  await page.getByRole('button', { name: /^Duvel(,|$)/ }).tap()
  await page.getByRole('region', { name: 'Round total' }).getByRole('button', { name: 'Show' }).tap()
  await page.getByRole('button', { name: 'Mark as ordered' }).tap()
  await page.getByRole('button', { name: /^Cola(,|$)/ }).tap()

  await openSettings(page)
  await page.getByRole('button', { name: 'Clear history' }).tap()
  const confirm = page.getByRole('alertdialog', { name: 'Delete all past Rounds?' })
  await confirm.getByRole('button', { name: 'Clear history' }).tap()
  await expect(confirm).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Clear history' })).toBeDisabled()
  await expect(page.getByRole('region', { name: 'Items' })).toContainText('28 in your Catalog')

  await openSettings(page, 'History')
  await expect(page.getByRole('region', { name: 'History' })).toContainText('No Rounds yet')
  await openSettings(page, 'Round')
  await expect(page.getByRole('button', { name: 'Cola, 1 in round' })).toBeVisible()
})

