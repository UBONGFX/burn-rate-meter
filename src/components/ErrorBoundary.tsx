import { Component, type ErrorInfo, type ReactNode } from 'react'
import { detectLocale } from '../i18n/locale'
import { MESSAGES } from '../i18n/useI18n'
import { clearSettings } from '../lib/settings'
import { Button } from './Button'
import styles from './ErrorBoundary.module.css'

type ErrorBoundaryProps = {
  children: ReactNode
  /** Injectable for tests; reloads the page by default. */
  onReload?: () => void
}

type ErrorBoundaryState = { hasError: boolean }

/**
 * Last line of defense: shows a friendly page instead of a blank screen.
 * It sits outside the app (and its settings), so it uses the browser language,
 * and offers to reset the settings in case stored data causes the crash.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Burn Rate Meter crashed:', error, info.componentStack)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    const t = MESSAGES[detectLocale()].error
    const reload = this.props.onReload ?? (() => window.location.reload())
    return (
      <main className={styles.page} role="alert">
        <div className={styles.card}>
          <p className={styles.emoji} aria-hidden="true">
            🧯
          </p>
          <h1 className={styles.title}>{t.title}</h1>
          <p className={styles.message}>{t.message}</p>
          <div className={styles.actions}>
            <Button variant="primary" onClick={reload}>
              {t.reload}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                clearSettings()
                reload()
              }}
            >
              {t.reset}
            </Button>
          </div>
        </div>
      </main>
    )
  }
}
