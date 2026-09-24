import { expect, test, type Page } from '@playwright/test'

/** Waits until the service worker has installed and controls this page. */
async function waitForServiceWorker(page: Page) {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
    if (!navigator.serviceWorker.controller) {
      await new Promise((resolve) => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }))
    }
  })
}

async function manifest(page: Page) {
  const href = await page.locator('link[rel="manifest"]').getAttribute('href')
  const response = await page.request.get(new URL(href!, page.url()).href)
  expect(response.ok()).toBe(true)
  return response.json()
}

test.beforeEach(async ({ page }) => {
  await page.goto('./')
})

test('has a web app manifest for installing on the home screen', async ({ page }) => {
  expect(await manifest(page)).toMatchObject({
    name: 'This round is for me',
    short_name: 'OrderMe',
    display: 'standalone',
    orientation: 'portrait',
    theme_color: '#0e0e10',
    background_color: '#0e0e10',
    start_url: '/order-me-app/',
    scope: '/order-me-app/',
  })
})

test('every manifest icon exists at its declared size, including a maskable one', async ({ page }) => {
  const { icons } = await manifest(page)
  expect(icons.map((i: { sizes: string }) => i.sizes)).toEqual(expect.arrayContaining(['192x192', '512x512']))
  expect(icons.some((i: { purpose?: string }) => i.purpose?.includes('maskable'))).toBe(true)

  const manifestUrl = new URL((await page.locator('link[rel="manifest"]').getAttribute('href'))!, page.url())
  for (const icon of icons as { src: string; sizes: string }[]) {
    const src = new URL(icon.src, manifestUrl).href
    const size = await page.evaluate(async (src) => {
      const img = new Image()
      img.src = src
      await img.decode()
      return `${img.naturalWidth}x${img.naturalHeight}`
    }, src)
    expect(size, icon.src).toBe(icon.sizes)
  }
})

test('has an Apple touch icon and home-screen meta tags for iOS', async ({ page }) => {
  const touchIcon = await page.locator('link[rel="apple-touch-icon"]').getAttribute('href')
  expect((await page.request.get(new URL(touchIcon!, page.url()).href)).ok()).toBe(true)
  await expect(page.locator('meta[name="apple-mobile-web-app-title"]')).toHaveAttribute('content', 'OrderMe')
  await expect(page.locator('meta[name="apple-mobile-web-app-status-bar-style"]')).toHaveAttribute('content', 'black')
  await expect(page.locator('meta[name="mobile-web-app-capable"]')).toHaveAttribute('content', 'yes')
})

/**
 * Chrome's install requirements, checked through Chrome itself: it finds and parses the manifest without errors, and
 * a service worker controls the page. (Page.getInstallabilityErrors would be the direct check, but headless Chrome
 * always answers it with an empty list, even for about:blank, so it proves nothing here.)
 */
test('Chrome finds and parses the manifest without errors, and a service worker controls the page', async ({ page }) => {
  await waitForServiceWorker(page)
  const cdp = await page.context().newCDPSession(page)
  const { url, errors, data } = await cdp.send('Page.getAppManifest')

  expect(url).toMatch(/\/order-me-app\/manifest\.webmanifest$/)
  expect(errors).toEqual([])
  expect(JSON.parse(data!)).toMatchObject({ name: 'This round is for me', display: 'standalone' })
  expect(await page.evaluate(() => navigator.serviceWorker.controller?.scriptURL)).toMatch(/\/order-me-app\/sw\.js$/)
})

test('after the first visit it loads and works with no network', async ({ page, context }) => {
  await waitForServiceWorker(page)
  await context.setOffline(true)
  await page.reload()

  await expect(page.getByRole('heading', { name: 'This round is for me' })).toBeVisible()
  await page.getByRole('button', { name: /^Duvel/ }).tap()
  await expect(page.getByRole('button', { name: 'Duvel, 1 in round' })).toBeVisible()
  await context.setOffline(false)
})
