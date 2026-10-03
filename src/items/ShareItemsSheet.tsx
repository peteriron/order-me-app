import { useEffect, useState } from 'react'
import type { Messages } from '../shared/i18n.ts'
import type { Overlays } from '../shared/ui/overlays.ts'
import { QrSheet } from '../shared/ui/QrSheet.tsx'
import type { Catalog } from './catalog.ts'
import { encodeCatalog, shareLink } from './sharedCatalog.ts'

interface ShareItemsSheetProps {
  catalog: Catalog
  t: Messages
  overlays: Overlays
  onClose: () => void
}

/** "Share Items": the Catalog as a QR code, to save as an image or copy as a link (a Shared Catalog). */
export function ShareItemsSheet({ catalog, t, overlays, onClose }: ShareItemsSheetProps) {
  const [link, setLink] = useState<string | null>(null)

  useEffect(() => {
    let current = true
    const appUrl = new URL(import.meta.env.BASE_URL, location.href).href
    void encodeCatalog(catalog).then((payload) => current && setLink(shareLink(appUrl, payload)))
    return () => {
      current = false
    }
  }, [catalog])

  return (
    <QrSheet
      title={t.shareItemsTitle}
      hint={t.shareItemsHint}
      link={link}
      alt={t.qrAlt(catalog.length)}
      imageName="orderme-items.png"
      t={t}
      overlays={overlays}
      onClose={onClose}
    />
  )
}
