import type { Item } from '../domain/index.ts'

interface TileProps {
  item: Item
  count: number
  label: string
  onAdd: () => void
}

export function Tile({ item, count, label, onAdd }: TileProps) {
  const tap = () => {
    try {
      navigator.vibrate?.(10)
    } catch {
      // Haptics are a nicety; some browsers throw instead of ignoring.
    }
    onAdd()
  }

  return (
    <div className={count ? 'tile has-count' : 'tile'}>
      <button type="button" className="tile-add" aria-label={label} onClick={tap}>
        <span className="tile-emoji" aria-hidden="true">
          {item.emoji}
        </span>
        <span className="tile-name">{item.name}</span>
      </button>
      {count > 0 && (
        // Keyed by count so the pop animation replays on every change.
        <span key={count} className="badge" aria-hidden="true">
          {count}
        </span>
      )}
    </div>
  )
}
