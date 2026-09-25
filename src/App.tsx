import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Meter } from './components/Meter'
import { QuickStart, type MeetingConfig } from './components/QuickStart'
import { Settings } from './components/Settings'
import { useSettings } from './hooks/useSettings'
import { I18nContext, useLocaleI18n } from './i18n/useI18n'

type View = 'start' | 'meter' | 'settings'

const pageTransition = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
  transition: { duration: 0.25 },
}

function App() {
  const { settings, setSettings, resetSettings } = useSettings()
  const [view, setView] = useState<View>('start')
  const [meeting, setMeeting] = useState<MeetingConfig | null>(null)
  // Changing the key remounts <Meter>, which restarts the timer from zero.
  const [meetingRun, setMeetingRun] = useState(0)
  const i18n = useLocaleI18n(settings.language)
  const { t, locale } = i18n

  useEffect(() => {
    const root = document.documentElement
    if (settings.theme === 'system') delete root.dataset.theme
    else root.dataset.theme = settings.theme
  }, [settings.theme])

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const startMeeting = (config: MeetingConfig) => {
    setMeeting(config)
    setMeetingRun((n) => n + 1)
    setView('meter')
  }

  return (
    <I18nContext.Provider value={i18n}>
      <div className="app">
        <header className="app-header">
          <button type="button" className="logo" onClick={() => view !== 'meter' && setView('start')}>
            <span className="logo-flame">🔥</span> Burn Rate Meter
          </button>
          {view === 'start' && (
            <button
              type="button"
              className="btn btn-ghost"
              aria-label={t.nav.settings}
              onClick={() => setView('settings')}
            >
              ⚙️<span className="nav-label"> {t.nav.settings}</span>
            </button>
          )}
          {view === 'settings' && (
            <button type="button" className="btn btn-ghost" onClick={() => setView('start')}>
              {t.nav.back}
            </button>
          )}
        </header>

        <main>
          <AnimatePresence mode="wait">
            {view === 'start' && (
              <motion.div key="start" {...pageTransition}>
                <QuickStart settings={settings} onStart={startMeeting} />
              </motion.div>
            )}
            {view === 'meter' && meeting && (
              <motion.div key={`meter-${meetingRun}`} {...pageTransition}>
                <Meter
                  config={meeting}
                  billValue={settings.billValue}
                  onRestart={() => startMeeting(meeting)}
                  onNew={() => setView('start')}
                />
              </motion.div>
            )}
            {view === 'settings' && (
              <motion.div key="settings" {...pageTransition}>
                <Settings settings={settings} onChange={setSettings} onReset={resetSettings} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </I18nContext.Provider>
  )
}

export default App
