import { useEffect, useRef } from 'react'
import { decodeRound, roundPayload } from './counter/sharedRound.ts'
import { decodeCatalog, sharedPayload } from './items/sharedCatalog.ts'
import type { Messages } from './shared/i18n.ts'
import type { Overlays } from './shared/ui/overlays.ts'
import type { AppActions } from './useAppState.ts'

interface SharedLinkOptions {
  /** On a first launch shared Items replace the starter Catalog without asking. */
  firstLaunch: boolean
  catalogSize: number
  t: Messages
  actions: Pick<AppActions, 'replaceCatalog' | 'receiveRound'>
  overlays: Overlays
  /** A shared Round was taken in: show it (the Show page). */
  onRoundReceived: () => void
}

/**
 * Takes in a link the app was opened with, or one pasted into the address bar of an open app (only the fragment
 * changes then, so there is no reload):
 * - a Shared Catalog (`#items=`): replaces the Catalog, silently on a first launch, otherwise after a confirm;
 * - a shared Round (`#round=`): always replaces the Round, without asking, and shows it with an Undo toast.
 * The fragment is cleared straight away, so a reload never takes it in again. A link that can't be read in full is
 * ignored with a toast.
 */
export function useSharedLinks(options: SharedLinkOptions) {
  // The newest options, for a link decoded after later renders.
  const latest = useRef(options)
  useEffect(() => {
    latest.current = options
  })

  useEffect(() => {
    const receiveItems = (payload: string, allowSilent: boolean) =>
      void decodeCatalog(payload).then((items) => {
        const { firstLaunch, catalogSize, t, actions, overlays } = latest.current
        if (!items) overlays.notify(t.badShareLink)
        else if (allowSilent && firstLaunch) actions.replaceCatalog(items)
        else
          overlays.confirm({
            text: t.replaceCatalogConfirm(catalogSize, items.length),
            confirmLabel: t.replace,
            onConfirm: () => actions.replaceCatalog(items),
          })
      })

    const receiveRound = (payload: string) =>
      void decodeRound(payload).then((lines) => {
        const { t, actions, overlays, onRoundReceived } = latest.current
        if (!lines) return overlays.notify(t.badShareLink)
        const undo = actions.receiveRound(lines)
        onRoundReceived()
        overlays.notify(t.roundReceived, { label: t.undo, run: undo })
      })

    const receive = (allowSilent: boolean) => {
      const items = sharedPayload(location.hash)
      const round = roundPayload(location.hash)
      if (items === null && round === null) return
      history.replaceState(history.state, '', location.pathname + location.search)
      if (items !== null) receiveItems(items, allowSilent)
      else if (round !== null) receiveRound(round)
    }
    receive(true)
    const onHashChange = () => receive(false)
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])
}
