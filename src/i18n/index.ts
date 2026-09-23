import type { Locale } from '../domain/index.ts'

/** Dutch when the device language is any flavour of Dutch, otherwise English. */
export function detectLocale(language: string | undefined): Locale {
  return language?.toLowerCase().startsWith('nl') ? 'nl' : 'en'
}

/**
 * The locale for formatting dates and times: the phone's full locale (e.g. en-GB, with its 24-hour clock) when it
 * speaks the app language, otherwise just the app language.
 */
export function formattingLocale(appLocale: Locale, deviceLanguage: string | undefined): string {
  const deviceLang = deviceLanguage?.toLowerCase().split('-')[0]
  return deviceLanguage && deviceLang === appLocale ? deviceLanguage : appLocale
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
  historyEmpty: string
  roundsCount: (n: number) => string
  today: string
  yesterday: string
  roundAt: (time: string) => string
  deleteRoundFrom: (time: string) => string
  deleteRoundConfirm: string
  delete: string
  cancel: string
  orderAgain: string
  skippedItems: (n: number) => string
  catalogCount: (n: number) => string
  addItem: string
  editItem: string
  editNamed: (name: string) => string
  name: string
  namePlaceholder: string
  category: string
  drink: string
  snack: string
  emoji: string
  typeYourOwn: string
  add: string
  save: string
  nameRequired: string
  emojiRequired: string
  deleteItemConfirm: (name: string) => string
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
    historyEmpty: 'No Rounds yet. Mark a Round as ordered and it shows up here.',
    roundsCount: (n) => `${n} ${n === 1 ? 'Round' : 'Rounds'}`,
    today: 'Today',
    yesterday: 'Yesterday',
    roundAt: (time) => `Round at ${time}`,
    deleteRoundFrom: (time) => `Delete Round from ${time}`,
    deleteRoundConfirm: 'Delete this Round from history?',
    delete: 'Delete',
    cancel: 'Cancel',
    orderAgain: 'Order again',
    skippedItems: (n) =>
      n === 1 ? '1 item no longer exists and was skipped' : `${n} items no longer exist and were skipped`,
    catalogCount: (n) => `${n} in your Catalog`,
    addItem: 'Add Item',
    editItem: 'Edit Item',
    editNamed: (name) => `Edit ${name}`,
    name: 'Name',
    namePlaceholder: 'e.g. Kriek',
    category: 'Category',
    drink: 'Drink',
    snack: 'Snack',
    emoji: 'Emoji',
    typeYourOwn: 'Or type your own',
    add: 'Add',
    save: 'Save',
    nameRequired: 'Give the Item a name',
    emojiRequired: 'Pick an emoji',
    deleteItemConfirm: (name) => `Delete “${name}”? History keeps it.`,
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
    historyEmpty: 'Nog geen rondes. Markeer een ronde als besteld en ze verschijnt hier.',
    roundsCount: (n) => `${n} ${n === 1 ? 'ronde' : 'rondes'}`,
    today: 'Vandaag',
    yesterday: 'Gisteren',
    roundAt: (time) => `Ronde van ${time}`,
    deleteRoundFrom: (time) => `Ronde van ${time} verwijderen`,
    deleteRoundConfirm: 'Deze ronde uit de geschiedenis verwijderen?',
    delete: 'Verwijderen',
    cancel: 'Annuleren',
    orderAgain: 'Opnieuw bestellen',
    skippedItems: (n) =>
      n === 1 ? '1 item bestaat niet meer en is overgeslagen' : `${n} items bestaan niet meer en zijn overgeslagen`,
    catalogCount: (n) => `${n} in je catalogus`,
    addItem: 'Item toevoegen',
    editItem: 'Item bewerken',
    editNamed: (name) => `${name} bewerken`,
    name: 'Naam',
    namePlaceholder: 'bv. Kriek',
    category: 'Categorie',
    drink: 'Drank',
    snack: 'Snack',
    emoji: 'Emoji',
    typeYourOwn: 'Of typ er zelf een',
    add: 'Toevoegen',
    save: 'Bewaren',
    nameRequired: 'Geef het item een naam',
    emojiRequired: 'Kies een emoji',
    deleteItemConfirm: (name) => `“${name}” verwijderen? De geschiedenis blijft behouden.`,
  },
}
