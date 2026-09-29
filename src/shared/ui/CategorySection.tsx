import type { ReactNode } from 'react'
import type { Category } from '../../items/catalog.ts'

interface CategorySectionProps {
  category: Category
  heading: string
  /** Makes the heading's id unique per page, e.g. "items" gives "items-heading-drink". */
  idPrefix: string
  children: ReactNode
}

/** A Drinks or Snacks section: the heading with its category dot, then the content. */
export function CategorySection({ category, heading, idPrefix, children }: CategorySectionProps) {
  const id = `${idPrefix}-heading-${category}`
  return (
    <section className="section" aria-labelledby={id}>
      <h2 className="section-label" id={id}>
        <span className={`dot dot-${category}`} aria-hidden="true" />
        {heading}
      </h2>
      {children}
    </section>
  )
}
