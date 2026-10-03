import { expect, test, type Browser, type Page } from '@playwright/test'

declare global {
  interface Window {
    copied: string[]
  }
}

const itemsPage = (page: Page) => page.getByRole('region', { name: 'Items' })
const shareSheet = (page: Page) => page.getByRole('dialog', { name: 'Share Items' })
const confirmDialog = (page: Page) => page.getByRole('alertdialog')

async function goTo(page: Page, name: 'History' | 'Round' | 'Settings') {
  await page.getByRole('navigation', { name: 'Pages' }).getByRole('button', { name }).tap()
}

/** Records what the app copies, in place of the real clipboard. */
async function fakeClipboard(page: Page) {
  await page.addInitScript(() => {
    window.copied = []
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async (text: string) => void window.copied.push(text) },
    })
  })
}

/** The share link for the Catalog the page holds now, taken from the share sheet's Copy link. */
async function copyShareLink(page: Page): Promise<string> {
  await goTo(page, 'Settings')
  await itemsPage(page).getByRole('button', { name: 'Share', exact: true }).tap()
  await shareSheet(page).getByRole('button', { name: 'Copy link' }).tap()
  await shareSheet(page).getByRole('button', { name: 'Close' }).tap()
  return (await page.evaluate(() => window.copied)).at(-1)!
}

async function addItem(page: Page, name: string) {
  await goTo(page, 'Settings')
  await itemsPage(page).getByRole('button', { name: 'Add Item' }).tap()
  await page.getByRole('dialog').getByLabel('Name').fill(name)
  await page.getByRole('dialog').getByRole('button', { name: 'Add', exact: true }).tap()
}

/** A phone that has never opened the app: its own storage, same device settings. */
async function freshPhone(browser: Browser): Promise<Page> {
  const context = await browser.newContext(test.info().project.use)
  return context.newPage()
}

test.beforeEach(async ({ page }) => {
  await fakeClipboard(page)
  await page.goto('./')
})

test('the share sheet: a QR code, Copy link that says it copied, and Close; no Save image', async ({ page }) => {
  await page.clock.install()
  await page.goto('./')
  await goTo(page, 'Settings')
  await itemsPage(page).getByRole('button', { name: 'Share', exact: true }).tap()
  await expect(shareSheet(page).getByRole('img', { name: 'QR code with your 28 Items' })).toBeVisible()
  await expect(shareSheet(page).getByRole('button', { name: 'Save image' })).toHaveCount(0)

  await shareSheet(page).getByRole('button', { name: 'Copy link' }).tap()
  // The button itself answers, for 2 seconds; no toast on top of it.
  await expect(shareSheet(page).getByRole('button', { name: '✓ Copied' })).toBeVisible()
  await expect(page.getByRole('status').filter({ hasText: 'Copied to clipboard' })).toHaveCount(0)
  const [link] = await page.evaluate(() => window.copied)
  expect(link).toMatch(/^http:\/\/localhost:\d+\/order-me-app\/#items=[\w-]+$/)
  await page.clock.fastForward(2_100)
  await expect(shareSheet(page).getByRole('button', { name: 'Copy link' })).toBeVisible()

  await shareSheet(page).getByRole('button', { name: 'Close' }).tap()
  await expect(shareSheet(page)).toHaveCount(0)
})

test('Copy link says so when the phone blocks the clipboard', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async () => Promise.reject(new DOMException('Denied', 'NotAllowedError')) },
    })
  })
  await page.goto('./')
  await goTo(page, 'Settings')
  await itemsPage(page).getByRole('button', { name: 'Share', exact: true }).tap()
  await shareSheet(page).getByRole('button', { name: 'Copy link' }).tap()
  await expect(shareSheet(page).getByRole('button', { name: 'Couldn’t copy' })).toBeVisible()
})

test('a toast shows above an open sheet', async ({ page }) => {
  await page.getByRole('button', { name: /^Duvel(,|$)/ }).tap()
  await page.getByRole('region', { name: 'Round total' }).getByRole('button', { name: 'Clear' }).tap()
  const toast = page.getByRole('status').filter({ hasText: 'Round cleared' })
  await expect(toast).toBeVisible()
  await goTo(page, 'Settings')
  await itemsPage(page).getByRole('button', { name: 'Share', exact: true }).tap()
  await expect(shareSheet(page)).toBeVisible()
  // What's on top at the toast's centre is the toast, not the sheet or its backdrop.
  const box = (await toast.boundingBox())!
  const onTop = await page.evaluate(([x, y]) => !!document.elementFromPoint(x!, y!)?.closest('[role="status"]'), [box.x + box.width / 2, box.y + box.height / 2])
  expect(onTop).toBe(true)
})

test('a phone opening the link for the first time starts with the shared Items, without asking', async ({ page, browser }) => {
  await addItem(page, 'Kriek')
  const link = await copyShareLink(page)

  const friend = await freshPhone(browser)
  await friend.goto(link)
  await goTo(friend, 'Settings')
  await expect(itemsPage(friend)).toContainText('29 in your Catalog')
  await expect(itemsPage(friend).getByRole('button', { name: 'Edit Kriek' })).toBeVisible()
  await expect(confirmDialog(friend)).toHaveCount(0)
  expect(new URL(friend.url()).hash).toBe('')

  await friend.reload()
  await expect(confirmDialog(friend)).toHaveCount(0)
  await friend.context().close()
})

test('a Dutch phone gets an English phone’s starter Items in Dutch, and its own added Items as typed', async ({ page, browser }) => {
  await addItem(page, 'Kriek')
  const link = await copyShareLink(page)

  const context = await browser.newContext({ ...test.info().project.use, locale: 'nl-BE' })
  const friend = await context.newPage()
  await friend.goto(link)
  const drinks = friend.getByRole('region', { name: 'Dranken' })
  await expect(drinks.getByRole('button', { name: 'Water plat', exact: true })).toBeVisible()
  await expect(drinks.getByRole('button', { name: 'Pils', exact: true })).toBeVisible()
  await expect(drinks.getByRole('button', { name: 'Kriek', exact: true })).toBeVisible()
  await context.close()
})

test('with Items of their own, the friend is asked: Cancel keeps them, Replace takes the shared ones', async ({ page }) => {
  const link = await copyShareLink(page)
  await addItem(page, 'Kriek')

  // Opening the link anew: Cancel changes nothing.
  await page.goto('about:blank')
  await page.goto(link)
  await expect(confirmDialog(page)).toContainText('Replace your 29 Items with the 28 shared Items? History is kept.')
  expect(new URL(page.url()).hash).toBe('')
  await confirmDialog(page).getByRole('button', { name: 'Cancel' }).tap()
  await goTo(page, 'Settings')
  await expect(itemsPage(page)).toContainText('29 in your Catalog')

  // Pasted into the open app (only the fragment changes): Replace takes the shared Items.
  await page.goto(link)
  await confirmDialog(page).getByRole('button', { name: 'Replace' }).tap()
  await expect(itemsPage(page)).toContainText('28 in your Catalog')
  await expect(itemsPage(page).getByRole('button', { name: 'Edit Kriek' })).toHaveCount(0)
  expect(new URL(page.url()).hash).toBe('')
})

test('a broken link is ignored with a short note', async ({ page }) => {
  await page.goto('./#items=broken')
  await expect(page.getByRole('status').filter({ hasText: 'That share link couldn’t be read' })).toBeVisible()
  expect(new URL(page.url()).hash).toBe('')
  await goTo(page, 'Settings')
  await expect(itemsPage(page)).toContainText('28 in your Catalog')
})
