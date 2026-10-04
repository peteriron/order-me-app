import type { Messages } from '../shared/i18n.ts'

interface AppVersionProps {
  /** Locale for the build date (see formattingLocale). */
  dateLocale: string
  /** A new version is ready (see useUpdate): offer it here too, after "Later" in the pop-up. */
  updateReady: boolean
  onUpdate: () => void
  t: Messages
}

/** The bottom of the Settings page, small and muted: version · build · date, and an Update when one is ready. */
export function AppVersion({ dateLocale, updateReady, onUpdate, t }: AppVersionProps) {
  const date = new Intl.DateTimeFormat(dateLocale, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(__BUILD__.date))
  return (
    <footer className="app-version">
      <p>{t.versionLine(__BUILD__.version, __BUILD__.number, date)}</p>
      {updateReady && (
        <p>
          {t.updateReady} ·{' '}
          <button type="button" className="app-version-update" onClick={onUpdate}>
            {t.update}
          </button>
        </p>
      )}
    </footer>
  )
}
