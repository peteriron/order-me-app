import type { ReactNode } from 'react'
import type { Messages } from '../shared/i18n.ts'

interface RoundBarProps {
  total: number
  t: Messages
  onClear: () => void
  /** The bar's one amber button, on the right: Show (Round page) or Ordered (Show page). */
  children: ReactNode
}

/**
 * Sticky footer of the Round and Show pages: Clear, the running total, and the page's main action. With an empty
 * Round it collapses to the hint "Tap a drink to start".
 */
export function RoundBar({ total, t, onClear, children }: RoundBarProps) {
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
      {total > 0 && children}
    </section>
  )
}

