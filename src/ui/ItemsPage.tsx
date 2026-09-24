import type { ReactNode } from 'react'
import type { Category, GridSections, Item } from '../domain/index.ts'
import type { Messages } from '../i18n/index.ts'

interface ItemsPageProps {
  /** The Catalog A–Z per category (catalogSections), independent of the grid's order. */
  sections: GridSections
  count: number
  t: Messages
  onAdd: () => void
  onEdit: (item: Item) => void
  /** The Settings section, shown below the Catalog. */
  children?: ReactNode
}

/** The Operator's Catalog: every Item by category, A–Z, each row opening the edit sheet. */
export function ItemsPage({ sections, count, t, onAdd, onEdit, children }: ItemsPageProps) {
  const section = (category: Category, heading: string) => (
    <section className="section" aria-labelledby={`items-heading-${category}`}>
      <h2 className="section-label" id={`items-heading-${category}`}>
        <span className={`dot dot-${category}`} aria-hidden="true" />
        {heading}
      </h2>
      <div className="item-rows">
        {sections[category].map((item) => (
          <button
            key={item.id}
            type="button"
            className="item-row"
            aria-label={t.editNamed(item.name)}
            onClick={() => onEdit(item)}
          >
            <span className="item-row-emoji">{item.emoji}</span>
            <span className="item-row-name">{item.name}</span>
            <svg viewBox="0 0 24 24" aria-hidden="true" className="btn-icon item-row-edit">
              <path d="M4 20h4L19 9l-4-4L4 16z" />
            </svg>
          </button>
        ))}
      </div>
    </section>
  )

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
