// Renders assets/icon.svg into the PNG icons the manifest and iOS need, using Playwright's Chromium.
// Run after changing the icon: node scripts/render-icons.mjs
import { readFileSync } from 'node:fs'
import { chromium } from '@playwright/test'

const svg = readFileSync(new URL('../assets/icon.svg', import.meta.url), 'utf8')
// Maskable and Apple icons must fill the square: the platform applies its own shape.
const fullBleed = svg.replace('rx="112"', 'rx="0"')

const outputs = [
  { file: 'icon-192.png', size: 192, svg },
  { file: 'icon-512.png', size: 512, svg },
  { file: 'icon-maskable-512.png', size: 512, svg: fullBleed },
  { file: 'apple-touch-icon.png', size: 180, svg: fullBleed },
]

const browser = await chromium.launch()
for (const { file, size, svg: source } of outputs) {
  const page = await browser.newPage({ viewport: { width: size, height: size } })
  await page.setContent(
    `<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${source}`,
  )
  await page.screenshot({ path: new URL(`../public/icons/${file}`, import.meta.url).pathname, omitBackground: true })
  await page.close()
  console.log(`public/icons/${file} (${size}×${size})`)
}
await browser.close()
