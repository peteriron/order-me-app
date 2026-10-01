export type Locale = 'en' | 'nl'
/** 'system' follows the phone's language. */
export type LanguageSetting = 'system' | Locale

/** Dutch when the device language is any flavour of Dutch, otherwise English. */
export function detectLocale(language: string | undefined): Locale {
  return language?.toLowerCase().startsWith('nl') ? 'nl' : 'en'
}

/** The language the app speaks: the Operator's choice, or the phone's language for 'system'. */
export function resolveLocale(setting: LanguageSetting, deviceLanguage: string | undefined): Locale {
  return setting === 'system' ? detectLocale(deviceLanguage) : setting
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
  share: string
  copied: string
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
  newTile: string
  newItem: string
  addToRound: string
  editItem: string
  editNamed: (name: string) => string
  pinNamed: (name: string) => string
  shareItems: string
  shareItemsHint: string
  qrAlt: (n: number) => string
  tooBigForQr: string
  saveImage: string
  copyLink: string
  done: string
  replaceCatalogConfirm: (current: number, shared: number) => string
  replace: string
  badShareLink: string
  moveUp: (name: string) => string
  moveDown: (name: string) => string
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
  settings: string
  language: string
  theme: string
  system: string
  dark: string
  light: string
  clearHistory: string
  clearHistoryConfirm: string
  resetApp: string
  resetAppConfirm: string
  reset: string
  resetOffline: string
}

export const messages: Record<Locale, Messages> = {
  en: {
    appName: 'This round is on me',
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
    share: 'Share',
    copied: 'Copied to clipboard',
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
    newTile: 'New',
    newItem: 'New Item',
    addToRound: 'Add to Round',
    editItem: 'Edit Item',
    editNamed: (name) => `Edit ${name}`,
    pinNamed: (name) => `Pin ${name}`,
    shareItems: 'Share Items',
    shareItemsHint: 'Scan with a phone camera to open the app with these Items.',
    qrAlt: (n) => `QR code with your ${n} Items`,
    tooBigForQr: 'Too many Items for a QR code that scans reliably. Copy the link instead.',
    saveImage: 'Save image',
    copyLink: 'Copy link',
    done: 'Done',
    replaceCatalogConfirm: (current, shared) => `Replace your ${current} Items with the ${shared} shared Items? History is kept.`,
    replace: 'Replace',
    badShareLink: 'That share link couldn’t be read',
    moveUp: (name) => `Move ${name} up`,
    moveDown: (name) => `Move ${name} down`,
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
    settings: 'Settings',
    language: 'Language',
    theme: 'Theme',
    system: 'System',
    dark: 'Dark',
    light: 'Light',
    clearHistory: 'Clear history',
    clearHistoryConfirm: 'Delete all past Rounds?',
    resetApp: 'Reset app',
    resetAppConfirm:
      'Reset the app to how it was first installed? This deletes your Items, pins, the Round, all History and your settings, and loads the newest version.',
    reset: 'Reset',
    resetOffline: 'No connection. Resetting needs internet to load the newest version.',
  },
  nl: {
    appName: 'Dit rondje is van mij',
    drinks: 'Dranken',
    snacks: 'Snacks',
    tileLabel: (name, count) => (count ? `${name}, ${count} in rondje` : name),
    removeOne: (name) => `Eén ${name} minder`,
    roundTotal: 'Totaal van het rondje',
    itemsCount: (n) => `${n} ${n === 1 ? 'item' : 'items'}`,
    emptyHint: 'Tik op een drankje om te starten',
    clear: 'Wissen',
    show: 'Toon',
    counterTitle: 'Rondje voor de toog',
    backToRound: 'Terug naar rondje',
    addOne: (name) => `Eén ${name} meer`,
    total: 'Totaal',
    share: 'Delen',
    copied: 'Gekopieerd',
    markOrdered: 'Besteld',
    roundPlaced: 'Rondje geplaatst',
    undo: 'Ongedaan maken',
    history: 'Geschiedenis',
    round: 'Rondje',
    items: 'Items',
    pages: 'Pagina’s',
    historyEmpty: 'Nog geen rondjes. Markeer een rondje als besteld en het verschijnt hier.',
    roundsCount: (n) => `${n} ${n === 1 ? 'rondje' : 'rondjes'}`,
    today: 'Vandaag',
    yesterday: 'Gisteren',
    roundAt: (time) => `Rondje van ${time}`,
    deleteRoundFrom: (time) => `Rondje van ${time} verwijderen`,
    deleteRoundConfirm: 'Dit rondje uit de geschiedenis verwijderen?',
    delete: 'Verwijderen',
    cancel: 'Annuleren',
    orderAgain: 'Opnieuw bestellen',
    skippedItems: (n) =>
      n === 1 ? '1 item bestaat niet meer en is overgeslagen' : `${n} items bestaan niet meer en zijn overgeslagen`,
    catalogCount: (n) => `${n} in je catalogus`,
    addItem: 'Item toevoegen',
    newTile: 'Nieuw',
    newItem: 'Nieuw item',
    addToRound: 'Aan rondje toevoegen',
    editItem: 'Item bewerken',
    editNamed: (name) => `${name} bewerken`,
    pinNamed: (name) => `${name} vastzetten`,
    shareItems: 'Items delen',
    shareItemsHint: 'Scan met een telefooncamera om de app met deze items te openen.',
    qrAlt: (n) => `QR-code met je ${n} items`,
    tooBigForQr: 'Te veel items voor een QR-code die vlot scant. Kopieer de link.',
    saveImage: 'Afbeelding bewaren',
    copyLink: 'Link kopiëren',
    done: 'Klaar',
    replaceCatalogConfirm: (current, shared) =>
      `Je ${current} items vervangen door de ${shared} gedeelde items? De geschiedenis blijft behouden.`,
    replace: 'Vervangen',
    badShareLink: 'Die deellink kon niet gelezen worden',
    moveUp: (name) => `${name} omhoog`,
    moveDown: (name) => `${name} omlaag`,
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
    settings: 'Instellingen',
    language: 'Taal',
    theme: 'Thema',
    system: 'Systeem',
    dark: 'Donker',
    light: 'Licht',
    clearHistory: 'Geschiedenis wissen',
    clearHistoryConfirm: 'Alle vorige rondjes verwijderen?',
    resetApp: 'App resetten',
    resetAppConfirm:
      'De app terugzetten zoals bij de installatie? Je items, vastgezette items, het rondje, de hele geschiedenis en je instellingen worden gewist, en de nieuwste versie wordt geladen.',
    reset: 'Resetten',
    resetOffline: 'Geen verbinding. Om te resetten is internet nodig voor de nieuwste versie.',
  },
}
