import type { LanguageSetting, Messages } from '../shared/i18n.ts'
import type { Overlays } from '../shared/ui/overlays.ts'
import type { AppActions } from '../useAppState.ts'
import type { Settings, ThemeSetting } from './settings.ts'

interface SettingsSectionProps {
  settings: Settings
  hasHistory: boolean
  t: Messages
  actions: Pick<AppActions, 'setLanguage' | 'setTheme' | 'clearHistory'>
  overlays: Overlays
}

/** The few rarely-used options, at the bottom of the Items page (PRD). */
export function SettingsSection({ settings, hasHistory, t, actions, overlays }: SettingsSectionProps) {
  const confirmClearHistory = () =>
    overlays.confirm({ text: t.clearHistoryConfirm, confirmLabel: t.clearHistory, onConfirm: actions.clearHistory })

  // Each language is named in itself, so it can be found whatever the app is currently showing.
  const languages: [LanguageSetting, string][] = [
    ['system', t.system],
    ['nl', 'Nederlands'],
    ['en', 'English'],
  ]
  const themes: [ThemeSetting, string][] = [
    ['dark', t.dark],
    ['light', t.light],
    ['system', t.system],
  ]

  return (
    <section className="section settings" aria-labelledby="settings-title">
      <h2 className="section-label" id="settings-title">
        {t.settings}
      </h2>

      <fieldset className="field">
        <legend>{t.language}</legend>
        <div className="segmented">
          {languages.map(([value, label]) => (
            <label key={value} className="choice">
              <input
                type="radio"
                name="language"
                value={value}
                checked={settings.language === value}
                onChange={() => actions.setLanguage(value)}
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="field">
        <legend>{t.theme}</legend>
        <div className="segmented">
          {themes.map(([value, label]) => (
            <label key={value} className="choice">
              <input type="radio" name="theme" value={value} checked={settings.theme === value} onChange={() => actions.setTheme(value)} />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <button type="button" className="btn btn-danger-text settings-clear" disabled={!hasHistory} onClick={confirmClearHistory}>
        {t.clearHistory}
      </button>
    </section>
  )
}
