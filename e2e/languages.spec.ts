import { expect, test } from '@playwright/test'

// Every shipped language on a Pixel 7: the tab labels fit, and starter Item names don't break inside a word.
// Word length is font-dependent (CI's fallback font is wider than a phone's), so a word too wide for its tile on
// this machine's font is skipped here; starter.test.ts caps word length so they fit a phone.
for (const locale of ['nl-BE', 'en-GB', 'fr-BE', 'de-DE', 'it-IT', 'es-ES']) {
  test.describe(`on a ${locale} phone`, () => {
    test.use({ locale })

    test('tab labels fit and starter Item names wrap only between words', async ({ page }) => {
      await page.goto('./')
      await expect(page.locator('.tile-name').first()).toBeVisible()

      const cutTabs = await page
        .locator('.tab-label')
        .evaluateAll((els) => els.filter((el) => el.scrollWidth > el.clientWidth).map((el) => el.textContent))
      expect(cutTabs).toEqual([])

      // A word split across lines shows as one text node range with more than one line box.
      const brokenWords = await page.locator('.tile-name').evaluateAll((els) =>
        els.flatMap((el) => {
          const text = el.firstChild
          if (!text || text.nodeType !== Node.TEXT_NODE) return []
          const words = [...(text.textContent ?? '').matchAll(/\S+/g)]
          return words
            .filter((w) => {
              // Too wide for the tile even on a line of its own, in this machine's font: nothing to prove.
              const probe = document.createElement('span')
              probe.style.whiteSpace = 'nowrap'
              probe.textContent = w[0]
              el.append(probe)
              const width = probe.getBoundingClientRect().width
              probe.remove()
              if (width > el.clientWidth) return false
              const range = document.createRange()
              range.setStart(text, w.index)
              range.setEnd(text, w.index + w[0].length)
              return new Set([...range.getClientRects()].map((r) => Math.round(r.top))).size > 1
            })
            .map((w) => w[0])
        }),
      )
      expect(brokenWords).toEqual([])
    })
  })
}
