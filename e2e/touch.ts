import type { Page } from '@playwright/test'

export type Point = { x: number; y: number }

/**
 * Drags one finger from `from` to `to` using real touch input, so the browser's own scroll and tap handling take part.
 * `holdMs` keeps the finger still after touching down, like someone who hesitates before flicking.
 */
export async function touchDrag(page: Page, from: Point, to: Point, { steps = 12, durationMs = 240, holdMs = 0 } = {}) {
  const cdp = await page.context().newCDPSession(page)
  const at = (p: Point) => [{ x: p.x, y: p.y }]
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: at(from) })
  if (holdMs) await page.waitForTimeout(holdMs)
  for (let i = 1; i <= steps; i++) {
    await page.waitForTimeout(durationMs / steps)
    const p = { x: from.x + ((to.x - from.x) * i) / steps, y: from.y + ((to.y - from.y) * i) / steps }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: at(p) })
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await cdp.detach()
}
