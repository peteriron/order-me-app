import { useEffect, useMemo, useState } from 'react'
import { useAppState } from './app/useAppState.ts'
import { gridSections } from './domain/index.ts'
import { detectLocale, messages } from './i18n/index.ts'
import { PageHint } from './ui/PageHint.tsx'
import { Pager } from './ui/Pager.tsx'
import { PlaceholderPage } from './ui/PlaceholderPage.tsx'
import { RoundPage } from './ui/RoundPage.tsx'

const ROUND_PAGE = 1

export function App() {
  const [locale] = useState(() => detectLocale(navigator.language))
  const [page, setPage] = useState(ROUND_PAGE)
  const { state, addItem } = useAppState(locale)
  const sections = useMemo(() => gridSections(state.catalog, locale), [state.catalog, locale])
  const t = messages[locale]

  useEffect(() => {
    document.documentElement.lang = locale
    document.title = t.appName
  }, [locale, t])

  // Memoised so dragging (which re-renders only the Pager) never re-renders the page contents.
  const pages = useMemo(
    () => [
      <PlaceholderPage key="history" title={t.history} text={t.historySoon} />,
      <RoundPage key="round" sections={sections} round={state.round} t={t} onAdd={addItem} />,
      <PlaceholderPage key="items" title={t.items} text={t.itemsSoon} />,
    ],
    [t, sections, state.round, addItem],
  )

  return (
    <div className="shell">
      <Pager pages={pages} page={page} onPageChange={setPage} />
      <PageHint labels={[t.history, t.round, t.items]} page={page} navLabel={t.pages} onPageChange={setPage} />
    </div>
  )
}
