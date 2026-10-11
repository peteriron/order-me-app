import { useEffect, useState } from 'react'
import type { Messages } from '../shared/i18n.ts'
import { QrSheet } from '../shared/ui/QrSheet.tsx'
import type { Catalog } from './catalog.ts'
import type { Groups } from './groups.ts'
import { encodeCatalog, shareLink } from './sharedCatalog.ts'

interface ShareItemsSheetProps {
  catalog: Catalog
  groups: Groups
  t: Messages
  onClose: () => void
}

/** "Share Items": the Catalog and its groups as a QR code, or copied as a link (a Shared Catalog). */
export function ShareItemsSheet({ catalog, groups, t, onClose }: ShareItemsSheetProps) {
  const [link, setLink] = useState<string | null>(null)

  useEffect(() => {
    let current = true
    const appUrl = new URL(import.meta.env.BASE_URL, location.href).href
    void encodeCatalog(catalog, groups).then((payload) => current && setLink(shareLink(appUrl, payload)))
    return () => {
      current = false
    }
  }, [catalog, groups])

  return (
    <QrSheet
      title={t.shareItemsTitle}
      hint={t.shareItemsHint}
      link={link}
      alt={t.qrAlt(catalog.length)}
      t={t}
      onClose={onClose}
    />
  )
}
