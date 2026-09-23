import type { Ref } from 'react'
import { countOf, totalOf, type ComposingRound, type GridSections } from '../domain/index.ts'
import type { Messages } from '../i18n/index.ts'
import { RoundBar } from './RoundBar.tsx'
import { Tile } from './Tile.tsx'

interface RoundPageProps {
  sections: GridSections
  round: ComposingRound
  t: Messages
  onAdd: (itemId: string) => void
  onRemove: (itemId: string) => void
  onClear: () => void
  onShow: () => void
  onNew: () => void
  showRef?: Ref<HTMLButtonElement>
}

export function RoundPage({ sections, round, t, onAdd, onRemove, onClear, onShow, onNew, showRef }: RoundPageProps) {
  const section = (category: keyof GridSections, heading: string) => (
    <section className="section" aria-labelledby={`heading-${category}`}>
      <h2 className="section-label" id={`heading-${category}`}>
        <span className={`dot dot-${category}`} aria-hidden="true" />
        {heading}
      </h2>
      <div className="grid">
        {sections[category].map((item) => {
          const count = countOf(round, item.id)
          return (
            <Tile
              key={item.id}
              item={item}
              count={count}
              label={t.tileLabel(item.name, count)}
              removeLabel={t.removeOne(item.name)}
              onAdd={() => onAdd(item.id)}
              onRemove={() => onRemove(item.id)}
            />
          )
        })}
        {category === 'snack' && (
          // Last tile of the grid: add something that isn't in the Catalog yet, straight into the Round.
          <div className="tile tile-new">
            <button type="button" className="tile-add" aria-label={t.newItem} onClick={onNew}>
              <span className="tile-emoji" aria-hidden="true">
                +
              </span>
              <span className="tile-name">{t.newTile}</span>
            </button>
          </div>
        )}
      </div>
    </section>
  )

  return (
    <>
      <div className="page">
        <h1 className="page-title">{t.appName}</h1>
        {section('drink', t.drinks)}
        {section('snack', t.snacks)}
      </div>
      <RoundBar total={totalOf(round)} t={t} onClear={onClear} onShow={onShow} showRef={showRef} />
    </>
  )
}
