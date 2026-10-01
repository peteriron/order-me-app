import type { Sections } from '../items/catalog.ts'
import type { Messages } from '../shared/i18n.ts'
import { CategorySection } from '../shared/ui/CategorySection.tsx'
import type { AppActions } from '../useAppState.ts'
import { RoundBar } from './RoundBar.tsx'
import { Tile } from './Tile.tsx'
import { countOf, totalOf, type ComposingRound } from './round.ts'

interface RoundPageProps {
  sections: Sections
  round: ComposingRound
  t: Messages
  actions: Pick<AppActions, 'addToRound' | 'removeFromRound' | 'clearRound'>
  onShow: () => void
  onNew: () => void
}

export function RoundPage({ sections, round, t, actions, onShow, onNew }: RoundPageProps) {
  const section = (category: keyof Sections, heading: string) => (
    <CategorySection category={category} heading={heading} idPrefix="round">
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
              onAdd={() => actions.addToRound(item.id)}
              onRemove={() => actions.removeFromRound(item.id)}
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
    </CategorySection>
  )

  return (
    <>
      <div className="page">
        <h1 className="page-title">{t.appName}</h1>
        {section('drink', t.drinks)}
        {section('snack', t.snacks)}
      </div>
      <RoundBar total={totalOf(round)} t={t} onClear={actions.clearRound} onShow={onShow} />
    </>
  )
}
