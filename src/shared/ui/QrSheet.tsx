import { useEffect, useMemo, type ReactNode } from 'react'
import { qrCode } from '../../items/qr.ts'
import type { Messages } from '../i18n.ts'
import type { Overlays } from './overlays.ts'

interface QrSheetProps {
  title: string
  /** Under the QR code: what scanning it does. */
  hint: string
  /** The link the QR code holds; null while it's still being made. */
  link: string | null
  /** The QR code's description for screen readers. */
  alt: string
  /** When set, a Save image button downloads the QR code as a PNG with this file name. */
  imageName?: string
  /** More buttons after Copy link (e.g. Share as text). */
  children?: ReactNode
  t: Messages
  overlays: Overlays
  onClose: () => void
}

/** Pixels per QR module in the saved image: crisp when printed or posted. */
const IMAGE_SCALE = 12
const QR_COLOURS = { on: [0, 0, 0, 255], off: [255, 255, 255, 255], pad: 4 } as const

/** Bottom sheet with a link as a QR code, plus Copy link and whatever else the caller adds. */
export function QrSheet({ title, hint, link, alt, imageName, children, t, overlays, onClose }: QrSheetProps) {
  const code = useMemo(() => (link ? qrCode(link) : null), [link])

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
    if (!code || !imageName) return
    const a = document.createElement('a')
    a.href = code.toDataURL({ ...QR_COLOURS, scale: IMAGE_SCALE, type: 'image/png' })
    a.download = imageName
    a.click()
  }

  return (
    <div className="sheet-scrim" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="qr-sheet-title">
        <div className="sheet-grab" aria-hidden="true" />
        <h2 className="sheet-title" id="qr-sheet-title">
          {title}
        </h2>

        {link &&
          (code ? (
            <>
              <img className="share-qr" src={code.toDataURL({ ...QR_COLOURS, scale: 4 })} alt={alt} />
              <p className="share-hint">{hint}</p>
            </>
          ) : (
            <p className="share-hint">{t.tooBigForQr}</p>
          ))}

        <div className="share-actions">
          {imageName && (
            <button type="button" className="btn btn-outline" disabled={!code} onClick={saveImage}>
              {t.saveImage}
            </button>
          )}
          <button type="button" className="btn btn-outline" disabled={!link} onClick={copyLink}>
            {t.copyLink}
          </button>
          {children}
        </div>
        <button type="button" className="btn btn-quiet btn-block" autoFocus onClick={onClose}>
          {t.done}
        </button>
      </div>
    </div>
  )
}
