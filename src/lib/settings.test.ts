import { describe, expect, it } from 'vitest'
import { hourlyTotal } from './cost'
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

  it('falls back to defaults for corrupt or unknown data', () => {
    expect(loadSettings(memoryStorage({ [SETTINGS_KEY]: '{not json' }))).toEqual(DEFAULT_SETTINGS)
    expect(loadSettings(stored(999, {}))).toEqual(DEFAULT_SETTINGS)
  })

  it('repairs invalid fields individually', () => {
    const settings = loadSettings(
      stored(2, {
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
    expect(loadSettings(stored(2, { roles: [] })).roles).toEqual(DEFAULT_SETTINGS.roles)
  })

  it('survives a missing storage', () => {
    expect(loadSettings(undefined)).toEqual(DEFAULT_SETTINGS)
    expect(() => saveSettings(DEFAULT_SETTINGS, undefined)).not.toThrow()
  })
})

describe('migration from v1', () => {
  const v1 = {
    theme: 'dark',
    language: 'de',
    defaultPeople: 5,
    defaultHourlyRate: 80,
    billValue: 20,
    presets: [
      { id: 'team', name: 'Teammeeting', people: 8, hourlyRate: 75 },
      { id: 'daily', name: 'Daily', people: 4, hourlyRate: 80 },
      { id: 'big', name: 'Bereichscall', people: 60, hourlyRate: 90 },
    ],
  }

  it('turns each distinct hourly rate into a role and keeps the other settings', () => {
    const settings = loadSettings(stored(1, v1))
    expect(settings.theme).toBe('dark')
    expect(settings.language).toBe('de')
    expect(settings.billValue).toBe(20)
    expect(settings.roles).toEqual([
      { id: 'team', name: 'Team', hourlyRate: 80 },
      { id: 'team-75', name: 'Team (75 €)', hourlyRate: 75 },
      { id: 'team-90', name: 'Team (90 €)', hourlyRate: 90 },
    ])
    expect(settings.defaultAttendance).toEqual({ team: 5 })
  })

  it('keeps every meeting at exactly the same cost', () => {
    const settings = loadSettings(stored(1, v1))
    for (const old of v1.presets) {
      const preset = settings.presets.find((p) => p.id === old.id)!
      expect(hourlyTotal(settings.roles, preset.attendance)).toBe(old.people * old.hourlyRate)
    }
  })
})
