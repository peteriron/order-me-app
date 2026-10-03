import { useCallback, useEffect, useMemo, useState } from 'react'
import { ShareRoundSheet } from './counter/ShareRoundSheet.tsx'
import { ShowPage } from './counter/ShowPage.tsx'
import { showSections } from './counter/showOrder.ts'
import { HistoryPage } from './history/HistoryPage.tsx'
import { ItemSheet } from './items/ItemSheet.tsx'
import { ItemsPage } from './items/ItemsPage.tsx'
import { ShareItemsSheet } from './items/ShareItemsSheet.tsx'
import { catalogSections, type Item } from './items/catalog.ts'
import { localizeCatalog } from './items/starter.ts'
import { RoundPage } from './round/RoundPage.tsx'
import { useTileOrder } from './round/useTileOrder.ts'
import { SettingsSection } from './settings/SettingsSection.tsx'
import { useTheme } from './settings/useTheme.ts'
import { detectLocale, formattingLocale, messages, resolveLocale } from './shared/i18n.ts'
import { ConfirmDialog, type Confirmation } from './shared/ui/ConfirmDialog.tsx'
import { TabBar } from './shared/ui/TabBar.tsx'
import { TAB_ICONS } from './shared/ui/tabIcons.tsx'
import { Pager } from './shared/ui/Pager.tsx'
import { Toast, type ToastMessage } from './shared/ui/Toast.tsx'
import type { Overlays } from './shared/ui/overlays.ts'
import { roundLines } from './round/round.ts'
import { useAppState } from './useAppState.ts'
import { useSharedLinks } from './useSharedLinks.ts'

const ROUND_PAGE = 1
const SHOW_PAGE = 2

/** The four swipe pages plus the overlays on top of them. Each feature wires its own handlers. */
export function App() {
  const { state, firstLaunch, placements, actions, placeRound } = useAppState(detectLocale(navigator.language))
  const locale = resolveLocale(state.settings.language, navigator.language)
  const t = messages[locale]
  useTheme(state.settings.theme)
  /** The Catalog as shown: starter Items named in the app's language. Everything on screen, placed or shared uses it. */
  const catalog = useMemo(() => localizeCatalog(state.catalog, locale), [state.catalog, locale])
  const sections = useTileOrder(catalog, state.pins, state.history, placements)
  /** The grid in the Show tab's order: a received Show order first (#49). Share and History follow it too. */
  const show = useMemo(() => showSections(sections, state.showOrder), [sections, state.showOrder])
  /** The Round as the Show tab lists it: what Share Round sends. */
  const showLines = useMemo(() => roundLines(state.round, show), [state.round, show])

  const [page, setPage] = useState(ROUND_PAGE)
  /** The Item sheet: `{}` to add a new Item, `{ item }` to edit one, `{ forRound }` from the + New tile. */
  const [sheet, setSheet] = useState<{ item?: Item; forRound?: boolean } | null>(null)
  /** Which share sheet is open: the Catalog (Settings page) or the Round (Show page). */
  const [sharing, setSharing] = useState<'items' | 'round' | null>(null)
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null)
  const overlays = useMemo<Overlays>(
    () => ({ confirm: setConfirmation, notify: (text, action) => setToast({ id: Date.now(), text, action }) }),
    [],
  )
  useSharedLinks({
    firstLaunch,
    catalogSize: catalog.length,
    t,
    actions,
    overlays,
    onRoundReceived: () => setPage(SHOW_PAGE),
  })

  useEffect(() => {
    document.documentElement.lang = locale
    document.title = t.appName
  }, [locale, t])

  const closeSheet = useCallback(() => setSheet(null), [])
  const closeSharing = useCallback(() => setSharing(null), [])
  const closeToast = useCallback(() => setToast(null), [])
  const closeConfirmation = useCallback(() => setConfirmation(null), [])

  const pages = [
    <HistoryPage
      key="history"
      history={state.history}
      catalog={catalog}
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
      overlays={overlays}
      onShow={() => setPage(SHOW_PAGE)}
      onNew={() => setSheet({ forRound: true })}
    />,
    <ShowPage
      key="show"
      round={state.round}
      sections={show}
      active={page === SHOW_PAGE}
      t={t}
      actions={actions}
      onPlace={placeRound}
      overlays={overlays}
      onGoToRound={() => setPage(ROUND_PAGE)}
      onShare={() => setSharing('round')}
    />,
    <ItemsPage
      key="items"
      sections={catalogSections(catalog, state.pins)}
      pins={state.pins}
      count={catalog.length}
      t={t}
      actions={actions}
      overlays={overlays}
      onAdd={() => setSheet({})}
      onShare={() => setSharing('items')}
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
      <div className="shell" inert={sheet !== null || sharing !== null || confirmation !== null}>
        <Pager pages={pages} page={page} onPageChange={setPage} />
        <TabBar
          tabs={[
            { label: t.historyTab, name: t.history, icon: TAB_ICONS.history },
            { label: t.round, name: t.round, icon: TAB_ICONS.round },
            { label: t.show, name: t.show, icon: TAB_ICONS.show },
            { label: t.settingsTab, name: t.settings, icon: TAB_ICONS.settings },
          ]}
          page={page}
          navLabel={t.pages}
          onPageChange={setPage}
        />
      </div>

      {sheet && (
        // The sheet stays open under a delete confirmation, but must not take taps while it is.
        <div inert={confirmation !== null}>
          <ItemSheet {...sheet} t={t} actions={actions} overlays={overlays} onClose={closeSheet} />
        </div>
      )}

      {sharing && (
        <div inert={confirmation !== null}>
          {sharing === 'items' ? (
            <ShareItemsSheet catalog={catalog} t={t} onClose={closeSharing} />
          ) : (
            <ShareRoundSheet lines={showLines} t={t} overlays={overlays} onClose={closeSharing} />
          )}
        </div>
      )}

      {toast && <Toast key={toast.id} toast={toast} onDone={closeToast} />}

      {confirmation && <ConfirmDialog {...confirmation} cancelLabel={t.cancel} onClose={closeConfirmation} />}
    </>
  )
}
