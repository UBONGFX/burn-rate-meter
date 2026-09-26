import { useEffect, useRef, useState } from 'react'
import { DEFAULT_SETTINGS, clearSettings, loadSettings, saveSettings, type Settings } from '../lib/settings'

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => loadSettings())
  // Only settings the user actually changed are written. Untouched defaults stay
  // unsaved, so improved defaults in a later version still reach everyone.
  const unchanged = useRef(settings)

  useEffect(() => {
    if (settings !== unchanged.current) saveSettings(settings)
  }, [settings])

  const resetSettings = () => {
    clearSettings()
    unchanged.current = DEFAULT_SETTINGS
    setSettings(DEFAULT_SETTINGS)
  }

  return { settings, setSettings, resetSettings }
}
