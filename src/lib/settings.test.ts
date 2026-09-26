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

function stored(version: number, settings: unknown) {
  return memoryStorage({ [SETTINGS_KEY]: JSON.stringify({ version, settings }) })
}

describe('settings', () => {
  it('returns defaults when nothing is stored', () => {
    expect(loadSettings(memoryStorage())).toEqual(DEFAULT_SETTINGS)
  })

  it('round-trips saved settings', () => {
    const storage = memoryStorage()
    const custom: Settings = {
      theme: 'light',
      language: 'en',
      billValue: 50,
      roles: [
        { id: 'dev', name: 'Dev', hourlyRate: 90 },
        { id: 'po', name: 'PO', hourlyRate: 110 },
      ],
      defaultAttendance: { dev: 3 },
      presets: [{ id: 'x', name: 'Daily', attendance: { dev: 5, po: 1 } }],
    }
    saveSettings(custom, storage)
    expect(loadSettings(storage)).toEqual(custom)
  })

  it('falls back to defaults for corrupt data or another version', () => {
    expect(loadSettings(memoryStorage({ [SETTINGS_KEY]: '{not json' }))).toEqual(DEFAULT_SETTINGS)
    expect(loadSettings(stored(2, { theme: 'dark' }))).toEqual(DEFAULT_SETTINGS)
  })

  it('repairs invalid fields individually', () => {
    const settings = loadSettings(
      stored(3, {
        theme: 'neon',
        language: 'fr',
        billValue: 20,
        roles: [{ id: 'dev', name: 'Dev', hourlyRate: -5 }, { id: 'dev', name: 'Duplicate', hourlyRate: 1 }, { id: 3 }],
        defaultAttendance: { dev: 2.6, ghost: 4 },
        presets: [{ id: 'p', name: 'P', attendance: { dev: 9999, ghost: 1 } }, { id: 1 }],
      }),
    )
    expect(settings).toEqual({
      theme: 'system',
      language: 'auto',
      billValue: 20,
      roles: [{ id: 'dev', name: 'Dev', hourlyRate: 1 }],
      defaultAttendance: { dev: 3 },
      presets: [{ id: 'p', name: 'P', attendance: { dev: 500 } }],
    })
  })

  it('always keeps at least one role', () => {
    expect(loadSettings(stored(3, { roles: [] })).roles).toEqual(DEFAULT_SETTINGS.roles)
  })

  it('survives a missing storage', () => {
    expect(loadSettings(undefined)).toEqual(DEFAULT_SETTINGS)
    expect(() => saveSettings(DEFAULT_SETTINGS, undefined)).not.toThrow()
  })
})
