import { useRef, useState, type MouseEvent, type PointerEvent } from 'react'
import { classify, releaseVelocity, rowOffset, settleRow, type GestureIntent, type Sample } from '../shared/ui/swipe.ts'

/** Width of the red delete button a row reveals, in px. */
const DELETE_BUTTON = 72
/** How long after a swipe or a closing tap its own click may arrive. */
const SWALLOW_CLICK_MS = 600

interface RowGesture {
  itemId: string
  pointerId: number
  x: number
  y: number
  /** Was the row open when the finger touched down? */
  open: boolean
  intent: GestureIntent
  samples: Sample[]
}

/**
 * Swipe an Item row from right to left to reveal its delete button (#54). It decides with the Pager's own rules
 * (`classify`), so the two agree on every movement: a row claims right-to-left swipes, and left-to-right ones on an
 * open row; it then stops the events from reaching the Pager. A left-to-right swipe on a closed row isn't claimed,
 * so it still swipes the page (ADR-0003). One row is open at a time; a tap anywhere else closes it.
 */
export function useRowSwipe() {
  const gesture = useRef<RowGesture | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const [dragging, setDragging] = useState<{ itemId: string; offset: number } | null>(null)
  /** A swipe or a closing tap ends in a click; it must not also open the edit sheet. Until this event time. */
  const swallowClicksUntil = useRef(0)

  const rowHandlers = (itemId: string) => ({
    onPointerDown: (e: PointerEvent<HTMLElement>) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return
      gesture.current = {
        itemId,
        pointerId: e.pointerId,
        x: e.clientX,
        y: e.clientY,
        open: openId === itemId,
        intent: 'undecided',
        samples: [{ x: e.clientX, t: e.timeStamp }],
      }
    },
    onPointerMove: (e: PointerEvent<HTMLElement>) => {
      const g = gesture.current
      if (!g || g.pointerId !== e.pointerId || g.intent === 'other') return
      const dx = e.clientX - g.x
      if (g.intent === 'undecided') {
        g.intent = classify(dx, e.clientY - g.y)
        if (g.intent !== 'swipe') return
        // Left-to-right on a closed row is the Pager's: back to Show.
        if (dx > 0 && !g.open) {
          g.intent = 'other'
          return
        }
        e.currentTarget.setPointerCapture(e.pointerId)
      }
      e.stopPropagation()
      g.samples.push({ x: e.clientX, t: e.timeStamp })
      setDragging({ itemId, offset: rowOffset(dx, g.open, DELETE_BUTTON) })
    },
    onPointerUp: (e: PointerEvent<HTMLElement>) => {
      const g = gesture.current
      if (!g || g.pointerId !== e.pointerId) return
      gesture.current = null
      if (g.intent !== 'swipe') return
      e.stopPropagation()
      swallowClicksUntil.current = e.timeStamp + SWALLOW_CLICK_MS
      g.samples.push({ x: e.clientX, t: e.timeStamp })
      const offset = rowOffset(e.clientX - g.x, g.open, DELETE_BUTTON)
      const open = settleRow({ offset, velocity: releaseVelocity(g.samples), button: DELETE_BUTTON })
      setOpenId(open ? itemId : null)
      setDragging(null)
    },
    onPointerCancel: () => {
      gesture.current = null
      setDragging(null)
    },
    onClickCapture: (e: MouseEvent) => {
      // The click a swipe itself ends with (touch usually has none; a mouse always does): swallow it, but don't
      // treat it as a tap on the open row, or the row would close again the moment it opens.
      if (e.timeStamp < swallowClicksUntil.current) {
        e.preventDefault()
        e.stopPropagation()
        return
      }
      // A tap on an open row only closes it: no edit sheet.
      if (openId === itemId) {
        e.preventDefault()
        e.stopPropagation()
        setOpenId(null)
      }
    },
  })

  /** On the list: a finger touching down anywhere but the open row closes it, and that tap does nothing else. */
  const onListPointerDownCapture = (e: PointerEvent<HTMLElement>) => {
    if (!openId) return
    const inOpenRow = (e.target as Element).closest('[data-row-id]')?.getAttribute('data-row-id') === openId
    if (!inOpenRow) {
      setOpenId(null)
      swallowClicksUntil.current = e.timeStamp + SWALLOW_CLICK_MS
    }
  }

  /** How far a row is slid open now, in px (negative is to the left). */
  const offsetOf = (itemId: string) =>
    dragging?.itemId === itemId ? dragging.offset : openId === itemId ? -DELETE_BUTTON : 0

  return {
    openId,
    isDragging: (itemId: string) => dragging?.itemId === itemId,
    offsetOf,
    rowHandlers,
    onListPointerDownCapture,
    close: () => setOpenId(null),
  }
}
