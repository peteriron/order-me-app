import { LANGUAGE_NAMES, LOCALES, type LanguageSetting, type Messages } from '../shared/i18n.ts'
import type { Overlays } from '../shared/ui/overlays.ts'
import type { AppActions } from '../app/useAppState.ts'
import { useInstall } from './install.ts'
import type { Settings, ThemeSetting } from './settings.ts'

export interface GeneralSectionProps {
  settings: Settings
  hasHistory: boolean
  t: Messages
  actions: Pick<AppActions, 'setLanguage' | 'setTheme' | 'setOrderByPopularity' | 'clearHistory' | 'resetApp'>
  overlays: Overlays
  /** Opens the Add to Home Screen guide (iPhone and iPad). */
  onInstallGuide: () => void
}

/** The General section of the Settings page, below the Items: the few rarely-used options (PRD). */
export function GeneralSection({ settings, hasHistory, t, actions, overlays, onInstallGuide }: GeneralSectionProps) {
  const install = useInstall()
  const confirmClearHistory = () =>
    overlays.confirm({ text: t.clearHistoryConfirm, confirmLabel: t.clearHistory, onConfirm: actions.clearHistory })

  const confirmReset = () =>
    overlays.confirm({
      text: t.resetAppConfirm,
      confirmLabel: t.reset,
      onConfirm: async () => {
        // On success the page reloads; only a failed connection check comes back here.
        if ((await actions.resetApp()) === 'offline') overlays.notify(t.resetOffline)
      },
    })

  // Each language is named in itself, so it can be found whatever the app is currently showing.
  const languages: [LanguageSetting, string][] = [['system', t.system], ...LOCALES.map((l): [LanguageSetting, string] => [l, LANGUAGE_NAMES[l]])]
  const themes: [ThemeSetting, string][] = [
    ['dark', t.dark],
    ['light', t.light],
    ['system', t.system],
  ]

  return (
    <section className="section settings" aria-labelledby="settings-title">
      <h2 className="section-label" id="settings-title">
        {t.general}
      </h2>

      <fieldset className="field">
        <legend>{t.language}</legend>
        {/* Seven choices don't fit one row: chips that wrap, like the Item sheet's groups. */}
        <div className="chips">
          {languages.map(([value, label]) => (
            <label key={value} className="choice chip">
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

      {/* A switch: off is Catalog order (the default), on is Popularity. The grid follows at once. */}
      <label className="switch-row">
        <span className="switch-text">
          <span className="switch-label">{t.orderByPopularity}</span>
          <span className="switch-hint">{t.orderByPopularityHint}</span>
        </span>
        <input
          type="checkbox"
          role="switch"
          className="switch"
          checked={settings.orderByPopularity}
          onChange={(e) => actions.setOrderByPopularity(e.target.checked)}
        />
      </label>

      {/* Only where the app can be installed and isn't yet: Chrome's own prompt, or the guide on an iPhone. */}
      {install.mode !== 'none' && (
        <button
          type="button"
          className="btn btn-outline settings-button"
          onClick={install.mode === 'prompt' ? install.prompt : onInstallGuide}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="btn-icon">
            <path d="M8 3h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM12 8v6M9 11h6" />
          </svg>
          {t.addToHome}
        </button>
      )}

      {/* Filled red, the shape of Ordered: both ask for confirmation first. */}
      <div className="settings-danger">
        <button type="button" className="btn btn-danger" disabled={!hasHistory} onClick={confirmClearHistory}>
          {t.clearHistory}
        </button>
        <button type="button" className="btn btn-danger" onClick={confirmReset}>
          {t.resetApp}
        </button>
      </div>
    </section>
  )
}
