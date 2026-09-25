import { useEffect, useState } from 'react'
import { DEFAULT_SETTINGS, loadSettings, saveSettings, type Settings } from '../lib/settings'

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => loadSettings())

  useEffect(() => {
    saveSettings(settings)
  }, [settings])

  const resetSettings = () => setSettings(DEFAULT_SETTINGS)

  return { settings, setSettings, resetSettings }
}
