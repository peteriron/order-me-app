import { readFileSync } from 'node:fs'
import { expect, test, type Browser, type Page } from '@playwright/test'

declare global {
  interface Window {
    copied: string[]
  }
}

const itemsPage = (page: Page) => page.getByRole('region', { name: 'Items' })
const shareSheet = (page: Page) => page.getByRole('dialog', { name: 'Share Items' })
const confirmDialog = (page: Page) => page.getByRole('alertdialog')

async function goTo(page: Page, name: 'History' | 'Round' | 'Items') {
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
  await goTo(page, 'Items')
  await itemsPage(page).getByRole('button', { name: 'Share Items' }).tap()
  await shareSheet(page).getByRole('button', { name: 'Copy link' }).tap()
  await shareSheet(page).getByRole('button', { name: 'Done' }).tap()
  return (await page.evaluate(() => window.copied)).at(-1)!
}

async function addItem(page: Page, name: string) {
  await goTo(page, 'Items')
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

test('the share sheet shows a QR code; Copy link copies the link and Save image downloads a PNG', async ({ page }) => {
  await goTo(page, 'Items')
  await itemsPage(page).getByRole('button', { name: 'Share Items' }).tap()
  await expect(shareSheet(page).getByRole('img', { name: 'QR code with your 28 Items' })).toBeVisible()

  await shareSheet(page).getByRole('button', { name: 'Copy link' }).tap()
  await expect(page.getByRole('status').filter({ hasText: 'Copied to clipboard' })).toBeVisible()
  const [link] = await page.evaluate(() => window.copied)
  expect(link).toMatch(/^http:\/\/localhost:\d+\/order-me-app\/#items=[\w-]+$/)

  const download = page.waitForEvent('download')
  await shareSheet(page).getByRole('button', { name: 'Save image' }).tap()
  expect((await download).suggestedFilename()).toBe('orderme-items.png')
  const png = readFileSync((await (await download).path())!)
  expect([...png.subarray(1, 4)].map((c) => String.fromCharCode(c)).join('')).toBe('PNG')
})

test('a phone opening the link for the first time starts with the shared Items, without asking', async ({ page, browser }) => {
  await addItem(page, 'Kriek')
  const link = await copyShareLink(page)

  const friend = await freshPhone(browser)
  await friend.goto(link)
  await goTo(friend, 'Items')
  await expect(itemsPage(friend)).toContainText('29 in your Catalog')
  await expect(itemsPage(friend).getByRole('button', { name: 'Edit Kriek' })).toBeVisible()
  await expect(confirmDialog(friend)).toHaveCount(0)
  expect(new URL(friend.url()).hash).toBe('')

  await friend.reload()
  await expect(confirmDialog(friend)).toHaveCount(0)
  await friend.context().close()
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
  await goTo(page, 'Items')
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
  await goTo(page, 'Items')
  await expect(itemsPage(page)).toContainText('28 in your Catalog')
})
