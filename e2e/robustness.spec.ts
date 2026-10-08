import { deflateRawSync } from 'node:zlib'
import { expect, test, type Page } from '@playwright/test'

const tab = (page: Page, name: string) => page.getByRole('navigation', { name: 'Pages' }).getByRole('button', { name })
const itemsPage = (page: Page) => page.getByRole('region', { name: 'Items' })

test.beforeEach(async ({ page }) => {
  await page.goto('./')
})

test('an Item sheet keeps Tab inside and gives focus back to the tile that opened it', async ({ page }) => {
  const newTile = page.getByRole('button', { name: 'New Item' })
  await newTile.focus()
  await page.keyboard.press('Enter')

  const sheet = page.getByRole('dialog')
  // Adding starts on the name field: the first thing to do is type a name.
  await expect(sheet.getByLabel('Name')).toBeFocused()

  // Tab from the last control wraps to the first; Shift+Tab from the first wraps to the last.
  const addToRound = sheet.getByRole('button', { name: 'Add to Round', exact: true })
  await addToRound.focus()
  await page.keyboard.press('Tab')
  await expect(sheet.getByLabel('Name')).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(addToRound).toBeFocused()

  // Closing puts focus back where it was, so a thumb can carry on from the tile.
  await page.keyboard.press('Escape')
  await expect(sheet).toHaveCount(0)
  await expect(newTile).toBeFocused()
})

test('a confirm dialog starts on Cancel and traps Tab', async ({ page }) => {
  await tab(page, 'Settings').tap()
  await page.getByRole('region', { name: 'General' }).getByRole('button', { name: 'Reset app' }).click()

  const dialog = page.getByRole('alertdialog')
  await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(dialog.getByRole('button', { name: 'Reset', exact: true })).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused()

  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
})

test('a share sheet that can no longer build its link shows the error and drops the old QR code', async ({ page }) => {
  await tab(page, 'Settings').tap()
  await itemsPage(page).getByRole('button', { name: 'Share', exact: true }).tap()
  const sheet = page.getByRole('dialog', { name: 'Share Items' })
  await expect(sheet.getByRole('img')).toBeVisible()

  // The link can't be built any more...
  await page.evaluate(() => {
    Object.defineProperty(window, 'CompressionStream', { configurable: true, value: undefined })
  })
  // ...and a shared Catalog link replaces the Catalog under the open sheet.
  const payload = deflateRawSync(Buffer.from('2\nd🍺\tDuvel')).toString('base64url')
  await page.evaluate((hash) => {
    location.hash = hash
  }, `#items=${payload}`)
  await page.getByRole('alertdialog').getByRole('button', { name: 'Replace' }).click()

  // The old QR code is gone with the failed rebuild, so the sheet can't show two truths.
  await expect(sheet.getByText('Couldn’t prepare the link.')).toBeVisible()
  await expect(sheet.getByRole('img')).toHaveCount(0)
  await expect(sheet.getByRole('button', { name: 'Copy link' })).toBeDisabled()
})

test('a confirmation over an open sheet starts on Cancel, and Escape closes only the dialog', async ({ page }) => {
  await tab(page, 'Settings').tap()
  await itemsPage(page).getByRole('button', { name: 'Share', exact: true }).tap()
  const sheet = page.getByRole('dialog', { name: 'Share Items' })
  await expect(sheet).toBeVisible()

  // A shared Catalog link raises a confirmation while the sheet is open: the dialog is on top.
  const payload = deflateRawSync(Buffer.from('2\nd🍺\tDuvel')).toString('base64url')
  await page.evaluate((hash) => {
    location.hash = hash
  }, `#items=${payload}`)
  const dialog = page.getByRole('alertdialog')
  await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused()

  // Escape closes the dialog only: the sheet underneath survives the same keypress.
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(sheet).toBeVisible()

  // The sheet's own Escape still closes it.
  await page.keyboard.press('Escape')
  await expect(sheet).toHaveCount(0)
})

test('when this phone refuses to save, the app says so once', async ({ page }) => {
  await page.addInitScript(() => {
    // oxlint-disable-next-line typescript/unbound-method -- invoked with .call(this), so `this` is not lost
    const original = Storage.prototype.setItem
    Storage.prototype.setItem = function (key: string, value: string) {
      if (key === 'order-me') throw new DOMException('Storage full', 'QuotaExceededError')
      return original.call(this, key, value)
    }
  })
  await page.clock.install()
  await page.reload()

  const toast = page.getByRole('status').filter({ hasText: 'let the app save' })
  await expect(toast).toBeVisible()
  // It goes away and doesn't come back on the next failed save.
  await page.clock.fastForward(6_000)
  await expect(page.getByRole('status')).toHaveCount(0)
  await page.getByRole('button', { name: /^Cola(,|$)/ }).tap()
  await expect(page.getByRole('status')).toHaveCount(0)
})

test('the crash screen offers Reset, which brings the app back', async ({ page }) => {
  // Break an API the screens use while rendering...
  await page.evaluate(() => {
    Object.defineProperty(Intl, 'DateTimeFormat', {
      configurable: true,
      value: function () {
        throw new Error('boom')
      },
    })
  })
  // ...then have a shared Round add a new Item, which re-renders Settings (and its version line): a render error.
  const payload = deflateRawSync(Buffer.from('2\n1\td🍺\tKriek')).toString('base64url')
  await page.evaluate((hash) => {
    location.hash = hash
  }, `#round=${payload}`)

  await expect(page.getByRole('heading', { name: 'Something went wrong' })).toBeVisible()
  const reloaded = page.waitForEvent('load')
  await page.getByRole('button', { name: 'Reset the app' }).click()
  await reloaded
  // The way out when the crash comes from the saved state: a clean first launch.
  await expect(page.getByRole('heading', { name: 'This round is on me' })).toBeVisible()
})
