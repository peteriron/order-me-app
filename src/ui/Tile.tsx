import type { Item } from '../domain/index.ts'

interface TileProps {
  item: Item
  count: number
  label: string
  removeLabel: string
  onAdd: () => void
  onRemove: () => void
}

function buzz() {
  try {
    navigator.vibrate?.(10)
  } catch {
    // Haptics are a nicety; some browsers throw instead of ignoring.
  }
}

export function Tile({ item, count, label, removeLabel, onAdd, onRemove }: TileProps) {
  return (
    <div className={count ? 'tile has-count' : 'tile'}>
      <button
        type="button"
        className="tile-add"
        aria-label={label}
        onClick={() => {
          buzz()
          onAdd()
        }}
      >
        <span className="tile-emoji" aria-hidden="true">
          {item.emoji}
        </span>
        <span className="tile-name">{item.name}</span>
      </button>
      {count > 0 && (
        <>
          {/* A sibling of the add button, not inside it, so a − tap can never also add. */}
          <button
            type="button"
            className="tile-remove"
            aria-label={removeLabel}
            onClick={() => {
              buzz()
              onRemove()
            }}
          >
            <span aria-hidden="true">−</span>
          </button>
          {/* Keyed by count so the pop animation replays on every change. */}
          <span key={count} className="badge" aria-hidden="true">
            {count}
          </span>
        </>
      )}
    </div>
  )
}
