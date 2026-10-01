import { useRef, useState, type PointerEvent, type ReactNode } from 'react'
import type { Messages } from '../shared/i18n.ts'
import { CategorySection } from '../shared/ui/CategorySection.tsx'
import type { AppActions } from '../useAppState.ts'
import type { Category, Item, Sections } from './catalog.ts'
import type { Pins } from './pins.ts'

interface ItemsPageProps {
  /** The Catalog per category, Pinned Items first, then A–Z (catalogSections), independent of the grid's order. */
  sections: Sections
  pins: Pins
  count: number
  t: Messages
  actions: Pick<AppActions, 'togglePin' | 'movePin'>
  onAdd: () => void
  onEdit: (item: Item) => void
  /** The Settings section, shown below the Catalog. */
  children?: ReactNode
}

/**
 * The Operator's Catalog: every Item by category, each row opening the edit sheet and pinning the Item. Pinned Items
 * come first and are reordered by dragging their handle, or with Move up / Move down for keyboard and screen readers.
 */
export function ItemsPage({ sections, pins, count, t, actions, onAdd, onEdit, children }: ItemsPageProps) {
  const pinned = new Set(pins)
  const drag = useRef<{ itemId: string; pointerId: number } | null>(null)
  const [dragging, setDragging] = useState<string | null>(null)

  const startDrag = (e: PointerEvent<HTMLElement>, itemId: string) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    // The handle's drag belongs to the list: keep the Pager from reading it as a page swipe (ADR-0003).
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { itemId, pointerId: e.pointerId }
    setDragging(itemId)
  }

  /** Moves the dragged Item to the pinned row under the finger, live, so the list always shows where it will land. */
  const followDrag = (e: PointerEvent<HTMLElement>) => {
    const d = drag.current
    if (!d || d.pointerId !== e.pointerId) return
    const rows = [...(e.currentTarget.closest('.item-rows')?.querySelectorAll<HTMLElement>('[data-pinned]') ?? [])]
    const under = rows.findIndex((row) => e.clientY < row.getBoundingClientRect().bottom)
    const to = under === -1 ? rows.length - 1 : under
    if (rows[to]?.dataset.itemId !== d.itemId) actions.movePin(d.itemId, to)
  }

  const endDrag = (e: PointerEvent<HTMLElement>) => {
    if (drag.current?.pointerId !== e.pointerId) return
    drag.current = null
    setDragging(null)
  }

  const row = (item: Item, index: number, pinnedCount: number) => {
    const isPinned = pinned.has(item.id)
    const move = (to: number) => {
      if (to >= 0 && to < pinnedCount) actions.movePin(item.id, to)
    }
    return (
      <div
        key={item.id}
        className={`item-row${isPinned ? ' pinned' : ''}${dragging === item.id ? ' dragging' : ''}`}
        data-item-id={item.id}
        data-pinned={isPinned || undefined}
      >
        {isPinned && (
          // Pointer-only; the Move buttons below are the keyboard and screen-reader way to reorder.
          <span
            className="item-row-handle"
            aria-hidden="true"
            onPointerDown={(e) => startDrag(e, item.id)}
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
    )
  }

  const section = (category: Category, heading: string) => {
    const items = sections[category]
    const pinnedCount = items.filter((i) => pinned.has(i.id)).length
    return (
      <CategorySection category={category} heading={heading} idPrefix="items">
        <div className="item-rows">{items.map((item, index) => row(item, index, pinnedCount))}</div>
      </CategorySection>
    )
  }

  return (
    <section className="page" aria-labelledby="items-title">
      <header className="page-head">
        <h1 className="page-title" id="items-title">
          {t.items}
        </h1>
        <span className="page-sub">{t.catalogCount(count)}</span>
      </header>
      <button type="button" className="btn btn-primary btn-block" onClick={onAdd}>
        <svg viewBox="0 0 24 24" aria-hidden="true" className="btn-icon">
          <path d="M12 5v14M5 12h14" />
        </svg>
        {t.addItem}
      </button>
      {section('drink', t.drinks)}
      {section('snack', t.snacks)}
      {children}
    </section>
  )
}
