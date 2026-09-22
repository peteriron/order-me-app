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
  onShow?: () => void
}

export function RoundPage({ sections, round, t, onAdd, onRemove, onClear, onShow }: RoundPageProps) {
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
      <RoundBar total={totalOf(round)} t={t} onClear={onClear} onShow={onShow} />
    </>
  )
}
