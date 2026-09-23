import { expect, test, type Page } from '@playwright/test'

interface SeedRound {
  daysAgo: number
  time: [hour: number, minute: number]
  /** [catalog Item name, count, optional name as it was when placed] */
  lines: [string, number, string?][]
}

/** Writes placed Rounds straight into the saved app state (dates relative to the browser's today), then reloads. */
async function seedHistory(page: Page, rounds: SeedRound[]) {
  await page.evaluate((rounds) => {
    const state = JSON.parse(localStorage.getItem('order-me')!)
    const byName = (name: string) => state.catalog.find((i: { name: string }) => i.name === name)
    state.history = rounds.map((r, n) => {
      const placedAt = new Date()
      placedAt.setDate(placedAt.getDate() - r.daysAgo)
      placedAt.setHours(r.time[0], r.time[1], 0, 0)
      return {
        id: `seed-${n}`,
        placedAt: placedAt.toISOString(),
        lines: r.lines.map(([name, count, nameThen]) => {
          const item = byName(name)
          return { itemId: item.id, name: nameThen ?? item.name, category: item.category, emoji: item.emoji, count }
        }),
      }
    })
    localStorage.setItem('order-me', JSON.stringify(state))
  }, rounds)
  await page.reload()
}

const historyPage = (page: Page) => page.getByRole('region', { name: 'History' })

async function goToHistory(page: Page) {
  await page.getByRole('navigation', { name: 'Pages' }).getByRole('button', { name: 'History' }).tap()
  await expect(page.getByRole('heading', { name: 'History', level: 1 })).toBeInViewport()
}

test.beforeEach(async ({ page }) => {
  await page.goto('./')
})

test('explains that placed Rounds show up here when there are none yet', async ({ page }) => {
  await goToHistory(page)
  await expect(historyPage(page)).toContainText('No Rounds yet')
})

test('a Round marked as ordered shows up under Today with its time, total and summary', async ({ page }) => {
  for (const name of ['Duvel', 'Duvel', 'Cola']) await page.getByRole('button', { name: new RegExp(`^${name}`) }).tap()
  await page.getByRole('button', { name: 'Show' }).tap()
  await page.getByRole('button', { name: 'Mark as ordered' }).tap()
  await goToHistory(page)

  await expect(historyPage(page).getByRole('heading', { level: 2 })).toHaveText(['Today'])
  const card = historyPage(page).getByRole('article')
  await expect(card).toHaveCount(1)
  await expect(card).toContainText(/\d{2}:\d{2}/)
  await expect(card).toContainText('3 items')
  // Lines follow grid order (as in the Counter view), not the order they were tapped.
  await expect(card).toContainText('1 Cola · 2 Duvel')
})

test('groups Rounds by day, newest first: Today, Yesterday, then the date', async ({ page }) => {
  await seedHistory(page, [
    { daysAgo: 0, time: [0, 30], lines: [['Duvel', 1]] },
    { daysAgo: 1, time: [22, 15], lines: [['Cola', 2]] },
    { daysAgo: 1, time: [20, 5], lines: [['Beer', 4]] },
    { daysAgo: 5, time: [21, 0], lines: [['Red wine', 2]] },
  ])
  await goToHistory(page)

  const fiveDaysAgo = await page.evaluate(() => {
    const d = new Date()
    d.setDate(d.getDate() - 5)
    return new Intl.DateTimeFormat(navigator.language, { weekday: 'long', day: 'numeric', month: 'long' }).format(d)
  })
  await expect(historyPage(page).getByRole('heading', { level: 2 })).toHaveText(['Today', 'Yesterday', fiveDaysAgo])
  await expect(historyPage(page).getByRole('article')).toHaveText([/00:30/, /22:15/, /20:05/, /21:00/])
})

test('tapping a card shows every line with its emoji, and tapping again folds it', async ({ page }) => {
  await seedHistory(page, [{ daysAgo: 0, time: [0, 30], lines: [['Duvel', 2], ['Chips', 1]] }])
  await goToHistory(page)

  const summary = historyPage(page).getByRole('button', { name: '2 Duvel · 1 Chips' })
  await summary.tap()
  await expect(summary).toHaveAttribute('aria-expanded', 'true')
  await expect(historyPage(page).getByRole('listitem')).toHaveText([/2\s*🍺\s*Duvel/, /1\s*🥔\s*Chips/])

  await summary.tap()
  await expect(summary).toHaveAttribute('aria-expanded', 'false')
  await expect(historyPage(page).getByRole('listitem')).toHaveCount(0)
})

test('shows what was ordered then, even if the Item has been renamed since', async ({ page }) => {
  await seedHistory(page, [{ daysAgo: 0, time: [0, 30], lines: [['Duvel', 3, 'Duvel Tripel']] }])
  await goToHistory(page)
  await expect(historyPage(page).getByRole('article')).toContainText('3 Duvel Tripel')
})

test('deleting a Round asks first, and Cancel keeps it', async ({ page }) => {
  await seedHistory(page, [{ daysAgo: 0, time: [0, 30], lines: [['Duvel', 1]] }])
  await goToHistory(page)

  await historyPage(page).getByRole('button', { name: 'Delete Round from 00:30' }).tap()
  const dialog = page.getByRole('alertdialog', { name: 'Delete this Round from history?' })
  await dialog.getByRole('button', { name: 'Cancel' }).tap()

  await expect(dialog).toHaveCount(0)
  await expect(historyPage(page).getByRole('article')).toHaveCount(1)
})

test('a deleted Round is gone for good, and an empty history says so', async ({ page }) => {
  await seedHistory(page, [
    { daysAgo: 0, time: [0, 30], lines: [['Duvel', 1]] },
    { daysAgo: 1, time: [21, 0], lines: [['Cola', 1]] },
  ])
  await goToHistory(page)

  await historyPage(page).getByRole('button', { name: 'Delete Round from 00:30' }).tap()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).tap()
  await expect(historyPage(page).getByRole('article')).toHaveCount(1)

  await page.reload()
  await goToHistory(page)
  await expect(historyPage(page).getByRole('article')).toHaveCount(1)
  await historyPage(page).getByRole('button', { name: 'Delete Round from 21:00' }).tap()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).tap()
  await expect(historyPage(page)).toContainText('No Rounds yet')
})

test('Order again replaces the Round being composed and lands on the grid with the counts', async ({ page }) => {
  await page.getByRole('button', { name: /^Cola/ }).tap()
  await seedHistory(page, [{ daysAgo: 1, time: [21, 0], lines: [['Duvel', 3], ['Chips', 2]] }])
  await goToHistory(page)

  await historyPage(page).getByRole('article').getByRole('button', { name: 'Order again' }).tap()

  await expect(page.getByRole('heading', { name: 'This round is for me', level: 1 })).toBeInViewport()
  await expect(page.getByRole('button', { name: 'Duvel, 3 in round' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Chips, 2 in round' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Cola', exact: true })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Round total' })).toContainText('5 items')

  // The placed Round was copied, not reopened: it is still in history as it was.
  await goToHistory(page)
  await expect(historyPage(page).getByRole('article')).toContainText('3 Duvel · 2 Chips')
})

test('Order again skips Items that were deleted since, and says so', async ({ page }) => {
  await seedHistory(page, [{ daysAgo: 1, time: [21, 0], lines: [['Duvel', 3], ['Chips', 2]] }])
  await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem('order-me')!)
    state.catalog = state.catalog.filter((i: { name: string }) => i.name !== 'Duvel')
    localStorage.setItem('order-me', JSON.stringify(state))
  })
  await page.reload()
  await goToHistory(page)

  await historyPage(page).getByRole('button', { name: 'Order again' }).tap()

  await expect(page.getByRole('status').filter({ hasText: '1 item no longer exists and was skipped' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Chips, 2 in round' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Round total' })).toContainText('2 items')
})
