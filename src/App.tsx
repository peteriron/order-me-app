import { useCallback, useEffect, useMemo, useState } from 'react'
import { ShowPage } from './counter/ShowPage.tsx'
import { HistoryPage } from './history/HistoryPage.tsx'
import { ItemSheet } from './items/ItemSheet.tsx'
import { ItemsPage } from './items/ItemsPage.tsx'
import { ShareSheet } from './items/ShareSheet.tsx'
import { catalogSections, type Item } from './items/catalog.ts'
import { useSharedLink } from './items/useSharedLink.ts'
import { RoundPage } from './round/RoundPage.tsx'
import { useTileOrder } from './round/useTileOrder.ts'
import { SettingsSection } from './settings/SettingsSection.tsx'
import { useTheme } from './settings/useTheme.ts'
import { detectLocale, formattingLocale, messages, resolveLocale } from './shared/i18n.ts'
import { ConfirmDialog, type Confirmation } from './shared/ui/ConfirmDialog.tsx'
import { PageHint } from './shared/ui/PageHint.tsx'
import { Pager } from './shared/ui/Pager.tsx'
import { Toast, type ToastMessage } from './shared/ui/Toast.tsx'
import type { Overlays } from './shared/ui/overlays.ts'
import { useAppState } from './useAppState.ts'

const ROUND_PAGE = 1
const SHOW_PAGE = 2

/** The four swipe pages plus the overlays on top of them. Each feature wires its own handlers. */
export function App() {
  const { state, firstLaunch, placements, actions, placeRound } = useAppState(detectLocale(navigator.language))
  const locale = resolveLocale(state.settings.language, navigator.language)
  const t = messages[locale]
  useTheme(state.settings.theme)
  const sections = useTileOrder(state.catalog, state.pins, state.history, placements)

  const [page, setPage] = useState(ROUND_PAGE)
  /** The Item sheet: `{}` to add a new Item, `{ item }` to edit one, `{ forRound }` from the + New tile. */
  const [sheet, setSheet] = useState<{ item?: Item; forRound?: boolean } | null>(null)
  const [sharing, setSharing] = useState(false)
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null)
  const overlays = useMemo<Overlays>(
    () => ({ confirm: setConfirmation, notify: (text, action) => setToast({ id: Date.now(), text, action }) }),
    [],
  )
  useSharedLink({ firstLaunch, catalogSize: state.catalog.length, t, actions, overlays })

  useEffect(() => {
    document.documentElement.lang = locale
    document.title = t.appName
  }, [locale, t])

  const closeSheet = useCallback(() => setSheet(null), [])
  const closeSharing = useCallback(() => setSharing(false), [])
  const closeToast = useCallback(() => setToast(null), [])
  const closeConfirmation = useCallback(() => setConfirmation(null), [])

  const pages = [
    <HistoryPage
      key="history"
      history={state.history}
      catalog={state.catalog}
      dateLocale={formattingLocale(locale, navigator.language)}
      t={t}
      actions={actions}
      overlays={overlays}
      onOrderedAgain={() => setPage(ROUND_PAGE)}
    />,
    <RoundPage
      key="round"
      sections={sections}
      round={state.round}
      t={t}
      actions={actions}
      onShow={() => setPage(SHOW_PAGE)}
      onNew={() => setSheet({ forRound: true })}
    />,
    <ShowPage
      key="show"
      round={state.round}
      sections={sections}
      active={page === SHOW_PAGE}
      t={t}
      actions={actions}
      onPlace={placeRound}
      overlays={overlays}
      onGoToRound={() => setPage(ROUND_PAGE)}
    />,
    <ItemsPage
      key="items"
      sections={catalogSections(state.catalog, state.pins)}
      pins={state.pins}
      count={state.catalog.length}
      t={t}
      actions={actions}
      onAdd={() => setSheet({})}
      onShare={() => setSharing(true)}
      onEdit={(item) => setSheet({ item })}
    >
      <SettingsSection
        settings={state.settings}
        hasHistory={state.history.length > 0}
        t={t}
        actions={actions}
        overlays={overlays}
      />
    </ItemsPage>,
  ]

  return (
    <>
      <div className="shell" inert={sheet !== null || sharing || confirmation !== null}>
        <Pager pages={pages} page={page} onPageChange={setPage} />
        <PageHint labels={[t.history, t.round, t.show, t.items]} page={page} navLabel={t.pages} onPageChange={setPage} />
      </div>

      {sheet && (
        // The sheet stays open under a delete confirmation, but must not take taps while it is.
        <div inert={confirmation !== null}>
          <ItemSheet {...sheet} t={t} actions={actions} overlays={overlays} onClose={closeSheet} />
        </div>
      )}

      {sharing && (
        <div inert={confirmation !== null}>
          <ShareSheet catalog={state.catalog} t={t} overlays={overlays} onClose={closeSharing} />
        </div>
      )}

      {toast && <Toast key={toast.id} toast={toast} onDone={closeToast} />}

      {confirmation && <ConfirmDialog {...confirmation} cancelLabel={t.cancel} onClose={closeConfirmation} />}
    </>
  )
}
