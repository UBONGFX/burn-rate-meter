import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS, SETTINGS_KEY, loadSettings, saveSettings, type Settings } from './settings'

function memoryStorage(initial: Record<string, string> = {}) {
  const data = { ...initial }
  return {
    data,
    getItem: (key: string) => data[key] ?? null,
    setItem: (key: string, value: string) => {
      data[key] = value
    },
  }
}

describe('settings', () => {
  it('returns defaults when nothing is stored', () => {
    expect(loadSettings(memoryStorage())).toEqual(DEFAULT_SETTINGS)
  })

  it('round-trips saved settings', () => {
    const storage = memoryStorage()
    const custom: Settings = {
      theme: 'light',
      defaultPeople: 3,
      defaultHourlyRate: 120,
      billValue: 50,
      presets: [{ id: 'x', name: 'Daily', people: 5, hourlyRate: 70 }],
    }
    saveSettings(custom, storage)
    expect(loadSettings(storage)).toEqual(custom)
  })

  it('falls back to defaults for corrupt or outdated data', () => {
    expect(loadSettings(memoryStorage({ [SETTINGS_KEY]: '{not json' }))).toEqual(DEFAULT_SETTINGS)
    expect(loadSettings(memoryStorage({ [SETTINGS_KEY]: JSON.stringify({ version: 999, settings: {} }) }))).toEqual(
      DEFAULT_SETTINGS,
    )
  })

  it('repairs invalid fields individually', () => {
    const storage = memoryStorage({
      [SETTINGS_KEY]: JSON.stringify({
        version: 1,
        settings: { theme: 'neon', defaultPeople: -4, defaultHourlyRate: 'abc', billValue: 20, presets: [{ id: 1 }] },
      }),
    })
    expect(loadSettings(storage)).toEqual({
      theme: 'system',
      defaultPeople: 1,
      defaultHourlyRate: DEFAULT_SETTINGS.defaultHourlyRate,
      billValue: 20,
      presets: [],
    })
  })

  it('survives a missing storage', () => {
    expect(loadSettings(undefined)).toEqual(DEFAULT_SETTINGS)
    expect(() => saveSettings(DEFAULT_SETTINGS, undefined)).not.toThrow()
  })
})
