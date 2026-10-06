import type { CDPSession, Page } from '@playwright/test'

export type Point = { x: number; y: number }

/**
 * Drags one finger from `from` to `to`. Chromium gets real touch input through CDP, so the browser's own scroll
 * and tap handling take part. WebKit and Firefox have no CDP: there the same gesture is made with the mouse, which
 * the app's pointer handlers treat the same way (a left-button drag); a test that needs the grid to scroll uses the
 * wheel on those engines.
 * `holdMs` keeps the finger still after touching down, like someone who hesitates before flicking.
 */
export async function touchDrag(page: Page, from: Point, to: Point, { steps = 12, durationMs = 240, holdMs = 0 } = {}) {
  let cdp: CDPSession | null = null
  try {
    cdp = await page.context().newCDPSession(page)
  } catch {
    cdp = null
  }

  if (!cdp) {
    const at = (i: number) => ({
      x: from.x + ((to.x - from.x) * i) / steps,
      y: from.y + ((to.y - from.y) * i) / steps,
    })
    await page.mouse.move(from.x, from.y)
    await page.mouse.down()
    if (holdMs) await page.waitForTimeout(holdMs)
    for (let i = 1; i <= steps; i++) {
      await page.waitForTimeout(durationMs / steps)
      const p = at(i)
      await page.mouse.move(p.x, p.y)
    }
    await page.mouse.up()
    return
  }

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
