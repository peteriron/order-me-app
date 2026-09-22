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
  removeOne: (name: string) => string
  roundTotal: string
  itemsCount: (n: number) => string
  emptyHint: string
  clear: string
  show: string
  counterTitle: string
  backToRound: string
  addOne: (name: string) => string
  total: string
  markOrdered: string
  roundPlaced: string
  undo: string
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
    removeOne: (name) => `Remove one ${name}`,
    roundTotal: 'Round total',
    itemsCount: (n) => `${n} ${n === 1 ? 'item' : 'items'}`,
    emptyHint: 'Tap a drink to start',
    clear: 'Clear',
    show: 'Show',
    counterTitle: 'Round for the counter',
    backToRound: 'Back to Round',
    addOne: (name) => `Add one ${name}`,
    total: 'Total',
    markOrdered: 'Mark as ordered',
    roundPlaced: 'Round placed',
    undo: 'Undo',
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
    removeOne: (name) => `Eén ${name} minder`,
    roundTotal: 'Totaal van de ronde',
    itemsCount: (n) => `${n} ${n === 1 ? 'item' : 'items'}`,
    emptyHint: 'Tik op een drankje om te starten',
    clear: 'Wissen',
    show: 'Toon',
    counterTitle: 'Ronde voor de toog',
    backToRound: 'Terug naar ronde',
    addOne: (name) => `Eén ${name} meer`,
    total: 'Totaal',
    markOrdered: 'Besteld',
    roundPlaced: 'Ronde geplaatst',
    undo: 'Ongedaan maken',
    history: 'Geschiedenis',
    round: 'Ronde',
    items: 'Items',
    pages: 'Pagina’s',
    historySoon: 'Rondes die je als besteld markeert, verschijnen hier.',
    itemsSoon: 'Hier voeg je straks drankjes en snacks aan je catalogus toe en bewerk je ze.',
  },
}
