import { useEffect, useLayoutEffect, useRef } from 'react'
import type { Sections } from '../items/catalog.ts'
import { roundLines, totalOf, type ComposingRound } from '../round/round.ts'
import type { Messages } from '../shared/i18n.ts'
import type { Overlays } from '../shared/ui/overlays.ts'
import type { AppActions } from '../useAppState.ts'
import { shareOrCopy, shareText } from './share.ts'
import { browserHost, keepScreenAwake } from './wakeLock.ts'

interface ShowPageProps {
  round: ComposingRound
  /** The grid's tile order, so lines read in the same order as the tiles. */
  sections: Sections
  /** True while this is the page on screen: the screen is kept awake only then. */
  active: boolean
  t: Messages
  actions: Pick<AppActions, 'addToRound' | 'removeFromRound'>
  /** Places the Round and returns its Undo (see useAppState). */
  onPlace: (sections: Sections) => () => void
  overlays: Overlays
  /** Slides to the Round page: from the empty state, and after Mark as ordered. */
  onGoToRound: () => void
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

/**
 * The Show page (ADR-0005): the Round in large type to read out or show to the bartender, and the place to mark it
 * as ordered. A swipe page between Round and Items; Clear lives on the Round page only.
 */
export function ShowPage({ round, sections, active, t, actions, onPlace, overlays, onGoToRound }: ShowPageProps) {
  const lines = roundLines(round, sections)
  const total = totalOf(round)
  const bodyRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const fitAll = () => bodyRef.current?.querySelectorAll<HTMLElement>('.counter-what').forEach(fitName)
    fitAll()
    window.addEventListener('resize', fitAll)
    return () => window.removeEventListener('resize', fitAll)
  }, [lines])

  // The screen stays on while the bartender reads it, and may sleep once the Operator swipes away.
  useEffect(() => (active ? keepScreenAwake(browserHost()) : undefined), [active])

  const markOrdered = () => {
    const undo = onPlace(sections)
    onGoToRound()
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
              {' '}
              {item.name}
            </span>
            <span className="counter-controls">
              <button type="button" aria-label={t.removeOne(item.name)} onClick={() => actions.removeFromRound(item.id)}>
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
    <section className="page show-page" aria-labelledby="show-title">
      <header className="page-head">
        <h1 className="page-title" id="show-title">
          {t.counterTitle}
        </h1>
        {total > 0 && (
          <button type="button" className="btn btn-quiet" onClick={share}>
            <svg viewBox="0 0 24 24" aria-hidden="true" className="btn-icon">
              <path d="M12 15V3M8 7l4-4 4 4M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
            </svg>
            {t.share}
          </button>
        )}
      </header>

      {total === 0 ? (
        <div className="show-empty">
          <p>{t.showEmpty}</p>
          <button type="button" className="btn btn-outline" onClick={onGoToRound}>
            {t.backToRound}
          </button>
        </div>
      ) : (
        <>
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

          <div className="show-bar">
            <button type="button" className="btn btn-primary btn-big btn-block" onClick={markOrdered}>
              <svg viewBox="0 0 24 24" aria-hidden="true" className="btn-icon">
                <path d="M5 12l5 5 9-10" />
              </svg>
              {t.markOrdered}
            </button>
          </div>
        </>
      )}
    </section>
  )
}
