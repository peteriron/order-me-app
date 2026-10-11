import { expect, test, type Page } from '@playwright/test'

const boxNames = (page: Page) =>
  page.locator('section[aria-labelledby^="round-group"] .group-label').allTextContents()

test('a fresh install shows the six starter groups as boxes, each with its own faint colour', async ({ page }) => {
  await page.goto('./')
  // The labels are upper-cased by CSS; their text is the group name.
  expect(await boxNames(page)).toEqual(['Soda', 'Beer', 'Hot', 'Wine', 'Strong', 'Snacks'])
  const backgrounds = await page
    .locator('section[aria-labelledby^="round-group"]')
    .evaluateAll((boxes) => boxes.map((box) => getComputedStyle(box).backgroundColor))
  expect(new Set(backgrounds).size).toBe(6)
  // The label is smaller than the 13px section label it replaces.
  const size = await page.locator('.group-label').first().evaluate((el) => parseFloat(getComputedStyle(el).fontSize))
  expect(size).toBeLessThan(13)
})

test('updating from v5 puts starter Items in their group, own drinks in Other drinks and own snacks in Snacks', async ({ page }) => {
  await page.addInitScript(() => {
    if (localStorage.getItem('order-me')) return
    const v5 = {
      version: 6,
      catalog: [
        { id: 'duvel', name: 'Duvel', category: 'drink', emoji: '🍺', starter: 'duvel' },
        { id: 'kriek', name: 'Kriek', category: 'drink', emoji: '🍒' },
        { id: 'pretzel', name: 'Pretzel', category: 'snack', emoji: '🥨' },
      ],
      round: { counts: { kriek: 2 } },
      history: [],
      settings: { language: 'en', theme: 'dark' },
      pins: [],
      showOrder: [],
    }
    localStorage.setItem('order-me', JSON.stringify(v5))
  })
  await page.goto('./')
  // Empty groups have no box on the Round page.
  expect(await boxNames(page)).toEqual(['Beer', 'Other drinks', 'Snacks'])
  await expect(page.getByRole('region', { name: 'Other drinks' }).getByRole('button', { name: 'Kriek, 2 in round' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Snacks' }).getByRole('button', { name: 'Pretzel', exact: true })).toBeVisible()

  // The Items page shows every group, empty ones too.
  await page.getByRole('navigation').getByRole('button', { name: 'Settings' }).tap()
  const items = page.getByRole('region', { name: 'Items' })
  await expect(items.locator('.group-label')).toHaveText(['Soda', 'Beer', 'Hot', 'Wine', 'Strong', 'Other drinks', 'Snacks'])
  await expect(items.getByRole('region', { name: 'Soda' })).toContainText('No Items in this group yet')
})
