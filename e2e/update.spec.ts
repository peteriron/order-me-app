import { readFileSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'

const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as { version: string }

const updateDialog = (page: Page) => page.getByRole('alertdialog', { name: 'A new version of OrderMe is available.' })
const tab = (page: Page, name: string) => page.getByRole('navigation').getByRole('button', { name })

/** Waits until the service worker controls the page, as on any visit after the first. */
async function waitForServiceWorker(page: Page) {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
    if (!navigator.serviceWorker.controller) {
      await new Promise((resolve) => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }))
    }
  })
}

/** What the browser does when a newly deployed version's service worker takes over the open app. */
const newVersionTakesOver = (page: Page) => page.evaluate(() => navigator.serviceWorker.dispatchEvent(new Event('controllerchange')))

test.beforeEach(async ({ page }) => {
  await page.goto('./')
  await waitForServiceWorker(page)
  // Reload so the app starts under the service worker, as it does when opened from the home screen.
  await page.reload()
})

test('Settings shows the version, build and date at the bottom', async ({ page }) => {
  await tab(page, 'Settings').tap()
  await expect(page.getByText(new RegExp(`^Version ${version.replace(/\./g, '\\.')} · build \\S+ · \\d{1,2} \\w+ \\d{4}$`))).toBeVisible()
})

test('a new version offers Update; Later moves the offer to Settings, where Update reloads', async ({ page }) => {
  await newVersionTakesOver(page)
  await expect(updateDialog(page)).toBeVisible()
  await updateDialog(page).getByRole('button', { name: 'Later' }).tap()
  await expect(updateDialog(page)).toHaveCount(0)

  await tab(page, 'Settings').tap()
  await expect(page.getByText('Update available')).toBeVisible()
  const reloaded = page.waitForEvent('load')
  await page.getByRole('button', { name: 'Update', exact: true }).tap()
  await reloaded
  await expect(page.getByText('Update available')).toHaveCount(0)
})

test('Update in the pop-up reloads into the new version', async ({ page }) => {
  await newVersionTakesOver(page)
  const reloaded = page.waitForEvent('load')
  await updateDialog(page).getByRole('button', { name: 'Update' }).tap()
  await reloaded
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
