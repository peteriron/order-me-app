import { readFileSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'
import { waitForServiceWorker } from './helpers.ts'

const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as { version: string }

const updateDialog = (page: Page) => page.getByRole('alertdialog', { name: 'A new version of OrderMe is available.' })
const tab = (page: Page, name: string) => page.getByRole('navigation').getByRole('button', { name })

/** What the browser does when a newly deployed version's service worker takes over the open app. */
const newVersionTakesOver = (page: Page) => page.evaluate(() => navigator.serviceWorker.dispatchEvent(new Event('controllerchange')))

test.beforeEach(async ({ page }) => {
  await page.goto('./')
  await waitForServiceWorker(page)
  // Reload so the app starts under the service worker, as it does when opened from the home screen.
  await page.reload()
  // The app only treats a later controllerchange as an update if it was already controlled when it mounted; WebKit
  // can take a moment to claim the reloaded page, so wait for that before the test dispatches one.
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null)
})

test('Settings shows the version, build and date at the bottom', async ({ page }) => {
  await tab(page, 'Settings').tap()
  const line = page.getByText(`Version ${version} · build`)
  await expect(line).toBeVisible()
  await expect(line).toHaveText(/ · build \S+ · \d{1,2} \w+ \d{4}$/)
})

test('a new version offers Update; Later moves the offer to Settings, where Update reloads', async ({ page }) => {
  await newVersionTakesOver(page)
  await expect(updateDialog(page)).toBeVisible()
  await updateDialog(page).getByRole('button', { name: 'Later' }).tap()
  await expect(updateDialog(page)).toHaveCount(0)

  await tab(page, 'Settings').tap()
  await expect(page.getByText('Update available')).toBeVisible()
  await page.getByRole('button', { name: 'Update', exact: true }).tap()
  // Reloading resets the app to the Round page; polling waits for the new document.
  await expect(page.getByText('Update available')).toHaveCount(0)
})

test('Update in the pop-up reloads into the new version', async ({ page }) => {
  await newVersionTakesOver(page)
  await updateDialog(page).getByRole('button', { name: 'Update' }).tap()
  // Reloading resets the app, so the dialog is gone; polling waits for the new document.
  await expect(updateDialog(page)).toHaveCount(0)
})

test('the pop-up waits while a sheet is open', async ({ page }) => {
  await tab(page, 'Settings').tap()
  await page.getByRole('button', { name: 'Add Item' }).tap()
  await newVersionTakesOver(page)
  await expect(updateDialog(page)).toHaveCount(0)

  await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).tap()
  await expect(updateDialog(page)).toBeVisible()
})

test('the very first install isn’t mistaken for an update', async ({ browser }) => {
  const page = await (await browser.newContext(test.info().project.use)).newPage()
  await page.goto('./')
  await waitForServiceWorker(page)
  await expect(page.getByRole('heading', { name: 'This round is on me' })).toBeVisible()
  await expect(updateDialog(page)).toHaveCount(0)
  await page.context().close()
})
