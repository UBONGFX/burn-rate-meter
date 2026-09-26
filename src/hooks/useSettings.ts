import { useEffect, useRef, useState } from 'react'
import {
  DEFAULT_SETTINGS,
  SETTINGS_KEY,
  clearSettings,
  loadSettings,
  saveSettings,
  type Settings,
} from '../lib/settings'

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => loadSettings())
  // Only settings the user actually changed are written. Untouched defaults stay
  // unsaved, so improved defaults in a later version still reach everyone.
  const unchanged = useRef(settings)

  useEffect(() => {
    if (settings !== unchanged.current) saveSettings(settings)
  }, [settings])

  // Another tab saved or reset the settings: take them over without writing them
  // back, so open tabs never overwrite each other.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== SETTINGS_KEY) return
      const next = loadSettings()
      unchanged.current = next
      setSettings(next)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const resetSettings = () => {
    clearSettings()
    unchanged.current = DEFAULT_SETTINGS
    setSettings(DEFAULT_SETTINGS)
  }

  return { settings, setSettings, resetSettings }
}
