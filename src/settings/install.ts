import { useSyncExternalStore } from 'react'

/**
 * What the Add to Home Screen button does: open the browser's own install prompt (Chrome on Android), open the
 * Add to Home Screen guide (iPhone and iPad, which have no install prompt), or nothing (already installed, or the
 * browser can't install it).
 */
export type InstallMode = 'prompt' | 'guide' | 'none'

export interface InstallHost {
  /** True when the app runs from the home screen. */
  standalone: boolean
  userAgent: string
  maxTouchPoints: number
  /** True once the browser has offered its install prompt (beforeinstallprompt). */
  canPrompt: boolean
}

/** iPhone or iPad. An iPad asks for the desktop site as a Mac, but a Mac has no touch screen. */
export function isIos(userAgent: string, maxTouchPoints: number): boolean {
  return /iPhone|iPad|iPod/.test(userAgent) || (/Macintosh/.test(userAgent) && maxTouchPoints > 1)
}

export function installMode({ standalone, userAgent, maxTouchPoints, canPrompt }: InstallHost): InstallMode {
  if (standalone) return 'none'
  if (canPrompt) return 'prompt'
  return isIos(userAgent, maxTouchPoints) ? 'guide' : 'none'
}

/** Chrome's install prompt event; not in TypeScript's DOM types. */
interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferred: InstallPromptEvent | null = null
let installed = false
/** Chrome's prompt can be opened only once per event; a double tap must not call prompt() twice. */
let prompting = false
const listeners = new Set<() => void>()
const changed = () => listeners.forEach((l) => l())

/**
 * Keeps Chrome's install prompt for the button. Called once at startup: Chrome may offer it before Settings is
 * ever opened, and offers it only once per page load.
 */
export function listenForInstall(win: Window) {
  win.addEventListener('beforeinstallprompt', (e) => {
    // Keep Chrome's own mini-bar away; the button in Settings offers it instead.
    e.preventDefault()
    deferred = e as InstallPromptEvent
    changed()
  })
  win.addEventListener('appinstalled', () => {
    deferred = null
    installed = true
    changed()
  })
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function currentMode(): InstallMode {
  const standalone =
    installed ||
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  return installMode({ standalone, userAgent: navigator.userAgent, maxTouchPoints: navigator.maxTouchPoints, canPrompt: deferred !== null })
}

/** The Add to Home Screen button's mode, and the install prompt to open when it's 'prompt'. */
export function useInstall() {
  const mode = useSyncExternalStore(subscribe, currentMode)
  const prompt = async () => {
    const event = deferred
    if (!event || prompting) return
    prompting = true
    try {
      await event.prompt()
    } catch {
      // Refused (e.g. a second prompt): the button hides itself below.
    } finally {
      prompting = false
      // The prompt can be shown only once; Chrome offers a new one later if it was dismissed.
      deferred = null
      changed()
    }
  }
  return { mode, prompt }
}
