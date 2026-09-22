import { useEffect, useLayoutEffect, useRef } from 'react'
import type { RoundLine } from '../domain/index.ts'
import type { Messages } from '../i18n/index.ts'

interface CounterViewProps {
  lines: RoundLine[]
  total: number
  t: Messages
  onAdd: (itemId: string) => void
  onRemove: (itemId: string) => void
  onClear: () => void
  onBack: () => void
  onMarkOrdered: () => void
}

/** Smallest size a name may shrink to before it is allowed to break mid-word. */
const MIN_NAME_PX = 20

/**
 * Names are 32px so they read at arm's length, but a single long word ("Bitterballen") can't fit beside the
 * −/+ buttons on a phone. Shrink just that line, 2px at a time, until it fits; mid-word breaks are a last resort.
 */
function fitName(el: HTMLElement) {
  el.style.fontSize = ''
  el.style.overflowWrap = ''
  let px = parseFloat(getComputedStyle(el).fontSize)
  while (el.scrollWidth > el.clientWidth && px > MIN_NAME_PX) {
    px -= 2
    el.style.fontSize = `${px}px`
  }
  if (el.scrollWidth > el.clientWidth) el.style.overflowWrap = 'anywhere'
}

/** Full-screen, large-type Round to read out or show to the bartender, and the place to mark it as ordered. */
export function CounterView({ lines, total, t, onAdd, onRemove, onClear, onBack, onMarkOrdered }: CounterViewProps) {
  const backRef = useRef<HTMLButtonElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const fitAll = () => bodyRef.current?.querySelectorAll<HTMLElement>('.counter-what').forEach(fitName)
    fitAll()
    window.addEventListener('resize', fitAll)
    return () => window.removeEventListener('resize', fitAll)
  }, [lines])

  useEffect(() => {
    backRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onBack()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onBack])

  const list = (category: 'drink' | 'snack') => (
    <ul className="counter-lines">
      {lines
        .filter((l) => l.item.category === category)
        .map(({ item, count }) => (
          <li key={item.id} className="counter-line">
            <span className="counter-count">{count}</span>
            <span className="counter-times">×</span>
            <span className="counter-what">
              {/* Non-breaking space keeps the emoji on the name's line; long names hyphenate instead. */}
              <span aria-hidden="true">{item.emoji}</span>
              {'\u00a0'}
              {item.name}
            </span>
            <span className="counter-controls">
              <button type="button" aria-label={t.removeOne(item.name)} onClick={() => onRemove(item.id)}>
                −
              </button>
              <button type="button" aria-label={t.addOne(item.name)} onClick={() => onAdd(item.id)}>
                +
              </button>
            </span>
          </li>
        ))}
    </ul>
  )
  const hasSnacks = lines.some((l) => l.item.category === 'snack')

  return (
    <div className="counter" role="dialog" aria-modal="true" aria-labelledby="counter-title">
      <h1 id="counter-title" className="visually-hidden">
        {t.counterTitle}
      </h1>
      <div className="counter-top">
        <button ref={backRef} type="button" className="icon-btn" aria-label={t.backToRound} onClick={onBack}>
          <svg viewBox="0 0 24 24" aria-hidden="true" className="btn-icon">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <button type="button" className="btn btn-quiet" onClick={onClear}>
          {t.clear}
        </button>
      </div>

      <div className="counter-body" ref={bodyRef}>
        {list('drink')}
        {hasSnacks && (
          <>
            <h2 className="section-label counter-divider">
              <span className="dot dot-snack" aria-hidden="true" />
              {t.snacks}
            </h2>
            {list('snack')}
          </>
        )}
        <p className="counter-total">
          <span>{t.total}</span>
          <span data-testid="counter-total">{total}</span>
        </p>
      </div>

      <button type="button" className="btn btn-primary btn-big" onClick={onMarkOrdered}>
        <svg viewBox="0 0 24 24" aria-hidden="true" className="btn-icon">
          <path d="M5 12l5 5 9-10" />
        </svg>
        {t.markOrdered}
      </button>
    </div>
  )
}
