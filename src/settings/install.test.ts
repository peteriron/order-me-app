import { describe, expect, it } from 'vitest'
import { installMode, isIos, type InstallHost } from './install.ts'

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
const IPAD_DESKTOP_MODE = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15'
const ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'

const host = (over: Partial<InstallHost> = {}): InstallHost => ({
  standalone: false,
  userAgent: ANDROID,
  maxTouchPoints: 5,
  canPrompt: false,
  ...over,
})

describe('the Add to Home Screen button', () => {
  it('installs directly where the browser offers its own install prompt (Chrome on Android)', () => {
    expect(installMode(host({ canPrompt: true }))).toBe('prompt')
  })

  it('opens the guide on an iPhone or iPad, where no install prompt exists', () => {
    expect(installMode(host({ userAgent: IPHONE }))).toBe('guide')
    expect(installMode(host({ userAgent: IPAD_DESKTOP_MODE, maxTouchPoints: 5 }))).toBe('guide')
  })

  it('is hidden once the app runs from the home screen', () => {
    expect(installMode(host({ standalone: true, canPrompt: true }))).toBe('none')
    expect(installMode(host({ standalone: true, userAgent: IPHONE }))).toBe('none')
  })

  it('is hidden where the app can’t be installed, or the browser hasn’t offered it yet', () => {
    expect(installMode(host())).toBe('none')
  })
})

describe('telling an iPhone or iPad', () => {
  it('tells an iPad asking for the desktop site from a Mac by its touch screen', () => {
    expect(isIos(IPAD_DESKTOP_MODE, 5)).toBe(true)
    expect(isIos(IPAD_DESKTOP_MODE, 0)).toBe(false)
    expect(isIos(ANDROID, 5)).toBe(false)
  })
})
