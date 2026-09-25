import { LANGUAGES, type Language } from '../i18n/locale'

export type Preset = {
  id: string
  name: string
  people: number
  hourlyRate: number
}

export const THEMES = ['system', 'light', 'dark'] as const
export type Theme = (typeof THEMES)[number]

export type Settings = {
  theme: Theme
  language: Language
  defaultPeople: number
  defaultHourlyRate: number
  /** Every time this many euros are burned, a bill falls from the sky. */
  billValue: number
  presets: Preset[]
}

// Bump when the Settings shape changes in an incompatible way.
const SETTINGS_VERSION = 1
export const SETTINGS_KEY = 'burn-rate-meter:settings'

export const LIMITS = {
  people: { min: 1, max: 500 },
  hourlyRate: { min: 1, max: 1000 },
  billValue: { min: 1, max: 1000 },
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  language: 'auto',
  defaultPeople: 6,
  defaultHourlyRate: 80,
  billValue: 10,
  presets: [
    { id: 'team', name: 'Teammeeting', people: 8, hourlyRate: 75 },
    { id: 'art', name: 'ART-Meeting', people: 40, hourlyRate: 85 },
    { id: 'bereich', name: 'Bereichscall', people: 60, hourlyRate: 90 },
  ],
}

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>

function defaultStorage(): StorageLike | undefined {
  try {
    return globalThis.localStorage
  } catch {
    return undefined
  }
}

function clampNumber(value: unknown, { min, max }: { min: number; max: number }, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  return Math.min(max, Math.max(min, value))
}

function sanitizePreset(value: unknown): Preset | null {
  if (typeof value !== 'object' || value === null) return null
  const p = value as Record<string, unknown>
  if (typeof p.id !== 'string' || typeof p.name !== 'string') return null
  return {
    id: p.id,
    name: p.name,
    people: clampNumber(p.people, LIMITS.people, DEFAULT_SETTINGS.defaultPeople),
    hourlyRate: clampNumber(p.hourlyRate, LIMITS.hourlyRate, DEFAULT_SETTINGS.defaultHourlyRate),
  }
}

/** Turns anything read from storage into valid Settings, falling back to defaults field by field. */
export function sanitizeSettings(value: unknown): Settings {
  if (typeof value !== 'object' || value === null) return DEFAULT_SETTINGS
  const s = value as Record<string, unknown>
  return {
    theme: THEMES.includes(s.theme as Theme) ? (s.theme as Theme) : DEFAULT_SETTINGS.theme,
    language: LANGUAGES.includes(s.language as Language) ? (s.language as Language) : DEFAULT_SETTINGS.language,
    defaultPeople: clampNumber(s.defaultPeople, LIMITS.people, DEFAULT_SETTINGS.defaultPeople),
    defaultHourlyRate: clampNumber(s.defaultHourlyRate, LIMITS.hourlyRate, DEFAULT_SETTINGS.defaultHourlyRate),
    billValue: clampNumber(s.billValue, LIMITS.billValue, DEFAULT_SETTINGS.billValue),
    presets: Array.isArray(s.presets)
      ? s.presets.map(sanitizePreset).filter((p): p is Preset => p !== null)
      : DEFAULT_SETTINGS.presets,
  }
}

export function loadSettings(storage: StorageLike | undefined = defaultStorage()): Settings {
  try {
    const raw = storage?.getItem(SETTINGS_KEY)
    if (!raw) return DEFAULT_SETTINGS
    const parsed = JSON.parse(raw)
    if (parsed?.version !== SETTINGS_VERSION) return DEFAULT_SETTINGS
    return sanitizeSettings(parsed.settings)
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(settings: Settings, storage: StorageLike | undefined = defaultStorage()): void {
  try {
    storage?.setItem(SETTINGS_KEY, JSON.stringify({ version: SETTINGS_VERSION, settings }))
  } catch {
    // Storage full or blocked (private mode) – settings just won't persist.
  }
}
