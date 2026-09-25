import type { Locale } from '../i18n/locale'
import type { Attendance, Role } from './settings'

// All money math lives here as pure functions so it can be unit-tested
// without React or timers.

/**
 * The cost state from `startMs` on. When someone joins or leaves mid-meeting a
 * new segment starts with the new total rate, carrying the money already burned in `baseCost`.
 */
export type RateSegment = {
  startMs: number
  baseCost: number
  /** Sum of all attendees' hourly rates. */
  hourlyTotal: number
}

/** Σ count × hourly rate over all roles. */
export function hourlyTotal(roles: Pick<Role, 'id' | 'hourlyRate'>[], attendance: Attendance): number {
  return roles.reduce((sum, role) => sum + (attendance[role.id] ?? 0) * role.hourlyRate, 0)
}

export function headcount(attendance: Attendance): number {
  return Object.values(attendance).reduce((sum, count) => sum + count, 0)
}

export function costPerSecond(hourlyTotal: number): number {
  return hourlyTotal / 3600
}

export function costPerMinute(hourlyTotal: number): number {
  return costPerSecond(hourlyTotal) * 60
}

export function startSegment(hourlyTotal: number): RateSegment {
  return { startMs: 0, baseCost: 0, hourlyTotal }
}

export function costAt(elapsedMs: number, segment: RateSegment): number {
  const segmentSeconds = Math.max(0, elapsedMs - segment.startMs) / 1000
  return segment.baseCost + costPerSecond(segment.hourlyTotal) * segmentSeconds
}

export function changeRate(segment: RateSegment, elapsedMs: number, hourlyTotal: number): RateSegment {
  return { startMs: elapsedMs, baseCost: costAt(elapsedMs, segment), hourlyTotal }
}

const INTL_LOCALES: Record<Locale, string> = {
  de: 'de-DE', // 1.234,50 €
  en: 'en-IE', // €1,234.50 – English formatting for euros
}

export function formatEUR(amount: number, { locale, rounded = false }: { locale: Locale; rounded?: boolean }): string {
  return new Intl.NumberFormat(INTL_LOCALES[locale], {
    style: 'currency',
    currency: 'EUR',
    ...(rounded && { maximumFractionDigits: 0 }),
  }).format(amount)
}

export function formatDuration(elapsedMs: number): string {
  const totalSeconds = Math.floor(elapsedMs / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const mmss = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  return hours > 0 ? `${hours}:${mmss}` : mmss
}

export type ComparisonKey =
  | 'usedCar'
  | 'holiday'
  | 'laptop'
  | 'bike'
  | 'headphones'
  | 'pizza'
  | 'doner'
  | 'coffee'

type Comparison = { key: ComparisonKey; emoji: string; price: number }

// Sorted from most to least expensive; the first one we can afford at least once wins.
// The names live in the i18n dictionaries under `comparisons`.
const COMPARISONS: Comparison[] = [
  { key: 'usedCar', emoji: '🚗', price: 8000 },
  { key: 'holiday', emoji: '🏝️', price: 1500 },
  { key: 'laptop', emoji: '💻', price: 1200 },
  { key: 'bike', emoji: '🚲', price: 600 },
  { key: 'headphones', emoji: '🎧', price: 250 },
  { key: 'pizza', emoji: '🍕', price: 11 },
  { key: 'doner', emoji: '🥙', price: 7.5 },
  { key: 'coffee', emoji: '☕', price: 3.5 },
]

export type ComparisonResult = { key: ComparisonKey; emoji: string; count: number }

export function compareCost(amount: number): ComparisonResult | null {
  const match = COMPARISONS.find((c) => amount >= c.price)
  if (!match) return null
  return { key: match.key, emoji: match.emoji, count: Math.floor(amount / match.price) }
}
