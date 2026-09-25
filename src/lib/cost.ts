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

const eurFormat = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })
const eurFormatRounded = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

export function formatEUR(amount: number, { rounded = false } = {}): string {
  return (rounded ? eurFormatRounded : eurFormat).format(amount)
}

export function formatDuration(elapsedMs: number): string {
  const totalSeconds = Math.floor(elapsedMs / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const mmss = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  return hours > 0 ? `${hours}:${mmss}` : mmss
}

type Comparison = { emoji: string; singular: string; plural: string; price: number }

// Sorted from most to least expensive; the first one we can afford at least once wins.
const COMPARISONS: Comparison[] = [
  { emoji: '🚗', singular: 'Gebrauchtwagen', plural: 'Gebrauchtwagen', price: 8000 },
  { emoji: '🏝️', singular: 'Pauschalurlaub', plural: 'Pauschalurlaube', price: 1500 },
  { emoji: '💻', singular: 'Laptop', plural: 'Laptops', price: 1200 },
  { emoji: '🚲', singular: 'Fahrrad', plural: 'Fahrräder', price: 600 },
  { emoji: '🎧', singular: 'Kopfhörer', plural: 'Kopfhörer', price: 250 },
  { emoji: '🍕', singular: 'Pizza', plural: 'Pizzen', price: 11 },
  { emoji: '🥙', singular: 'Döner', plural: 'Döner', price: 7.5 },
  { emoji: '☕', singular: 'Kaffee', plural: 'Kaffees', price: 3.5 },
]

export type ComparisonResult = { emoji: string; count: number; label: string }

export function compareCost(amount: number): ComparisonResult | null {
  const match = COMPARISONS.find((c) => amount >= c.price)
  if (!match) return null
  const count = Math.floor(amount / match.price)
  return { emoji: match.emoji, count, label: count === 1 ? match.singular : match.plural }
}
