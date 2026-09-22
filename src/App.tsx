import { useEffect, useMemo, useState } from 'react'
import { useAppState } from './app/useAppState.ts'
import { gridSections } from './domain/index.ts'
import { detectLocale, messages } from './i18n/index.ts'
import { RoundPage } from './ui/RoundPage.tsx'

export function App() {
  const [locale] = useState(() => detectLocale(navigator.language))
  const { state, addItem } = useAppState(locale)
  const sections = useMemo(() => gridSections(state.catalog, locale), [state.catalog, locale])
  const t = messages[locale]

  useEffect(() => {
    document.documentElement.lang = locale
    document.title = t.appName
  }, [locale, t])

  return <RoundPage sections={sections} round={state.round} t={t} onAdd={addItem} />
}
