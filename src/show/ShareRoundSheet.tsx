import { useEffect, useState } from 'react'
import type { RoundLine, RoundNote } from '../round/round.ts'
import type { Messages } from '../shared/i18n.ts'
import { QrSheet } from '../shared/ui/QrSheet.tsx'
import { encodeRound, roundLink } from './sharedRound.ts'

interface ShareRoundSheetProps {
  /** The Round as the Show tab lists it; the link keeps this order. */
  lines: RoundLine[]
  /** The Round's table and remark; they travel along. */
  note: RoundNote
  t: Messages
  onClose: () => void
}

/** "Share Round": the Round as a QR code and link for a friend's phone (the Show page's QR button). */
export function ShareRoundSheet({ lines, note, t, onClose }: ShareRoundSheetProps) {
  const [link, setLink] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const total = lines.reduce((sum, line) => sum + line.count, 0)

  useEffect(() => {
    let current = true
    const appUrl = new URL(import.meta.env.BASE_URL, location.href).href
    void encodeRound(lines, note)
      .then((payload) => {
        if (!current) return
        setFailed(false)
        setLink(roundLink(appUrl, payload))
      })
      .catch(() => {
        if (!current) return
        // A stale link must not sit next to the error: the two would disagree.
        setLink(null)
        setFailed(true)
      })
    return () => {
      current = false
    }
  }, [lines, note])

  return (
    <QrSheet
      title={t.shareRound}
      hint={t.shareRoundHint}
      link={link}
      failed={failed}
      alt={t.qrRoundAlt(total)}
      t={t}
      onClose={onClose}
    />
  )
}
