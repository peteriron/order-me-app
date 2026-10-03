import { useEffect, useState } from 'react'
import type { RoundLine } from '../round/round.ts'
import type { Messages } from '../shared/i18n.ts'
import type { Overlays } from '../shared/ui/overlays.ts'
import { QrSheet } from '../shared/ui/QrSheet.tsx'
import { shareOrCopy, shareText } from './share.ts'
import { encodeRound, roundLink } from './sharedRound.ts'

interface ShareRoundSheetProps {
  /** The Round as the Show tab lists it; the link keeps this order. */
  lines: RoundLine[]
  t: Messages
  overlays: Overlays
  onClose: () => void
}

/** "Share Round": the Round as a QR code and link for a friend's phone, or as plain text for a chat. */
export function ShareRoundSheet({ lines, t, overlays, onClose }: ShareRoundSheetProps) {
  const [link, setLink] = useState<string | null>(null)
  const total = lines.reduce((sum, line) => sum + line.count, 0)

  useEffect(() => {
    let current = true
    const appUrl = new URL(import.meta.env.BASE_URL, location.href).href
    void encodeRound(lines).then((payload) => current && setLink(roundLink(appUrl, payload)))
    return () => {
      current = false
    }
  }, [lines])

  const shareAsText = async () => {
    const outcome = await shareOrCopy(shareText(lines, t.total), navigator)
    if (outcome === 'copied') overlays.notify(t.copied)
  }

  return (
    <QrSheet
      title={t.shareRound}
      hint={t.shareRoundHint}
      link={link}
      alt={t.qrRoundAlt(total)}
      t={t}
      overlays={overlays}
      onClose={onClose}
    >
      <button type="button" className="btn btn-outline" onClick={shareAsText}>
        {t.shareAsText}
      </button>
    </QrSheet>
  )
}
