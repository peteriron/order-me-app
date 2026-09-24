import { expect, test, type Page } from '@playwright/test'

async function openSettings(page: Page, pageLabel = 'Items') {
  await page.getByRole('navigation').getByRole('button', { name: pageLabel }).tap()
}

const setting = (page: Page, group: string, option: string) =>
  page.getByRole('group', { name: group }).getByRole('radio', { name: option })

const theme = (page: Page) => page.evaluate(() => document.documentElement.dataset.theme)
const background = (page: Page) => page.evaluate(() => getComputedStyle(document.body).backgroundColor)

test.beforeEach(async ({ page }) => {
  await page.goto('./')
})

test('switching to Dutch changes the app text at once but never renames Catalog Items, and sticks', async ({ page }) => {
  await openSettings(page)
  await setting(page, 'Language', 'Nederlands').check()

  await expect(page.getByRole('navigation').getByRole('button', { name: 'Geschiedenis' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Instellingen' })).toBeVisible()
  // The Catalog was seeded in English on this (English) phone and stays that way.
  await expect(page.getByRole('button', { name: 'Still water bewerken' })).toBeAttached()

  await page.reload()
  await openSettings(page)
  await expect(setting(page, 'Taal', 'Nederlands')).toBeChecked()

  await setting(page, 'Taal', 'Systeem').check()
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
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

test('Clear history asks first, then empties history but leaves the Round and Catalog alone', async ({ page }) => {
  await page.getByRole('button', { name: /^Duvel/ }).tap()
  await page.getByRole('button', { name: 'Show' }).tap()
  await page.getByRole('button', { name: 'Mark as ordered' }).tap()
  await page.getByRole('button', { name: /^Cola/ }).tap()

  await openSettings(page)
  await page.getByRole('button', { name: 'Clear history' }).tap()
  const confirm = page.getByRole('alertdialog', { name: 'Delete all past Rounds?' })
  await confirm.getByRole('button', { name: 'Clear history' }).tap()
  await expect(confirm).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Clear history' })).toBeDisabled()
  await expect(page.getByRole('region', { name: 'Items' })).toContainText('21 in your Catalog')

  await openSettings(page, 'History')
  await expect(page.getByRole('region', { name: 'History' })).toContainText('No Rounds yet')
  await openSettings(page, 'Round')
  await expect(page.getByRole('button', { name: 'Cola, 1 in round' })).toBeVisible()
})

test('Clear history is disabled while there is nothing to clear', async ({ page }) => {
  await openSettings(page)
  await expect(page.getByRole('button', { name: 'Clear history' })).toBeDisabled()
})
