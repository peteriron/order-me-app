import { countOf, type ComposingRound, type GridSections } from '../domain/index.ts'
import type { Messages } from '../i18n/index.ts'
import { Tile } from './Tile.tsx'

interface RoundPageProps {
  sections: GridSections
  round: ComposingRound
  t: Messages
  onAdd: (itemId: string) => void
}

export function RoundPage({ sections, round, t, onAdd }: RoundPageProps) {
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
            <Tile key={item.id} item={item} count={count} label={t.tileLabel(item.name, count)} onAdd={() => onAdd(item.id)} />
          )
        })}
      </div>
    </section>
  )

  return (
    <main className="page">
      <h1 className="page-title">{t.appName}</h1>
      {section('drink', t.drinks)}
      {section('snack', t.snacks)}
    </main>
  )
}
