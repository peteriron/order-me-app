import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CounterView } from './counter/CounterView.tsx'
import { shareOrCopy, shareText } from './counter/share.ts'
import { HistoryPage } from './history/HistoryPage.tsx'
import { orderAgain, type PlacedRound } from './history/history.ts'
import { ItemSheet } from './items/ItemSheet.tsx'
import { ItemsPage } from './items/ItemsPage.tsx'
import { catalogSections, type Item, type ItemDraft } from './items/catalog.ts'
import { RoundPage } from './round/RoundPage.tsx'
import { roundLines, totalOf } from './round/round.ts'
import { useTileOrder } from './round/useTileOrder.ts'
import { SettingsSection } from './settings/SettingsSection.tsx'
import { useTheme } from './settings/useTheme.ts'
import { detectLocale, formattingLocale, messages, resolveLocale } from './shared/i18n.ts'
import { ConfirmDialog, type Confirmation } from './shared/ui/ConfirmDialog.tsx'
import { PageHint } from './shared/ui/PageHint.tsx'
import { Pager } from './shared/ui/Pager.tsx'
import { Toast, type ToastMessage } from './shared/ui/Toast.tsx'
import { useAppState } from './useAppState.ts'

const ROUND_PAGE = 1

export function App() {
  const [page, setPage] = useState(ROUND_PAGE)
  const [counterOpen, setCounterOpen] = useState(false)
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null)
  /** The Item sheet: `{}` to add a new Item, `{ item }` to edit one, `{ forRound }` from the + New tile. */
  const [sheet, setSheet] = useState<{ item?: Item; forRound?: boolean } | null>(null)
  const showButton = useRef<HTMLButtonElement>(null)
  const {
    state,
    placements,
    addToRound,
    removeFromRound,
    clearRound,
    replaceRound,
    deleteRound,
    placeRound,
    createItem,
    updateItem,
    removeFromCatalog,
    clearHistory,
    setLanguage,
    setTheme,
  } = useAppState(detectLocale(navigator.language))
  const locale = resolveLocale(state.settings.language, navigator.language)
  useTheme(state.settings.theme)
  const sections = useTileOrder(state.catalog, state.history, locale, placements)
  const catalogByName = useMemo(() => catalogSections(state.catalog, locale), [state.catalog, locale])
  const total = totalOf(state.round)
  const t = messages[locale]
  const dateLocale = formattingLocale(locale, navigator.language)

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
  const closeConfirmation = useCallback(() => setConfirmation(null), [])
  const confirmDeleteRound = useCallback(
    (round: { id: string }) =>
      setConfirmation({ text: t.deleteRoundConfirm, confirmLabel: t.delete, onConfirm: () => deleteRound(round.id) }),
    [t, deleteRound],
  )

  const confirmClearHistory = useCallback(
    () => setConfirmation({ text: t.clearHistoryConfirm, confirmLabel: t.clearHistory, onConfirm: clearHistory }),
    [t, clearHistory],
  )
  const openAddItem = useCallback(() => setSheet({}), [])
  const openNewForRound = useCallback(() => setSheet({ forRound: true }), [])
  const openEditItem = useCallback((item: Item) => setSheet({ item }), [])
  const closeSheet = useCallback(() => setSheet(null), [])
  const saveSheet = (draft: ItemDraft) => {
    if (sheet?.item) updateItem(sheet.item.id, draft)
    else createItem(draft, { addToRound: sheet?.forRound })
    setSheet(null)
  }
  const confirmDeleteItem = (item: Item) =>
    setConfirmation({
      text: t.deleteItemConfirm(item.name),
      confirmLabel: t.delete,
      onConfirm: () => {
        removeFromCatalog(item.id)
        setSheet(null)
      },
    })

  const orderAgainFrom = useCallback(
    (placed: PlacedRound) => {
      // Always replaces what is being composed (PRD): no prompt, no undo.
      const { round, skipped } = orderAgain(placed, state.catalog)
      replaceRound(round)
      setPage(ROUND_PAGE)
      if (skipped > 0) setToast({ id: Date.now(), text: t.skippedItems(skipped) })
    },
    [state.catalog, replaceRound, t],
  )

  // Memoised so dragging (which re-renders only the Pager) never re-renders the page contents.
  const pages = useMemo(
    () => [
      <HistoryPage
        key="history"
        history={state.history}
        dateLocale={dateLocale}
        t={t}
        onDelete={confirmDeleteRound}
        onOrderAgain={orderAgainFrom}
      />,
      <RoundPage
        key="round"
        sections={sections}
        round={state.round}
        t={t}
        onAdd={addToRound}
        onRemove={removeFromRound}
        onClear={clearRound}
        onShow={openCounter}
        onNew={openNewForRound}
        showRef={showButton}
      />,
      <ItemsPage
        key="items"
        sections={catalogByName}
        count={state.catalog.length}
        t={t}
        onAdd={openAddItem}
        onEdit={openEditItem}
      >
        <SettingsSection
          settings={state.settings}
          hasHistory={state.history.length > 0}
          t={t}
          onLanguage={setLanguage}
          onTheme={setTheme}
          onClearHistory={confirmClearHistory}
        />
      </ItemsPage>,
    ],
    [
      t,
      dateLocale,
      sections,
      catalogByName,
      state.catalog.length,
      state.round,
      state.history,
      addToRound,
      removeFromRound,
      clearRound,
      openCounter,
      confirmDeleteRound,
      orderAgainFrom,
      openAddItem,
      openEditItem,
      openNewForRound,
      state.settings,
      setLanguage,
      setTheme,
      confirmClearHistory,
    ],
  )

  return (
    <>
      <div className="shell" inert={counterOpen || sheet !== null || confirmation !== null}>
        <Pager pages={pages} page={page} onPageChange={setPage} />
        <PageHint labels={[t.history, t.round, t.items]} page={page} navLabel={t.pages} onPageChange={setPage} />
      </div>

      {counterOpen && (
        <CounterView
          lines={roundLines(state.round, sections)}
          total={total}
          t={t}
          onAdd={addToRound}
          onRemove={(itemId) => {
            // The Counter view has nothing to show once the last Item is gone.
            if (total === 1) setCounterOpen(false)
            removeFromRound(itemId)
          }}
          onClear={() => {
            setCounterOpen(false)
            clearRound()
          }}
          onShare={async () => {
            const outcome = await shareOrCopy(shareText(roundLines(state.round, sections), t.total), navigator)
            if (outcome === 'copied') setToast({ id: Date.now(), text: t.copied })
          }}
          onBack={closeCounter}
          onMarkOrdered={() => {
            const undo = placeRound(sections)
            setCounterOpen(false)
            setToast({ id: Date.now(), text: t.roundPlaced, action: { label: t.undo, run: undo } })
          }}
        />
      )}

      {sheet && (
        // The sheet stays open under a delete confirmation, but must not take taps while it is.
        <div inert={confirmation !== null}>
          <ItemSheet
            item={sheet.item}
            forRound={sheet.forRound}
            t={t}
            onSave={saveSheet}
            onDelete={sheet.item ? () => confirmDeleteItem(sheet.item!) : undefined}
            onCancel={closeSheet}
          />
        </div>
      )}

      {toast && <Toast key={toast.id} toast={toast} onDone={dismissToast} />}

      {confirmation && <ConfirmDialog {...confirmation} cancelLabel={t.cancel} onClose={closeConfirmation} />}
    </>
  )
}
