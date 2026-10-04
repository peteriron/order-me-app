import { expect, test, type Locator, type Page } from '@playwright/test'

const tile = (page: Page, name: string) =>
  page.getByRole('button', { name: new RegExp(`^${name}(,|$)`) }).locator('xpath=..')

/** What the tile's background is drawn with, as the browser computed it. */
const look = (tile: Locator) =>
  tile.evaluate((el) => {
    const style = getComputedStyle(el)
    return {
      image: style.backgroundImage,
      colour: style.backgroundColor,
      border: style.borderTopColor,
      tint: parseFloat(style.getPropertyValue('--tint')),
    }
  })

test.beforeEach(async ({ page }) => {
  await page.goto('./')
})

test('Item tiles get a gradient from their emoji colour; "+ New" stays plain', async ({ page }) => {
  const cola = await look(tile(page, 'Cola'))
  expect(cola.image).toMatch(/^linear-gradient/)
  expect(cola.tint).toBeGreaterThan(0)

  const add = await look(page.getByRole('button', { name: 'New' }).locator('xpath=..'))
  expect(add.image).toBe('none')
})

test('in the Round a tile’s colour steps up, with the amber border and no amber background', async ({ page }) => {
  const before = await look(tile(page, 'Cola'))
  await page.getByRole('button', { name: /^Cola(,|$)/ }).tap()
  const counted = tile(page, 'Cola')
  await expect(counted).toHaveClass(/has-count/)
  // The step fades in 160 ms.
  await expect.poll(async () => (await look(counted)).tint).toBeGreaterThan(before.tint)

  const after = await look(counted)
  expect(after.image).toMatch(/^linear-gradient/)
  expect(after.border).not.toBe(before.border)
  expect(after.colour).toBe('rgba(0, 0, 0, 0)')
})

test('Settings rows stay plain', async ({ page }) => {
  await page.getByRole('navigation').getByRole('button', { name: 'Settings' }).tap()
  const row = page.getByRole('region', { name: 'Settings' }).getByText('Cola', { exact: true }).first()
  const image = await row.evaluate((el) => {
    for (let node: Element | null = el; node; node = node.parentElement) {
      if (getComputedStyle(node).backgroundImage !== 'none') return getComputedStyle(node).backgroundImage
    }
    return 'none'
  })
  expect(image).toBe('none')
})
