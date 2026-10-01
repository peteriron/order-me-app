import { useEffect, useRef } from 'react'
import type { Messages } from '../shared/i18n.ts'
import type { Overlays } from '../shared/ui/overlays.ts'
import type { AppActions } from '../useAppState.ts'
import { decodeCatalog, sharedPayload } from './sharedCatalog.ts'

interface SharedLinkOptions {
  /** On a first launch the shared Items replace the starter Catalog without asking. */
  firstLaunch: boolean
  catalogSize: number
  t: Messages
  actions: Pick<AppActions, 'replaceCatalog'>
  overlays: Overlays
}

/**
 * Takes in a Shared Catalog from the address the app was opened with, or one pasted into the address bar of an open
 * app (only the fragment changes then, so there is no reload). The fragment is cleared straight away, so a reload
 * never asks again. A link that can't be read in full is ignored with a toast.
 */
export function useSharedLink(options: SharedLinkOptions) {
  // The newest options, for a link decoded after later renders.
  const latest = useRef(options)
  useEffect(() => {
    latest.current = options
  })

  useEffect(() => {
    const receive = (allowSilent: boolean) => {
      const payload = sharedPayload(location.hash)
      if (payload === null) return
      history.replaceState(history.state, '', location.pathname + location.search)
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
    }
    receive(true)
    const onHashChange = () => receive(false)
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])
}
