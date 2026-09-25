import type { Locale } from '../i18n/locale'

// All money math lives here as pure functions so it can be unit-tested
// without React or timers.

/**
 * The cost state from `startMs` on. When the headcount changes mid-meeting a
 * new segment starts, carrying the money already burned in `baseCost`.
 */
export type RateSegment = {
  startMs: number
  baseCost: number
  people: number
  hourlyRate: number
}

export function costPerSecond(people: number, hourlyRate: number): number {
  return (people * hourlyRate) / 3600
}

export function costPerMinute(people: number, hourlyRate: number): number {
  return costPerSecond(people, hourlyRate) * 60
}

export function startSegment(people: number, hourlyRate: number): RateSegment {
  return { startMs: 0, baseCost: 0, people, hourlyRate }
}

export function costAt(elapsedMs: number, segment: RateSegment): number {
  const segmentSeconds = Math.max(0, elapsedMs - segment.startMs) / 1000
  return segment.baseCost + costPerSecond(segment.people, segment.hourlyRate) * segmentSeconds
}

export function changeHeadcount(segment: RateSegment, elapsedMs: number, people: number): RateSegment {
  return { ...segment, startMs: elapsedMs, baseCost: costAt(elapsedMs, segment), people }
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
