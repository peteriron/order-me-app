import { useEffect, useState } from 'react'
import type { RoundLine } from '../round/round.ts'
import type { Messages } from '../shared/i18n.ts'
import { QrSheet } from '../shared/ui/QrSheet.tsx'
import { encodeRound, roundLink } from './sharedRound.ts'

interface ShareRoundSheetProps {
  /** The Round as the Show tab lists it; the link keeps this order. */
  lines: RoundLine[]
  t: Messages
  onClose: () => void
}

/** "Share Round": the Round as a QR code and link for a friend's phone (the Show page's QR button). */
export function ShareRoundSheet({ lines, t, onClose }: ShareRoundSheetProps) {
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

  return (
    <QrSheet
      title={t.shareRound}
      hint={t.shareRoundHint}
      link={link}
      alt={t.qrRoundAlt(total)}
      t={t}
      onClose={onClose}
    />
  )
}
