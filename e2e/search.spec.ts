import { expect, test, type Page } from '@playwright/test'

const searchButton = (page: Page) => page.getByRole('button', { name: 'Search' })
const searchField = (page: Page) => page.getByRole('searchbox', { name: 'Search' })
const closeSearch = (page: Page) => page.getByRole('button', { name: 'Close search' })
/** The names of the tiles on the Round page, in order (the + New tile last). */
const tileNames = (page: Page) =>
  page.locator('section[aria-labelledby^="round-heading"] .tile-name, .page .grid .tile-new .tile-name').allTextContents()

test.beforeEach(async ({ page }) => {
  await page.goto('./')
})

test('the search icon opens a field that filters the tiles live as you type', async ({ page }) => {
  await searchButton(page).tap()
  await expect(searchField(page)).toBeFocused()
  // The field takes the title's place; the heading stays for screen readers.
  await expect(page.getByRole('heading', { name: 'This round is on me', level: 1 })).toHaveClass('visually-hidden')

  await searchField(page).pressSequentially('col')
  await expect.poll(() => tileNames(page)).toEqual(['Cola', 'Cola Zero', 'New'])
  await expect(page.getByRole('heading', { name: 'Snacks' })).toHaveCount(0)

  await searchField(page).fill('ROSE')
  await expect.poll(() => tileNames(page)).toEqual(['Rosé wine', 'New'])
})

test('tapping a tile counts it and keeps the search, until the × closes it', async ({ page }) => {
  await searchButton(page).tap()
  await searchField(page).fill('col')
  await page.getByRole('button', { name: /^Cola(,|$)/ }).tap()
  await page.getByRole('button', { name: /^Cola(,|$)/ }).tap()
  await expect(page.getByRole('button', { name: 'Cola, 2 in round' })).toBeVisible()
  await expect(searchField(page)).toHaveValue('col')
  await expect(page.getByRole('region', { name: 'Round total' })).toContainText('2 items')

  await closeSearch(page).tap()
  await expect(searchField(page)).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'This round is on me', level: 1 })).toBeVisible()
  await expect(page.getByRole('button', { name: /^Duvel(,|$)/ })).toBeVisible()
  // Opening it again starts empty.
  await searchButton(page).tap()
  await expect(searchField(page)).toHaveValue('')
})

test('with no match it says so, and + New stays', async ({ page }) => {
  await searchButton(page).tap()
  await searchField(page).fill('Kriek')
  await expect(page.getByText('No drinks or snacks match “Kriek”')).toBeVisible()
  await expect.poll(() => tileNames(page)).toEqual(['New'])
})

test('Escape closes the search too', async ({ page }) => {
  await searchButton(page).tap()
  await searchField(page).fill('col')
  await searchField(page).press('Escape')
  await expect(searchField(page)).toHaveCount(0)
  await expect(page.getByRole('button', { name: /^Duvel(,|$)/ })).toBeVisible()
})
