import type { Ref } from 'react'
import type { Messages } from '../i18n/index.ts'

interface RoundBarProps {
  total: number
  t: Messages
  onClear: () => void
  onShow: () => void
  /** Lets the Counter view hand focus back to Show when it closes. */
  showRef?: Ref<HTMLButtonElement>
}

/** Sticky footer of the Round page: the running total plus Clear and Show. */
export function RoundBar({ total, t, onClear, onShow, showRef }: RoundBarProps) {
  return (
    <section className="round-bar" aria-label={t.roundTotal}>
      {total > 0 && (
        <button type="button" className="btn btn-quiet" onClick={onClear}>
          {t.clear}
        </button>
      )}
      <p className="round-bar-status" aria-live="polite">
        {total > 0 ? t.itemsCount(total) : t.emptyHint}
      </p>
      {total > 0 && (
        <button ref={showRef} type="button" className="btn btn-primary" onClick={onShow}>
          {t.show}
          <svg viewBox="0 0 24 24" aria-hidden="true" className="btn-icon">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      )}
    </section>
  )
}
