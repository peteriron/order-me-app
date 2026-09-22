import { useRef, useState, type MouseEvent, type PointerEvent, type ReactNode } from 'react'
import { classify, dragOffset, settle, type GestureIntent } from './swipe.ts'

interface PagerProps {
  pages: ReactNode[]
  page: number
  onPageChange: (page: number) => void
}

interface Gesture {
  pointerId: number
  x: number
  y: number
  startedAt: number
  intent: GestureIntent
}

/** A tap straight after a swipe is the swipe's own click; swallow it so it can't add a tile. */
const SWALLOW_CLICK_MS = 300

/**
 * Horizontally swipeable pages (ADR-0003). Vertical movement is left to the browser (each page scrolls itself);
 * only a deliberate, mostly-horizontal drag moves the track.
 */
export function Pager({ pages, page, onPageChange }: PagerProps) {
  const lastPage = pages.length - 1
  const gesture = useRef<Gesture | null>(null)
  const swallowClicksUntil = useRef(0)
  const [offset, setOffset] = useState<number | null>(null)

  const onPointerDown = (e: PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    gesture.current = { pointerId: e.pointerId, x: e.clientX, y: e.clientY, startedAt: e.timeStamp, intent: 'undecided' }
  }

  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    const g = gesture.current
    if (!g || g.pointerId !== e.pointerId || g.intent === 'other') return
    const dx = e.clientX - g.x
    if (g.intent === 'undecided') {
      g.intent = classify(dx, e.clientY - g.y)
      if (g.intent !== 'swipe') return
      e.currentTarget.setPointerCapture(e.pointerId)
    }
    setOffset(dragOffset(dx, page, lastPage))
  }

  const onPointerUp = (e: PointerEvent<HTMLElement>) => {
    const g = gesture.current
    if (!g || g.pointerId !== e.pointerId) return
    gesture.current = null
    if (g.intent !== 'swipe') return
    swallowClicksUntil.current = e.timeStamp + SWALLOW_CLICK_MS
    setOffset(null)
    const next = settle({ page, lastPage, dx: e.clientX - g.x, ms: e.timeStamp - g.startedAt, width: e.currentTarget.clientWidth })
    if (next !== page) onPageChange(next)
  }

  const onPointerCancel = () => {
    gesture.current = null
    setOffset(null)
  }

  const onClickCapture = (e: MouseEvent) => {
    if (e.timeStamp < swallowClicksUntil.current) {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  return (
    <main
      className="pager"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onClickCapture={onClickCapture}
    >
      <div
        className={offset === null ? 'pager-track' : 'pager-track dragging'}
        style={{ transform: `translateX(calc(${-page * 100}% + ${offset ?? 0}px))` }}
      >
        {pages.map((content, i) => (
          // inert keeps focus and taps out; aria-hidden covers browsers and tools that don't honour inert yet.
          <div key={i} className="pager-page" inert={i !== page} aria-hidden={i !== page}>
            {content}
          </div>
        ))}
      </div>
    </main>
  )
}
