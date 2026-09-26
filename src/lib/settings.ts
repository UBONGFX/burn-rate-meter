import { LANGUAGES, type Language } from '../i18n/locale'

/** A kind of attendee with a rough hourly rate, e.g. "Team" at 80 €/h. */
export type Role = {
  id: string
  name: string
  hourlyRate: number
}

/** How many people of each role attend: role id → count. Missing roles count as 0. */
export type Attendance = Record<string, number>

export type Preset = {
  id: string
  name: string
  attendance: Attendance
}

export const THEMES = ['system', 'light', 'dark'] as const
export type Theme = (typeof THEMES)[number]

export type Settings = {
  theme: Theme
  language: Language
  /** Every time this many euros are burned, a bill falls from the sky. */
  billValue: number
  roles: Role[]
  defaultAttendance: Attendance
  presets: Preset[]
}

// Bump when the Settings shape changes incompatibly; older stored settings are then discarded.
const SETTINGS_VERSION = 3
export const SETTINGS_KEY = 'burn-rate-meter:settings'

export const LIMITS = {
  count: { min: 0, max: 500 },
  hourlyRate: { min: 1, max: 1000 },
  billValue: { min: 1, max: 1000 },
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  language: 'auto',
  billValue: 5,
  // Rates are employer cost per hour, based on average German gross salaries (2026):
  // gross × 1.23 (employer social security) ÷ 1,650 productive hours, rounded to 5 €.
  roles: [
    { id: 'dev', name: 'Developer', hourlyRate: 50 }, // ~65,000 €/year
    { id: 'po', name: 'Product Owner', hourlyRate: 55 }, // ~73,600 €/year
    { id: 'sm', name: 'Scrum Master', hourlyRate: 50 }, // ~69,900 €/year
    { id: 'architect', name: 'Architect', hourlyRate: 60 }, // ~77,300 €/year
    { id: 'lead', name: 'Team Lead', hourlyRate: 55 }, // ~76,900 €/year
    { id: 'management', name: 'Management', hourlyRate: 70 }, // ~93,700 €/year (Bereichsleitung)
  ],
  defaultAttendance: { dev: 6 },
  presets: [
    { id: 'team', name: 'Teammeeting', attendance: { dev: 6, po: 1, sm: 1 } },
    {
      id: 'art',
      name: 'ART-Meeting',
      attendance: { dev: 30, po: 5, sm: 5, architect: 2, lead: 3, management: 1 },
    },
    {
      id: 'bereich',
      name: 'Bereichscall',
      attendance: { dev: 40, po: 6, sm: 6, architect: 3, lead: 6, management: 3 },
    },
  ],
}

export function countOf(attendance: Attendance, roleId: string): number {
  return attendance[roleId] ?? 0
}

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>

function defaultStorage(): Storage | undefined {
  try {
    return globalThis.localStorage
  } catch {
    return undefined
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function clampNumber(value: unknown, { min, max }: { min: number; max: number }, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  return Math.min(max, Math.max(min, value))
}

function sanitizeRoles(value: unknown): Role[] {
  if (!Array.isArray(value)) return DEFAULT_SETTINGS.roles
  const roles: Role[] = []
  for (const r of value) {
    if (!isRecord(r) || typeof r.id !== 'string' || typeof r.name !== 'string') continue
    if (roles.some((existing) => existing.id === r.id)) continue
    roles.push({ id: r.id, name: r.name, hourlyRate: clampNumber(r.hourlyRate, LIMITS.hourlyRate, 80) })
  }
  // There is always at least one role, otherwise nobody could attend a meeting.
  return roles.length > 0 ? roles : DEFAULT_SETTINGS.roles
}

/** Keeps only counts for existing roles, clamped to whole numbers within the limits. */
function sanitizeAttendance(value: unknown, roles: Role[]): Attendance {
  if (!isRecord(value)) return {}
  const attendance: Attendance = {}
  for (const role of roles) {
    const count = clampNumber(value[role.id], LIMITS.count, 0)
    if (count > 0) attendance[role.id] = Math.round(count)
  }
  return attendance
}

function sanitizePreset(value: unknown, roles: Role[]): Preset | null {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.name !== 'string') return null
  return { id: value.id, name: value.name, attendance: sanitizeAttendance(value.attendance, roles) }
}

/** Turns anything read from storage into valid Settings, falling back to defaults field by field. */
export function sanitizeSettings(value: unknown): Settings {
  if (!isRecord(value)) return DEFAULT_SETTINGS
  const roles = sanitizeRoles(value.roles)
  return {
    theme: THEMES.includes(value.theme as Theme) ? (value.theme as Theme) : DEFAULT_SETTINGS.theme,
    language: LANGUAGES.includes(value.language as Language)
      ? (value.language as Language)
      : DEFAULT_SETTINGS.language,
    billValue: clampNumber(value.billValue, LIMITS.billValue, DEFAULT_SETTINGS.billValue),
    roles,
    defaultAttendance: sanitizeAttendance(value.defaultAttendance ?? DEFAULT_SETTINGS.defaultAttendance, roles),
    presets: Array.isArray(value.presets)
      ? value.presets.map((p) => sanitizePreset(p, roles)).filter((p): p is Preset => p !== null)
      : DEFAULT_SETTINGS.presets,
  }
}

export function loadSettings(storage: StorageLike | undefined = defaultStorage()): Settings {
  try {
    const raw = storage?.getItem(SETTINGS_KEY)
    if (!raw) return DEFAULT_SETTINGS
    const parsed = JSON.parse(raw)
    // No migrations: settings from an older version are simply replaced by the defaults.
    if (parsed?.version !== SETTINGS_VERSION) return DEFAULT_SETTINGS
    return sanitizeSettings(parsed.settings)
  } catch {
    return DEFAULT_SETTINGS
  }
}

/** Forgets the stored settings, so the current defaults apply (including better ones in future versions). */
export function clearSettings(storage: Pick<Storage, 'removeItem'> | undefined = defaultStorage()): void {
  try {
    storage?.removeItem(SETTINGS_KEY)
  } catch {
    // Blocked storage – nothing was persisted anyway.
  }
}

export function saveSettings(settings: Settings, storage: StorageLike | undefined = defaultStorage()): void {
  try {
    storage?.setItem(SETTINGS_KEY, JSON.stringify({ version: SETTINGS_VERSION, settings }))
  } catch {
    // Storage full or blocked (private mode) – settings just won't persist.
  }
}
