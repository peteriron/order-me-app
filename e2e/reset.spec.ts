import { expect, test, type Page } from '@playwright/test'

const itemsPage = (page: Page) => page.getByRole('region', { name: 'Items' })
const choice = (page: Page, group: string, option: string) =>
  page.getByRole('group', { name: group }).getByRole('radio', { name: option })

async function goTo(page: Page, name: 'History' | 'Round' | 'Settings') {
  await page.getByRole('navigation', { name: 'Pages' }).getByRole('button', { name }).tap()
}

async function waitForServiceWorker(page: Page) {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
    if (!navigator.serviceWorker.controller) {
      await new Promise((resolve) => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }))
    }
  })
}

/** Uses the app for a while: places a Round, starts another, pins an Item, deletes one and picks the light theme. */
async function useTheApp(page: Page) {
  await page.getByRole('button', { name: /^Duvel(,|$)/ }).tap()
  await page.getByRole('region', { name: 'Round total' }).getByRole('button', { name: 'Show' }).tap()
  await page.getByRole('button', { name: 'Mark as ordered' }).tap()
  await page.getByRole('button', { name: /^Cola(,|$)/ }).tap()
  await goTo(page, 'Settings')
  await itemsPage(page).getByRole('button', { name: 'Pin Mint tea' }).tap()
  await itemsPage(page).getByRole('button', { name: 'Edit Chips' }).tap()
  await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).tap()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).tap()
  await choice(page, 'Theme', 'Light').check()
  await expect(itemsPage(page)).toContainText('27 in your Catalog')
}

async function resetFromSettings(page: Page) {
  await goTo(page, 'Settings')
  await page.getByRole('region', { name: 'General' }).getByRole('button', { name: 'Reset app' }).tap()
  await expect(page.getByRole('alertdialog')).toContainText('Reset the app to how it was first installed?')
  await page.getByRole('alertdialog').getByRole('button', { name: 'Reset', exact: true }).tap()
}

test.beforeEach(async ({ page }) => {
  await page.goto('./')
  await waitForServiceWorker(page)
})

test('Reset app brings back a first install: starter Items, no Round, pins, History or settings', async ({ page }) => {
  await useTheApp(page)
  // Another GitHub Pages project on the same origin, with its own saved data and offline cache.
  await page.evaluate(async () => {
    localStorage.setItem('other-project', 'kept')
    await caches.open(`workbox-precache-v2-${location.origin}/other-project/`)
  })
  const ownCache = await page.evaluate(async () => (await caches.keys()).find((n) => n.endsWith('/order-me-app/')))
  expect(ownCache).toBeTruthy()

  await resetFromSettings(page)

  await expect(page.getByRole('heading', { name: 'This round is on me', level: 1 })).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await expect(page.getByRole('region', { name: 'Round total' })).toContainText('Tap a drink to start')
  await goTo(page, 'Settings')
  await expect(itemsPage(page)).toContainText('28 in your Catalog')
  await expect(itemsPage(page).getByRole('button', { name: 'Pin Mint tea' })).toHaveAttribute('aria-pressed', 'false')
  await expect(choice(page, 'Language', 'System')).toBeChecked()
  await goTo(page, 'History')
  await expect(page.getByRole('region', { name: 'History' })).toContainText('No Rounds yet')

  // The other project's data is untouched.
  expect(await page.evaluate(() => localStorage.getItem('other-project'))).toBe('kept')
  expect(await page.evaluate(() => caches.keys())).toContain(`workbox-precache-v2-${new URL(page.url()).origin}/other-project/`)
})

test('without a connection Reset app changes nothing and says why', async ({ page, context }) => {
  await useTheApp(page)
  await context.setOffline(true)

  await resetFromSettings(page)

  await expect(page.getByRole('status').filter({ hasText: 'No connection.' })).toBeVisible()
  await expect(itemsPage(page)).toContainText('27 in your Catalog')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await goTo(page, 'Round')
  await expect(page.getByRole('region', { name: 'Round total' })).toContainText('1 item')
  await context.setOffline(false)
})
