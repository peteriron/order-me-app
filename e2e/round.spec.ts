import { expect, test } from '@playwright/test'

test('tapping tiles builds a Round that survives a reload', async ({ page }) => {
  await page.goto('./')
  await expect(page.getByRole('heading', { name: 'This round is for me' })).toBeVisible()

  const duvel = page.getByRole('button', { name: /^Duvel/ })
  await duvel.tap()
  await duvel.tap()
  await page.getByRole('button', { name: /^Chips/ }).tap()

  await expect(page.getByRole('button', { name: 'Duvel, 2 in round' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Chips, 1 in round' })).toBeVisible()

  await page.reload()
  await expect(page.getByRole('button', { name: 'Duvel, 2 in round' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Chips, 1 in round' })).toBeVisible()
})

test.describe('on a Dutch phone', () => {
  test.use({ locale: 'nl-BE' })

  test('the starter Catalog and headings are in Dutch', async ({ page }) => {
    await page.goto('./')
    await expect(page.getByRole('heading', { name: 'Deze ronde is voor mij' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Dranken' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Plat water' })).toBeVisible()
  })
})
