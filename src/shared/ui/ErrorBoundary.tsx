import { Component, type ErrorInfo, type ReactNode } from 'react'
import { APP_KEYS } from '../../app/storage.ts'
import { detectLocale, messages } from '../i18n.ts'

interface Props {
  children: ReactNode
}

/**
 * Catches a render error anywhere below it, so a bug shows a message and a Reload button instead of a blank screen in
 * the middle of a round. The Round is saved on every tap, so reloading loses nothing. It sits above the app's own
 * state, so it speaks the phone's language rather than the chosen one.
 */
export class ErrorBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unexpected error', error, info.componentStack)
  }

  /**
   * Clearing the saved state and reloading: the way out when the crash comes from the saved state itself (a Reload
   * alone would hit the same error again). Only this app's keys are touched; the origin is shared with other Pages.
   */
  private resetApp = () => {
    try {
      for (const key of APP_KEYS) localStorage.removeItem(key)
    } catch {
      // Storage blocked: reload is still the best we can do.
    }
    location.reload()
  }

  render() {
    if (!this.state.failed) return this.props.children
    const t = messages[detectLocale(navigator.language)]
    return (
      <div className="crash" role="alert">
        <h1>{t.crashTitle}</h1>
        <p>{t.crashBody}</p>
        <button type="button" className="btn btn-primary" onClick={() => location.reload()}>
          {t.crashReload}
        </button>
        <button type="button" className="btn btn-quiet" onClick={this.resetApp}>
          {t.crashReset}
        </button>
      </div>
    )
  }
}
