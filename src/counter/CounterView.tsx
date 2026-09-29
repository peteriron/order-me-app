import { useEffect, useLayoutEffect, useRef } from 'react'
import type { Sections } from '../items/catalog.ts'
import { roundLines, totalOf, type ComposingRound } from '../round/round.ts'
import type { Messages } from '../shared/i18n.ts'
import type { Overlays } from '../shared/ui/overlays.ts'
import type { AppActions } from '../useAppState.ts'
import { shareOrCopy, shareText } from './share.ts'
import { browserHost, keepScreenAwake } from './wakeLock.ts'

interface CounterViewProps {
  round: ComposingRound
  /** The grid's tile order, so lines read in the same order as the tiles. */
  sections: Sections
  t: Messages
  actions: Pick<AppActions, 'addToRound' | 'removeFromRound' | 'clearRound'>
  /** Places the Round and returns its Undo (see useAppState). */
  onPlace: (sections: Sections) => () => void
  overlays: Overlays
  onClose: () => void
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
export function CounterView({ round, sections, t, actions, onPlace, overlays, onClose }: CounterViewProps) {
  const lines = roundLines(round, sections)
  const total = totalOf(round)
  const backRef = useRef<HTMLButtonElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const fitAll = () => bodyRef.current?.querySelectorAll<HTMLElement>('.counter-what').forEach(fitName)
    fitAll()
    window.addEventListener('resize', fitAll)
    return () => window.removeEventListener('resize', fitAll)
  }, [lines])

  // The screen stays on while the bartender reads it.
  useEffect(() => keepScreenAwake(browserHost()), [])

  useEffect(() => {
    backRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const removeOne = (itemId: string) => {
    // Nothing is left to show once the last Item is gone.
    if (total === 1) onClose()
    actions.removeFromRound(itemId)
  }
  const clear = () => {
    onClose()
    actions.clearRound()
  }
  const markOrdered = () => {
    const undo = onPlace(sections)
    onClose()
    overlays.notify(t.roundPlaced, { label: t.undo, run: undo })
  }
  const share = async () => {
    const outcome = await shareOrCopy(shareText(lines, t.total), navigator)
    if (outcome === 'copied') overlays.notify(t.copied)
  }

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
              <button type="button" aria-label={t.removeOne(item.name)} onClick={() => removeOne(item.id)}>
                −
              </button>
              <button type="button" aria-label={t.addOne(item.name)} onClick={() => actions.addToRound(item.id)}>
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
        <button ref={backRef} type="button" className="icon-btn" aria-label={t.backToRound} onClick={onClose}>
          <svg viewBox="0 0 24 24" aria-hidden="true" className="btn-icon">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className="counter-actions">
          <button type="button" className="btn btn-quiet" onClick={share}>
            <svg viewBox="0 0 24 24" aria-hidden="true" className="btn-icon">
              <path d="M12 15V3M8 7l4-4 4 4M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
            </svg>
            {t.share}
          </button>
          <button type="button" className="btn btn-quiet" onClick={clear}>
            {t.clear}
          </button>
        </div>
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

      <button type="button" className="btn btn-primary btn-big" onClick={markOrdered}>
        <svg viewBox="0 0 24 24" aria-hidden="true" className="btn-icon">
          <path d="M5 12l5 5 9-10" />
        </svg>
        {t.markOrdered}
      </button>
    </div>
  )
}
