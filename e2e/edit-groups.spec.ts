import { expect, test, type Page } from '@playwright/test'
import { touchDrag } from './touch.ts'

const items = (page: Page) => page.getByRole('region', { name: 'Items' })
const sheet = (page: Page) => page.getByRole('dialog')
const tab = (page: Page, name: string) => page.getByRole('navigation').getByRole('button', { name })
const itemsBoxes = (page: Page) => items(page).locator('.group-label')
const roundBoxes = (page: Page) => page.locator('section[aria-labelledby^="round-group"] .group-label')

test.beforeEach(async ({ page }) => {
  await page.goto('./')
  await tab(page, 'Settings').tap()
})

test('adds a group last, fills it from the Item sheet, and it shows as a box on the Round page', async ({ page }) => {
  await items(page).getByRole('button', { name: 'Add group' }).tap()
  await expect(sheet(page)).toHaveAccessibleName('Add group')
  await sheet(page).getByRole('button', { name: 'Add', exact: true }).tap()
  await expect(sheet(page)).toContainText('Give the group a name')
  await sheet(page).getByLabel('Group name').fill('  Cocktails ')
  await sheet(page).getByRole('button', { name: 'Add', exact: true }).tap()

  await expect(itemsBoxes(page)).toHaveText(['Soda', 'Beer', 'Hot', 'Wine', 'Strong', 'Snacks', 'Cocktails'])
  await expect(items(page).getByRole('region', { name: 'Cocktails' })).toContainText('No Items in this group yet')
  // An empty group has no box on the Round page yet.
  await tab(page, 'Round').tap()
  await expect(page.getByRole('region', { name: 'Cocktails' })).toHaveCount(0)

  await tab(page, 'Settings').tap()
  await items(page).getByRole('button', { name: 'Edit Gin & tonic' }).tap()
  await sheet(page).getByRole('radio', { name: 'Cocktails' }).check()
  await sheet(page).getByRole('button', { name: 'Save' }).tap()
  await tab(page, 'Round').tap()
  await expect(page.getByRole('region', { name: 'Cocktails' }).getByRole('button', { name: 'Gin & tonic' })).toBeVisible()

  await page.reload()
  await expect(roundBoxes(page)).toHaveText(['Soda', 'Beer', 'Hot', 'Wine', 'Strong', 'Snacks', 'Cocktails'])
})

test('renames a group; a renamed starter group no longer follows the language', async ({ page }) => {
  await items(page).getByRole('button', { name: 'Rename group Soda' }).tap()
  await expect(sheet(page).getByLabel('Group name')).toHaveValue('Soda')
  await sheet(page).getByLabel('Group name').fill('Fris')
  await sheet(page).getByRole('button', { name: 'Save' }).tap()
  await expect(itemsBoxes(page).first()).toHaveText('Fris')

  await page.getByRole('group', { name: 'Language' }).getByRole('radio', { name: 'Nederlands' }).check()
  await expect(itemsBoxes(page)).toHaveText(['Fris', 'Bier', 'Warm', 'Wijn', 'Sterk', 'Snacks'])
})

test('Cancel in the group sheet changes nothing', async ({ page }) => {
  await items(page).getByRole('button', { name: 'Rename group Beer' }).tap()
  await sheet(page).getByLabel('Group name').fill('Something else')
  await sheet(page).getByRole('button', { name: 'Cancel' }).tap()
  await expect(sheet(page)).toHaveCount(0)
  await expect(itemsBoxes(page).nth(1)).toHaveText('Beer')
})

test('deleting a group deletes its Items too, with Undo putting everything back', async ({ page }) => {
  await tab(page, 'Round').tap()
  await page.getByRole('button', { name: /^Red wine(,|$)/ }).tap()
  await page.getByRole('button', { name: /^Cola(,|$)/ }).tap()
  await tab(page, 'Settings').tap()

  await items(page).getByRole('button', { name: 'Delete group Wine' }).tap()
  await expect(page.getByRole('alertdialog')).toHaveCount(0)
  await expect(itemsBoxes(page)).toHaveText(['Soda', 'Beer', 'Hot', 'Strong', 'Snacks'])
  await expect(items(page)).toContainText('24 in your Catalog')
  await tab(page, 'Round').tap()
  await expect(page.getByRole('region', { name: 'Round total' })).toContainText('1 item')

  await page.getByRole('status').filter({ hasText: 'Wine deleted, with 4 Items' }).getByRole('button', { name: 'Undo' }).tap()
  await expect(roundBoxes(page)).toHaveText(['Soda', 'Beer', 'Hot', 'Wine', 'Strong', 'Snacks'])
  await expect(page.getByRole('button', { name: 'Red wine, 1 in round' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Round total' })).toContainText('2 items')
})

test('Move up and Move down reorder groups from the keyboard, and the grid follows', async ({ page }) => {
  const up = items(page).getByRole('button', { name: 'Move group Snacks up' })
  await up.focus()
  await page.keyboard.press('Enter')
  await expect(itemsBoxes(page)).toHaveText(['Soda', 'Beer', 'Hot', 'Wine', 'Snacks', 'Strong'])
  await expect(up).toBeFocused()
  await expect(items(page).getByRole('button', { name: 'Move group Soda up' })).toHaveAttribute('aria-disabled', 'true')

  await tab(page, 'Round').tap()
  await expect(roundBoxes(page)).toHaveText(['Soda', 'Beer', 'Hot', 'Wine', 'Snacks', 'Strong'])
})

test('dragging a box by its handle moves the group, without swiping the page', async ({ page }) => {
  const handle = items(page).getByRole('region', { name: 'Hot' }).locator('.group-handle')
  await handle.scrollIntoViewIfNeeded()
  const from = (await handle.boundingBox())!
  const beer = (await items(page).getByRole('region', { name: 'Beer' }).locator('.group-head').boundingBox())!
  await touchDrag(
    page,
    { x: from.x + from.width / 2, y: from.y + from.height / 2 },
    { x: from.x - 60, y: beer.y - 40 },
    { steps: 16, durationMs: 400 },
  )
  await expect(tab(page, 'Settings')).toHaveAttribute('aria-current', 'page')
  await expect(itemsBoxes(page)).toHaveText(['Soda', 'Hot', 'Beer', 'Wine', 'Strong', 'Snacks'])
})

test('a shared Items link carries the groups and their order', async ({ page, browser }) => {
  await items(page).getByRole('button', { name: 'Rename group Soda' }).tap()
  await sheet(page).getByLabel('Group name').fill('Fris')
  await sheet(page).getByRole('button', { name: 'Save' }).tap()
  const up = items(page).getByRole('button', { name: 'Move group Snacks up' })
  await up.focus()
  await page.keyboard.press('Enter')

  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
  await items(page).getByRole('button', { name: 'Share' }).tap()
  await page.getByRole('dialog').getByRole('button', { name: 'Copy link' }).tap()
  const link = await page.evaluate(() => navigator.clipboard.readText())

  const friend = await (await browser.newContext({ ...test.info().project.use })).newPage()
  await friend.goto(link)
  await expect(friend.locator('section[aria-labelledby^="round-group"] .group-label')).toHaveText([
    'Fris',
    'Beer',
    'Hot',
    'Wine',
    'Snacks',
    'Strong',
  ])
  await friend.context().close()
})
