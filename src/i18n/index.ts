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
}

export const messages: Record<Locale, Messages> = {
  en: {
    appName: 'This round is for me',
    drinks: 'Drinks',
    snacks: 'Snacks',
    tileLabel: (name, count) => (count ? `${name}, ${count} in round` : name),
  },
  nl: {
    appName: 'Deze ronde is voor mij',
    drinks: 'Dranken',
    snacks: 'Snacks',
    tileLabel: (name, count) => (count ? `${name}, ${count} in ronde` : name),
  },
}
