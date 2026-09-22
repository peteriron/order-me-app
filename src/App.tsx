import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAppState } from './app/useAppState.ts'
import { gridSections, roundLines, totalOf } from './domain/index.ts'
import { detectLocale, messages } from './i18n/index.ts'
import { CounterView } from './ui/CounterView.tsx'
import { PageHint } from './ui/PageHint.tsx'
import { Pager } from './ui/Pager.tsx'
import { PlaceholderPage } from './ui/PlaceholderPage.tsx'
import { RoundPage } from './ui/RoundPage.tsx'
import { Toast, type ToastMessage } from './ui/Toast.tsx'

const ROUND_PAGE = 1

export function App() {
  const [locale] = useState(() => detectLocale(navigator.language))
  const [page, setPage] = useState(ROUND_PAGE)
  const [counterOpen, setCounterOpen] = useState(false)
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const showButton = useRef<HTMLButtonElement>(null)
  const { state, addItem, removeItem, clearRound, placeRound } = useAppState(locale)
  const sections = useMemo(() => gridSections(state.catalog, locale), [state.catalog, locale])
  const total = totalOf(state.round)
  const t = messages[locale]

  useEffect(() => {
    document.documentElement.lang = locale
    document.title = t.appName
  }, [locale, t])

  const openCounter = useCallback(() => setCounterOpen(true), [])
  const closeCounter = useCallback(() => {
    setCounterOpen(false)
    showButton.current?.focus()
  }, [])
  const dismissToast = useCallback(() => setToast(null), [])

  // Memoised so dragging (which re-renders only the Pager) never re-renders the page contents.
  const pages = useMemo(
    () => [
      <PlaceholderPage key="history" title={t.history} text={t.historySoon} />,
      <RoundPage
        key="round"
        sections={sections}
        round={state.round}
        t={t}
        onAdd={addItem}
        onRemove={removeItem}
        onClear={clearRound}
        onShow={openCounter}
        showRef={showButton}
      />,
      <PlaceholderPage key="items" title={t.items} text={t.itemsSoon} />,
    ],
    [t, sections, state.round, addItem, removeItem, clearRound, openCounter],
  )

  return (
    <>
      <div className="shell" inert={counterOpen}>
        <Pager pages={pages} page={page} onPageChange={setPage} />
        <PageHint labels={[t.history, t.round, t.items]} page={page} navLabel={t.pages} onPageChange={setPage} />
      </div>

      {counterOpen && (
        <CounterView
          lines={roundLines(state.round, sections)}
          total={total}
          t={t}
          onAdd={addItem}
          onRemove={(itemId) => {
            // The Counter view has nothing to show once the last Item is gone.
            if (total === 1) setCounterOpen(false)
            removeItem(itemId)
          }}
          onClear={() => {
            setCounterOpen(false)
            clearRound()
          }}
          onBack={closeCounter}
          onMarkOrdered={() => {
            const undo = placeRound(sections)
            setCounterOpen(false)
            setToast({ id: Date.now(), text: t.roundPlaced, action: { label: t.undo, run: undo } })
          }}
        />
      )}

      {toast && <Toast key={toast.id} toast={toast} onDone={dismissToast} />}
    </>
  )
}
