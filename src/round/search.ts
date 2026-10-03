import type { Item, Sections } from '../items/catalog.ts'

/** Lower case without accents, for matching as a reader expects: "rose" finds "Rosé". */
function fold(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase()
}

/**
 * The Round page's tiles for a search: in each section, the Items whose shown name contains the text (ignoring case,
 * accents and surrounding spaces), in grid order. A blank search shows everything.
 */
export function searchSections(sections: Sections, query: string): Sections {
  const wanted = fold(query.trim())
  if (!wanted) return sections
  const matches = (item: Item) => fold(item.name).includes(wanted)
  return { drink: sections.drink.filter(matches), snack: sections.snack.filter(matches) }
}
