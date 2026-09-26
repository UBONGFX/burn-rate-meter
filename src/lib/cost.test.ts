import { describe, expect, it } from 'vitest'
import {
  changeRate,
  compareCost,
  costAt,
  costPerMinute,
  formatDuration,
  formatEUR,
  headcount,
  hourlyTotal,
  startSegment,
} from './cost'

const roles = [
  { id: 'team', hourlyRate: 80 },
  { id: 'lead', hourlyRate: 100 },
]

describe('cost', () => {
  it('sums the hourly rates of all attendees', () => {
    expect(hourlyTotal(roles, { team: 6 })).toBe(480)
    expect(hourlyTotal(roles, { team: 7, lead: 1 })).toBe(660)
    expect(hourlyTotal(roles, {})).toBe(0)
    // Counts for unknown roles are ignored
    expect(hourlyTotal(roles, { team: 1, ghost: 5 })).toBe(80)
  })

  it('counts heads across roles', () => {
    expect(headcount({ team: 7, lead: 1 })).toBe(8)
    expect(headcount({})).toBe(0)
  })

  it('computes cost per minute', () => {
    expect(costPerMinute(480)).toBeCloseTo(8)
  })

  it('accumulates cost over time', () => {
    const segment = startSegment(480)
    expect(costAt(0, segment)).toBe(0)
    expect(costAt(60_000, segment)).toBeCloseTo(8)
    expect(costAt(3_600_000, segment)).toBeCloseTo(480)
  })

  it('keeps burned money when the rate changes', () => {
    const first = startSegment(480)
    // A lead joins after one minute
    const second = changeRate(first, 60_000, hourlyTotal(roles, { team: 6, lead: 1 }))
    expect(costAt(60_000, second)).toBeCloseTo(8)
    expect(costAt(120_000, second)).toBeCloseTo(8 + 580 / 60)
  })

  it('formats euros per locale', () => {
    expect(formatEUR(1234.5, { locale: 'de' })).toBe('1.234,50\u00a0€')
    expect(formatEUR(1234.5, { locale: 'de', rounded: true })).toBe('1.235\u00a0€')
    expect(formatEUR(1234.5, { locale: 'en' })).toBe('€1,234.50')
    expect(formatEUR(1234.5, { locale: 'en', rounded: true })).toBe('€1,235')
  })

  it('formats durations', () => {
    expect(formatDuration(0)).toBe('00:00')
    expect(formatDuration(65_000)).toBe('01:05')
    expect(formatDuration(3_725_000)).toBe('1:02:05')
  })

  it('picks the cheapest thing that fits at most 12 times', () => {
    expect(compareCost(2)).toBeNull()
    expect(compareCost(3.5)).toEqual({ key: 'coffee', emoji: '☕', count: 1, price: 3.5 })
    expect(compareCost(30)).toEqual({ key: 'coffee', emoji: '☕', count: 8, price: 3.5 })
    expect(compareCost(135)).toEqual({ key: 'pizza', emoji: '🍕', count: 12, price: 11 })
    expect(compareCost(500)).toEqual({ key: 'concert', emoji: '🎟️', count: 6, price: 75 })
    expect(compareCost(1300)).toEqual({ key: 'sneakers', emoji: '👟', count: 10, price: 130 })
  })

  it('falls back to the most expensive thing for huge amounts', () => {
    expect(compareCost(200_000)).toEqual({ key: 'usedCar', emoji: '🚗', count: 25, price: 8000 })
  })
})
