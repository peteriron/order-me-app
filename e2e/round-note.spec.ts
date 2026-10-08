import { expect, test, type Page } from '@playwright/test'

declare global {
  interface Window {
    shared: string[]
    copied: string[]
  }
}

const roundBar = (page: Page) => page.getByRole('region', { name: 'Round total' })
const showPage = (page: Page) => page.getByRole('region', { name: 'Round for the counter' })
const table = (page: Page) => showPage(page).getByLabel('Table')
const remark = (page: Page) => showPage(page).getByLabel('Remark')
const tab = (page: Page, name: string) => page.getByRole('navigation').getByRole('button', { name })

/** Records what the app shares or copies, in place of the phone's share sheet and clipboard. */
async function fakePhone(page: Page) {
  await page.addInitScript(() => {
    window.shared = []
    window.copied = []
    Object.defineProperty(navigator, 'share', { configurable: true, value: async ({ text }: { text: string }) => void window.shared.push(text) })
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async (text: string) => void window.copied.push(text) },
    })
  })
}

async function composeAndShow(page: Page) {
  for (const name of ['Duvel', 'Duvel', 'Cola']) await page.getByRole('button', { name: new RegExp(`^${name}(,|$)`) }).tap()
  await roundBar(page).getByRole('button', { name: 'Show' }).tap()
  await expect(table(page)).toBeVisible()
}

test.beforeEach(async ({ page }) => {
  await fakePhone(page)
  await page.goto('./')
})

test('the Show page has Table and Remark; the text share puts the table first and the remark last', async ({ page }) => {
  await composeAndShow(page)
  await table(page).fill('12')
  await remark(page).fill('No ice in the cola')
  await showPage(page).getByRole('button', { name: 'Share as text' }).tap()
  await expect.poll(() => page.evaluate(() => window.shared)).toEqual(['Table 12\n1× Cola\n2× Duvel\nTotal: 3\nRemark: No ice in the cola'])

  // Kept with the Round being composed, also after a reload.
  await page.reload()
  await tab(page, 'Show').tap()
  await expect(table(page)).toHaveValue('12')
  await expect(remark(page)).toHaveValue('No ice in the cola')
})

test('Ordered keeps them in History and starts the next Round without them; Order again brings them back', async ({ page }) => {
  await composeAndShow(page)
  await table(page).fill('12')
  await remark(page).fill('No ice')
  await roundBar(page).getByRole('button', { name: 'Ordered' }).tap()

  await tab(page, 'History').tap()
  const card = page.getByRole('region', { name: 'History' }).getByRole('article')
  await expect(card).toContainText('Table 12')
  await expect(card).toContainText('Remark: No ice')

  await card.getByRole('button', { name: 'Order again' }).tap()
  await tab(page, 'Show').tap()
  await expect(table(page)).toHaveValue('12')
  await expect(remark(page)).toHaveValue('No ice')
})

test('Clear empties them, and Undo brings them back', async ({ page }) => {
  await composeAndShow(page)
  await table(page).fill('12')
  await roundBar(page).getByRole('button', { name: 'Clear' }).tap()
  await page.getByRole('status').filter({ hasText: 'Round cleared' }).getByRole('button', { name: 'Undo' }).tap()
  await expect(table(page)).toHaveValue('12')

  await roundBar(page).getByRole('button', { name: 'Clear' }).tap()
  await tab(page, 'Round').tap()
  await page.getByRole('button', { name: /^Duvel(,|$)/ }).tap()
  await tab(page, 'Show').tap()
  await expect(table(page)).toHaveValue('')
})

test('Undo after Clear restores the earlier Round exactly, replacing anything added after', async ({ page }) => {
  await composeAndShow(page)
  await table(page).fill('12')

  await roundBar(page).getByRole('button', { name: 'Clear' }).tap()
  // While the "Round cleared · Undo" toast is up, start a new Round.
  await tab(page, 'Round').tap()
  await page.getByRole('button', { name: /^Chips(,|$)/ }).tap()
  await expect(page.getByRole('button', { name: 'Chips, 1 in round' })).toBeVisible()

  // The Undo restores the earlier Round whole; the later tap goes with it (not merged).
  await page.getByRole('status').filter({ hasText: 'Round cleared' }).getByRole('button', { name: 'Undo' }).tap()
  await expect(page.getByRole('button', { name: 'Duvel, 2 in round' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Chips', exact: true })).toBeVisible()
  await tab(page, 'Show').tap()
  await expect(table(page)).toHaveValue('12')
  await expect(page.getByTestId('show-total')).toHaveText('3')
})

test('the QR link carries them to a friend’s phone', async ({ page, browser }) => {
  await composeAndShow(page)
  await table(page).fill('Terras 3')
  await remark(page).fill('Two glasses')
  await showPage(page).getByRole('button', { name: 'Share as QR code' }).tap()
  const sheet = page.getByRole('dialog', { name: 'Share Round' })
  await sheet.getByRole('button', { name: 'Copy link' }).tap()
  await expect(sheet.getByRole('button', { name: '✓ Copied' })).toBeVisible()
  const link = (await page.evaluate(() => window.copied)).at(-1)!

  const friend = await (await browser.newContext(test.info().project.use)).newPage()
  await friend.goto(link)
  await expect(table(friend)).toHaveValue('Terras 3')
  await expect(remark(friend)).toHaveValue('Two glasses')
  await friend.context().close()
})
