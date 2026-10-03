import { expect, test, type Browser, type Page } from '@playwright/test'

declare global {
  interface Window {
    copied: string[]
  }
}

const roundBar = (page: Page) => page.getByRole('region', { name: 'Round total' })
const showPage = (page: Page) => page.getByRole('region', { name: 'Round for the counter' })
const shareRound = (page: Page) => page.getByRole('dialog', { name: 'Share Round' })
const tab = (page: Page, name: string) => page.getByRole('navigation').getByRole('button', { name })

async function tapTiles(page: Page, ...names: string[]) {
  for (const name of names) await page.getByRole('button', { name: new RegExp(`^${name}(,|$)`) }).tap()
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

async function addItem(page: Page, name: string) {
  await tab(page, 'Settings').tap()
  await page.getByRole('region', { name: 'Items' }).getByRole('button', { name: 'Add Item' }).tap()
  await page.getByRole('dialog').getByLabel('Name').fill(name)
  await page.getByRole('dialog').getByRole('button', { name: 'Add', exact: true }).tap()
  await tab(page, 'Round').tap()
}

/** The link from Share Round on the Show page. */
async function copyRoundLink(page: Page): Promise<string> {
  await roundBar(page).getByRole('button', { name: 'Show' }).tap()
  await showPage(page).getByRole('button', { name: 'Share' }).tap()
  await shareRound(page).getByRole('button', { name: 'Copy link' }).tap()
  await shareRound(page).getByRole('button', { name: 'Done' }).tap()
  return (await page.evaluate(() => window.copied)).at(-1)!
}

async function freshPhone(browser: Browser, locale = 'en-GB'): Promise<Page> {
  return (await browser.newContext({ ...test.info().project.use, locale })).newPage()
}

test.beforeEach(async ({ page }) => {
  await fakeClipboard(page)
  await page.goto('./')
})

test('Share on the Show page opens Share Round: a QR code, Copy link and Share as text', async ({ page }) => {
  await tapTiles(page, 'Cola', 'Cola', 'Duvel')
  await roundBar(page).getByRole('button', { name: 'Show' }).tap()
  await showPage(page).getByRole('button', { name: 'Share' }).tap()

  await expect(shareRound(page).getByRole('img', { name: 'QR code with your Round of 3 items' })).toBeVisible()
  await expect(shareRound(page)).toContainText('Scan to open the Round')
  await expect(shareRound(page).getByRole('button', { name: 'Share as text' })).toBeVisible()
  await expect(shareRound(page).getByRole('button', { name: 'Save image' })).toHaveCount(0)

  await shareRound(page).getByRole('button', { name: 'Copy link' }).tap()
  await expect(page.getByRole('status').filter({ hasText: 'Copied to clipboard' })).toBeVisible()
  expect((await page.evaluate(() => window.copied))[0]).toMatch(/\/order-me-app\/#round=[\w-]+$/)
})

test('a fresh phone opening the link lands on Show with the Round, in Dutch, with the missing drink added', async ({ page, browser }) => {
  await addItem(page, 'Kriek')
  await tapTiles(page, 'Cola', 'Cola', 'Cola', 'Kriek', 'Chips')
  const link = await copyRoundLink(page)

  const friend = await freshPhone(browser, 'nl-BE')
  await friend.goto(link)
  await expect(tab(friend, 'Toon')).toHaveAttribute('aria-current', 'page')
  const toon = friend.getByRole('region', { name: 'Rondje voor de toog' })
  await expect(toon.getByRole('listitem')).toHaveText([/^3\s*×\s*🥤\s*Cola/, /^1\s*×\s*🍺\s*Kriek/, /^1\s*×\s*🥔\s*Chips/])
  expect(new URL(friend.url()).hash).toBe('')
  // Kriek wasn't in the friend's Items: it is now.
  await tab(friend, 'Instellingen').tap()
  await expect(friend.getByRole('region', { name: 'Items' }).getByRole('button', { name: 'Kriek bewerken' })).toBeVisible()
  await friend.context().close()
})

test('it replaces the friend’s own Round without asking, and Undo brings theirs back', async ({ page, browser }) => {
  await tapTiles(page, 'Cola', 'Cola')
  const link = await copyRoundLink(page)

  const friend = await freshPhone(browser)
  await friend.goto('./')
  await tapTiles(friend, 'Duvel', 'Duvel', 'Duvel')
  await friend.goto(link)

  await expect(friend.getByRole('alertdialog')).toHaveCount(0)
  await expect(showPage(friend).getByRole('listitem')).toHaveText([/^2\s*×\s*🥤\s*Cola/])
  const toast = friend.getByRole('status').filter({ hasText: 'Round received' })
  await toast.getByRole('button', { name: 'Undo' }).tap()
  await expect(showPage(friend).getByRole('listitem')).toHaveText([/^3\s*×\s*🍺\s*Duvel/])
  await friend.context().close()
})

test('a broken Round link is ignored with a short note', async ({ page }) => {
  await tapTiles(page, 'Duvel')
  await page.goto('./#round=broken')
  await expect(page.getByRole('status').filter({ hasText: 'That share link couldn’t be read' })).toBeVisible()
  expect(new URL(page.url()).hash).toBe('')
  await expect(roundBar(page)).toContainText('1 item')
})
