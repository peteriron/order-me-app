import type { LanguageSetting } from '../shared/i18n.ts'

/** 'system' follows the phone's light/dark preference. */
export type ThemeSetting = 'dark' | 'light' | 'system'

export interface Settings {
  language: LanguageSetting
  theme: ThemeSetting
}

/** Dark by default: the app is used in dim bars (PRD). */
export const DEFAULT_SETTINGS: Settings = { language: 'system', theme: 'dark' }
