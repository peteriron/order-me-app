import type { Locale } from '../domain/index.ts'

/** Dutch when the device language is any flavour of Dutch, otherwise English. */
export function detectLocale(language: string | undefined): Locale {
  return language?.toLowerCase().startsWith('nl') ? 'nl' : 'en'
}

export interface Messages {
  appName: string
  drinks: string
  snacks: string
  tileLabel: (name: string, count: number) => string
  history: string
  round: string
  items: string
  pages: string
  historySoon: string
  itemsSoon: string
}

export const messages: Record<Locale, Messages> = {
  en: {
    appName: 'This round is for me',
    drinks: 'Drinks',
    snacks: 'Snacks',
    tileLabel: (name, count) => (count ? `${name}, ${count} in round` : name),
    history: 'History',
    round: 'Round',
    items: 'Items',
    pages: 'Pages',
    historySoon: 'Rounds you mark as ordered will show up here.',
    itemsSoon: 'This is where you’ll add and edit the drinks and snacks in your Catalog.',
  },
  nl: {
    appName: 'Deze ronde is voor mij',
    drinks: 'Dranken',
    snacks: 'Snacks',
    tileLabel: (name, count) => (count ? `${name}, ${count} in ronde` : name),
    history: 'Geschiedenis',
    round: 'Ronde',
    items: 'Items',
    pages: 'Pagina’s',
    historySoon: 'Rondes die je als besteld markeert, verschijnen hier.',
    itemsSoon: 'Hier voeg je straks drankjes en snacks aan je catalogus toe en bewerk je ze.',
  },
}
