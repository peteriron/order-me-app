import { expect, test } from '@playwright/test'

declare global {
  interface Window {
    violations: string[]
  }
}

test('the Content-Security-Policy blocks nothing the app itself does', async ({ page }) => {
  await page.addInitScript(() => {
    window.violations = []
    document.addEventListener('securitypolicyviolation', (e) => window.violations.push(`${e.violatedDirective} ${e.blockedURI}`))
  })
  // A saved light theme: the inline theme script (allowed by its hash) must still apply it before first paint.
  await page.addInitScript(() => {
    const saved = {
      version: 3,
      catalog: [{ id: 'd', name: 'Duvel', category: 'drink', emoji: '🍺' }],
      round: { counts: {} },
      history: [],
      settings: { language: 'en', theme: 'light' },
    }
    if (!localStorage.getItem('order-me')) localStorage.setItem('order-me', JSON.stringify(saved))
  })
  await page.goto('./')
  await expect(page.locator('meta[http-equiv="Content-Security-Policy"]')).toHaveCount(1)
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')

  // Round → Show → QR sheet (a data: image).
  const nav = page.getByRole('navigation')
  await page.getByRole('button', { name: /^Duvel(,|$)/ }).tap()
  await nav.getByRole('button', { name: 'Show' }).tap()
  await page.getByRole('button', { name: 'Share as QR code' }).tap()
  await expect(page.getByRole('dialog', { name: 'Share Round' }).getByRole('img')).toBeVisible()

  expect(await page.evaluate(() => window.violations)).toEqual([])
})
