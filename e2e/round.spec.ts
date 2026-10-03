import { expect, test } from '@playwright/test'

test('tapping tiles builds a Round that survives a reload', async ({ page }) => {
  await page.goto('./')
  await expect(page.getByRole('heading', { name: 'This round is on me' })).toBeVisible()

  const duvel = page.getByRole('button', { name: /^Duvel(,|$)/ })
  await duvel.tap()
  await duvel.tap()
  await page.getByRole('button', { name: /^Chips(,|$)/ }).tap()

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
    await expect(page.getByRole('heading', { name: 'Dit rondje is van mij' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Dranken' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Water plat' })).toBeVisible()
  })
})

test('the − corner removes one, and disappears with the badge at zero', async ({ page }) => {
  await page.goto('./')
  const duvel = page.getByRole('button', { name: /^Duvel(,|$)/ })
  await duvel.tap()
  await duvel.tap()

  const minus = page.getByRole('button', { name: 'Remove one Duvel' })
  // Layout size, not the on-screen box: the tile briefly scales to 0.94 after each tap.
  const size = await minus.evaluate((el: HTMLElement) => ({ width: el.offsetWidth, height: el.offsetHeight }))
  expect(size.width).toBeGreaterThanOrEqual(44)
  expect(size.height).toBeGreaterThanOrEqual(44)

  await minus.tap()
  await expect(page.getByRole('button', { name: 'Duvel, 1 in round' })).toBeVisible()

  await minus.tap()
  await expect(page.getByRole('button', { name: 'Duvel', exact: true })).toBeVisible()
  await expect(minus).toHaveCount(0)
})

test('the bottom bar shows the total, and Clear empties the Round, which stays empty after a reload', async ({ page }) => {
  await page.goto('./')
  const bar = page.getByRole('region', { name: 'Round total' })
  await expect(bar).toContainText('Tap a drink to start')
  await expect(bar.getByRole('button')).toHaveCount(0)

  await page.getByRole('button', { name: /^Duvel(,|$)/ }).tap()
  await page.getByRole('button', { name: /^Duvel(,|$)/ }).tap()
  await page.getByRole('button', { name: /^Cola(,|$)/ }).tap()
  await expect(bar).toContainText('3 items')
  await expect(bar.getByRole('button', { name: 'Show' })).toBeVisible()

  await bar.getByRole('button', { name: 'Clear' }).tap()
  await expect(bar).toContainText('Tap a drink to start')
  await expect(page.getByRole('button', { name: 'Duvel', exact: true })).toBeVisible()

  await page.reload()
  await expect(page.getByRole('region', { name: 'Round total' })).toContainText('Tap a drink to start')
})

test('the bottom bar is on the Round and Show pages only', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: /^Duvel(,|$)/ }).tap()
  const bar = page.getByRole('region', { name: 'Round total' })
  const footer = page.getByRole('navigation', { name: 'Pages' })
  // Off-screen pages are hidden from assistive tech, so only the current page's bar counts.
  for (const [tab, bars] of [['Show', 1], ['History', 0], ['Settings', 0], ['Round', 1]] as const) {
    await footer.getByRole('button', { name: tab }).tap()
    await expect(bar).toHaveCount(bars)
  }
})
