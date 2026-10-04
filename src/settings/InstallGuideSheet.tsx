import { useEffect } from 'react'
import type { Messages } from '../shared/i18n.ts'

interface InstallGuideSheetProps {
  t: Messages
  onClose: () => void
}

/** Safari's Share icon, so step 1 points at the button to look for. */
const SHARE_ICON = (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="btn-icon">
    <path d="M12 15V3M8 7l4-4 4 4M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
  </svg>
)

/**
 * How to add the app to the home screen on an iPhone or iPad, which (unlike Chrome on Android) has no install
 * prompt the app could open itself.
 */
export function InstallGuideSheet({ t, onClose }: InstallGuideSheetProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="sheet-scrim" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="install-title">
        <div className="sheet-grab" aria-hidden="true" />
        <h2 className="sheet-title" id="install-title">
          {t.addToHome}
        </h2>
        <ol className="install-steps">
          {t.installSteps.map((step, i) => (
            <li key={i}>
              {i === 0 && <span className="install-share">{SHARE_ICON}</span>}
              {step}
            </li>
          ))}
        </ol>
        <div className="share-actions">
          <button type="button" className="btn btn-neutral" autoFocus onClick={onClose}>
            {t.close}
          </button>
        </div>
      </div>
    </div>
  )
}
