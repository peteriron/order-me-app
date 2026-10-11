import type { LanguageSetting } from '../shared/i18n.ts'

/** 'system' follows the phone's light/dark preference. */
export type ThemeSetting = 'dark' | 'light' | 'system'

export interface Settings {
  language: LanguageSetting
  theme: ThemeSetting
  /**
   * When on, unpinned tiles follow Popularity; when off (the default), Catalog order. The device's own setting, never
   * part of a Shared Catalog.
   */
  orderByPopularity: boolean
}

/** Dark by default: the app is used in dim bars (PRD). Catalog order by default (v6). */
export const DEFAULT_SETTINGS: Settings = { language: 'system', theme: 'dark', orderByPopularity: false }

/** Saved settings with any setting added since they were saved at its default: a v5 save gets Catalog order. */
export function withDefaults(saved: Partial<Settings> | undefined): Settings {
  return { ...DEFAULT_SETTINGS, ...saved }
}
