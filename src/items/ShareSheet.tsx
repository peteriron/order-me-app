import { useEffect, useMemo, useState } from 'react'
import type { Messages } from '../shared/i18n.ts'
import type { Overlays } from '../shared/ui/overlays.ts'
import type { Catalog } from './catalog.ts'
import { qrCode } from './qr.ts'
import { encodeCatalog, shareLink } from './sharedCatalog.ts'

interface ShareSheetProps {
  catalog: Catalog
  t: Messages
  overlays: Overlays
  onClose: () => void
}

/** Pixels per QR module in the saved image: crisp when printed or posted. */
const IMAGE_SCALE = 12
const QR_COLOURS = { on: [0, 0, 0, 255], off: [255, 255, 255, 255], pad: 4 } as const

/** Bottom sheet with the Catalog as a QR code, to save as an image or copy as a link (a Shared Catalog). */
export function ShareSheet({ catalog, t, overlays, onClose }: ShareSheetProps) {
  const [link, setLink] = useState<string | null>(null)
  const code = useMemo(() => (link ? qrCode(link) : null), [link])

  useEffect(() => {
    let current = true
    const appUrl = new URL(import.meta.env.BASE_URL, location.href).href
    void encodeCatalog(catalog).then((payload) => current && setLink(shareLink(appUrl, payload)))
    return () => {
      current = false
    }
  }, [catalog])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const copyLink = async () => {
    if (!link) return
    try {
      await navigator.clipboard.writeText(link)
      overlays.notify(t.copied)
    } catch {
      // No clipboard access (blocked or unsupported): nothing was copied, so say nothing.
    }
  }

  const saveImage = () => {
    if (!code) return
    const a = document.createElement('a')
    a.href = code.toDataURL({ ...QR_COLOURS, scale: IMAGE_SCALE, type: 'image/png' })
    a.download = 'orderme-items.png'
    a.click()
  }

  return (
    <div className="sheet-scrim" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="share-title">
        <div className="sheet-grab" aria-hidden="true" />
        <h2 className="sheet-title" id="share-title">
          {t.shareItems}
        </h2>

        {link &&
          (code ? (
            <>
              <img
                className="share-qr"
                src={code.toDataURL({ ...QR_COLOURS, scale: 4 })}
                alt={t.qrAlt(catalog.length)}
              />
              <p className="share-hint">{t.shareItemsHint}</p>
            </>
          ) : (
            <p className="share-hint">{t.tooBigForQr}</p>
          ))}

        <div className="share-actions">
          <button type="button" className="btn btn-outline" disabled={!code} onClick={saveImage}>
            {t.saveImage}
          </button>
          <button type="button" className="btn btn-outline" disabled={!link} onClick={copyLink}>
            {t.copyLink}
          </button>
        </div>
        <button type="button" className="btn btn-quiet btn-block" autoFocus onClick={onClose}>
          {t.done}
        </button>
      </div>
    </div>
  )
}
