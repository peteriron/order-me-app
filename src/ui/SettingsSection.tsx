import type { LanguageSetting, Settings, ThemeSetting } from '../app/settings.ts'
import type { Messages } from '../i18n/index.ts'

interface SettingsSectionProps {
  settings: Settings
  hasHistory: boolean
  t: Messages
  onLanguage: (language: LanguageSetting) => void
  onTheme: (theme: ThemeSetting) => void
  onClearHistory: () => void
}

/** The few rarely-used options, at the bottom of the Items page (PRD). */
export function SettingsSection({ settings, hasHistory, t, onLanguage, onTheme, onClearHistory }: SettingsSectionProps) {
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
                onChange={() => onLanguage(value)}
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
              <input type="radio" name="theme" value={value} checked={settings.theme === value} onChange={() => onTheme(value)} />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <button type="button" className="btn btn-danger-text settings-clear" disabled={!hasHistory} onClick={onClearHistory}>
        {t.clearHistory}
      </button>
    </section>
  )
}
