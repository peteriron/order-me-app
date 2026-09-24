import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAppState } from './app/useAppState.ts'
import { useTheme } from './app/useTheme.ts'
import {
  catalogSections,
  gridSections,
  orderAgain,
  roundLines,
  totalOf,
  type Item,
  type ItemDraft,
  type PlacedRound,
} from './domain/index.ts'
import { detectLocale, formattingLocale, messages, resolveLocale } from './i18n/index.ts'
import { ConfirmDialog, type Confirmation } from './ui/ConfirmDialog.tsx'
import { CounterView } from './ui/CounterView.tsx'
import { HistoryPage } from './ui/HistoryPage.tsx'
import { ItemSheet } from './ui/ItemSheet.tsx'
import { ItemsPage } from './ui/ItemsPage.tsx'
import { PageHint } from './ui/PageHint.tsx'
import { Pager } from './ui/Pager.tsx'
import { RoundPage } from './ui/RoundPage.tsx'
import { SettingsSection } from './ui/SettingsSection.tsx'
import { Toast, type ToastMessage } from './ui/Toast.tsx'

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
  const sections = useMemo(() => gridSections(state.catalog, locale), [state.catalog, locale])
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
