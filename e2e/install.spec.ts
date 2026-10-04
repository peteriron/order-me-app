import { expect, test, type Page } from '@playwright/test'

declare global {
  interface Window {
    prompted: number
  }
}

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'

const addToHome = (page: Page) => page.getByRole('button', { name: 'Add to Home Screen' })

async function openSettings(page: Page) {
  await page.goto('./')
  await page.getByRole('navigation').getByRole('button', { name: 'Settings' }).tap()
}

test.describe('Chrome on Android', () => {
  test('the button appears once Chrome offers to install, and opens Chrome’s own prompt', async ({ page }) => {
    await openSettings(page)
    await expect(page.getByRole('button', { name: 'Reset app' })).toBeVisible()
    await expect(addToHome(page)).toHaveCount(0)

    // What Chrome does when the app can be installed.
    await page.evaluate(() => {
      window.prompted = 0
      const offer = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
        prompt: async () => void window.prompted++,
        userChoice: Promise.resolve({ outcome: 'accepted' }),
      })
      window.dispatchEvent(offer)
    })
    await addToHome(page).tap()
    await expect.poll(() => page.evaluate(() => window.prompted)).toBe(1)
    // A prompt can be shown only once.
    await expect(addToHome(page)).toHaveCount(0)
  })
})

test.describe('Safari on iPhone', () => {
  test.use({ userAgent: IPHONE })

  test('the button opens the Add to Home Screen guide', async ({ page }) => {
    await openSettings(page)
    await addToHome(page).tap()
    const guide = page.getByRole('dialog', { name: 'Add to Home Screen' })
    await expect(guide).toContainText('tap Share')
    await expect(guide).toContainText('choose “Add to Home Screen”')
    await guide.getByRole('button', { name: 'Close' }).tap()
    await expect(guide).toHaveCount(0)
  })
})
