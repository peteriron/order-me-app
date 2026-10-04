import { useState, type CSSProperties, type PointerEvent } from 'react'
import type { Messages } from '../shared/i18n.ts'
import type { Overlays } from '../shared/ui/overlays.ts'
import { CategorySection } from '../shared/ui/CategorySection.tsx'
import type { AppActions } from '../app/useAppState.ts'
import type { Category, Item, Sections } from './catalog.ts'
import type { Pins } from './pins.ts'
import { useRowSwipe } from './useRowSwipe.ts'

export interface ItemsSectionProps {
  /** The Catalog per category, Pinned Items first, then A–Z (catalogSections), independent of the grid's order. */
  sections: Sections
  pins: Pins
  count: number
  t: Messages
  actions: Pick<AppActions, 'togglePin' | 'movePin' | 'removeFromCatalog'>
  overlays: Overlays
  onAdd: () => void
  onShare: () => void
  onEdit: (item: Item) => void
}

/** A pinned row being dragged by its handle. */
interface Drag {
  itemId: string
  category: Category
  pointerId: number
  startY: number
  /** Where the row started and where it would land now, among its section's pinned rows. */
  from: number
  to: number
  /** How far the finger has moved since touching down. */
  dy: number
  /** The pinned rows' vertical midpoints and the dragged row's height, measured at the start. */
  mids: number[]
  height: number
}

/**
 * The Items section of the Settings page: the Operator's Catalog, every Item by category, each row opening the edit
 * sheet and pinning the Item. Pinned Items come first and are reordered by dragging their handle, or with Move up /
 * Move down for keyboard and screen readers.
 */
export function ItemsSection({ sections, pins, count, t, actions, overlays, onAdd, onShare, onEdit }: ItemsSectionProps) {
  const rows = useRowSwipe()
  /** Deletes at once; the toast's Undo puts it back where it was (#54). */
  const remove = (item: Item) => {
    rows.close()
    const undo = actions.removeFromCatalog(item.id)
    overlays.notify(t.itemDeleted(item.name), { label: t.undo, run: undo })
  }
  const pinned = new Set(pins)
  const [drag, setDrag] = useState<Drag | null>(null)

  const startDrag = (e: PointerEvent<HTMLElement>, item: Item, index: number) => {
    if (drag || (e.pointerType === 'mouse' && e.button !== 0)) return
    // The handle's drag belongs to the list: keep the Pager from reading it as a page swipe (ADR-0003).
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    const rows = [...(e.currentTarget.closest('.item-rows')?.querySelectorAll<HTMLElement>('[data-pinned]') ?? [])]
    const rects = rows.map((row) => row.getBoundingClientRect())
    setDrag({
      itemId: item.id,
      category: item.category,
      pointerId: e.pointerId,
      startY: e.clientY,
      from: index,
      to: index,
      dy: 0,
      mids: rects.map((rect) => rect.top + rect.height / 2),
      height: rects[index]?.height ?? 0,
    })
  }

  /**
   * Slides the dragged row with the finger and the rows it passes out of its way. The DOM order stays put until the
   * finger lifts: moving the node under a finger mid-gesture can end the touch (iOS Safari stops sending its events).
   */
  const followDrag = (e: PointerEvent<HTMLElement>) => {
    if (drag?.pointerId !== e.pointerId) return
    const dy = e.clientY - drag.startY
    const centre = drag.mids[drag.from]! + dy
    const to = drag.mids.filter((mid, i) => i !== drag.from && mid < centre).length
    setDrag({ ...drag, dy, to })
  }

  const endDrag = (e: PointerEvent<HTMLElement>) => {
    if (drag?.pointerId !== e.pointerId) return
    setDrag(null)
    if (e.type === 'pointerup' && drag.to !== drag.from) actions.movePin(drag.itemId, drag.to)
  }

  /** How far a pinned row is shifted while another row is dragged past it, or the dragged row itself follows. */
  const dragShift = (item: Item, index: number): CSSProperties | undefined => {
    if (!drag || drag.category !== item.category) return undefined
    if (item.id === drag.itemId) return { transform: `translateY(${drag.dy}px)` }
    if (drag.from < index && index <= drag.to) return { transform: `translateY(${-drag.height}px)` }
    if (drag.to <= index && index < drag.from) return { transform: `translateY(${drag.height}px)` }
    return undefined
  }

  const row = (item: Item, index: number, pinnedCount: number) => {
    const isPinned = pinned.has(item.id)
    const move = (to: number) => {
      if (to >= 0 && to < pinnedCount) actions.movePin(item.id, to)
    }
    const offset = rows.offsetOf(item.id)
    return (
      <div
        key={item.id}
        className={`item-row${isPinned ? ' pinned' : ''}${drag?.itemId === item.id ? ' dragging' : ''}`}
        data-pinned={isPinned || undefined}
        data-row-id={item.id}
        style={isPinned ? dragShift(item, index) : undefined}
      >
        {/* Behind the row, revealed by swiping it left (#54). Only there while visible, so it isn't focusable hidden. */}
        {offset < 0 && (
          <button type="button" className="item-row-delete" aria-label={t.deleteNamed(item.name)} onClick={() => remove(item)}>
            <svg viewBox="0 0 24 24" aria-hidden="true" className="btn-icon">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        )}
        <div
          className={`item-row-content${rows.isDragging(item.id) ? ' swiping' : ''}`}
          style={offset ? { transform: `translateX(${offset}px)` } : undefined}
          {...rows.rowHandlers(item.id)}
        >
          {isPinned && (
            // Pointer-only; the Move buttons below are the keyboard and screen-reader way to reorder.
            <span
              className="item-row-handle"
              aria-hidden="true"
              onPointerDown={(e) => startDrag(e, item, index)}
              onPointerMove={followDrag}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
            >
              <svg viewBox="0 0 24 24" className="grip">
                {[8, 16].flatMap((x) => [6, 12, 18].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.75" />))}
              </svg>
            </span>
          )}
          <button type="button" className="item-row-main" aria-label={t.editNamed(item.name)} onClick={() => onEdit(item)}>
            <span className="item-row-emoji">{item.emoji}</span>
            <span className="item-row-name">{item.name}</span>
            <svg viewBox="0 0 24 24" aria-hidden="true" className="btn-icon item-row-edit">
              <path d="M4 20h4L19 9l-4-4L4 16z" />
            </svg>
          </button>
          {isPinned && (
            <>
              {/* aria-disabled rather than disabled at the ends, so focus stays on the button as the row moves. */}
              <button
                type="button"
                className="item-row-move"
                aria-disabled={index === 0}
                onClick={() => move(index - 1)}
              >
                {t.moveUp(item.name)}
              </button>
              <button
                type="button"
                className="item-row-move"
                aria-disabled={index === pinnedCount - 1}
                onClick={() => move(index + 1)}
              >
                {t.moveDown(item.name)}
              </button>
            </>
          )}
          <button
            type="button"
            className="item-row-pin"
            aria-label={t.pinNamed(item.name)}
            aria-pressed={isPinned}
            onClick={() => actions.togglePin(item.id)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="btn-icon">
              <path d="M12 17v5" />
              <path d="M9 3h6l-1 6 3 3.5V15H7v-2.5L10 9z" />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  const section = (category: Category, heading: string) => {
    const items = sections[category]
    const pinnedCount = items.filter((i) => pinned.has(i.id)).length
    return (
      <CategorySection category={category} heading={heading} idPrefix="items">
        <div
          className={drag?.category === category ? 'item-rows reordering' : 'item-rows'}
          onPointerDownCapture={rows.onListPointerDownCapture}
        >
          {items.map((item, index) => row(item, index, pinnedCount))}
        </div>
      </CategorySection>
    )
  }

  return (
    <section className="items-section" aria-labelledby="items-title">
      <header className="page-head">
        <h2 className="section-title" id="items-title">
          {t.items}
        </h2>
        <span className="page-sub">{t.catalogCount(count)}</span>
      </header>
      <div className="items-actions">
        <button type="button" className="btn btn-primary" onClick={onAdd}>
          <svg viewBox="0 0 24 24" aria-hidden="true" className="btn-icon">
            <path d="M12 5v14M5 12h14" />
          </svg>
          {t.addItem}
        </button>
        <button type="button" className="btn btn-outline" onClick={onShare}>
          <svg viewBox="0 0 24 24" aria-hidden="true" className="btn-icon">
            <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 18h2v2h-2zM14 18h2M18 14h2" />
          </svg>
          {t.shareItems}
        </button>
      </div>
      {section('drink', t.drinks)}
      {section('snack', t.snacks)}
    </section>
  )
}
