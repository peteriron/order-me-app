import { useEffect, useSyncExternalStore } from 'react'
import type { ThemeSetting } from './settings.ts'

const LIGHT_QUERY = '(prefers-color-scheme: light)'
/** Browser/status bar colour per theme; matches --bg. */
const THEME_COLOR = { dark: '#0e0e10', light: '#fafaf9' } as const

function subscribe(onChange: () => void) {
  const query = window.matchMedia(LIGHT_QUERY)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

/** Applies the theme setting to <html data-theme>, following the phone live when set to 'system'. */
export function useTheme(setting: ThemeSetting) {
  const phonePrefersLight = useSyncExternalStore(subscribe, () => window.matchMedia(LIGHT_QUERY).matches)
  const theme = setting === 'system' ? (phonePrefersLight ? 'light' : 'dark') : setting

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme])
  }, [theme])
}
