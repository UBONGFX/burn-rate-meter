import { describe, expect, it } from 'vitest'
import {
  changeHeadcount,
  compareCost,
  costAt,
  costPerMinute,
  formatDuration,
  formatEUR,
  startSegment,
} from './cost'

describe('cost', () => {
  it('computes cost per minute', () => {
    expect(costPerMinute(6, 80)).toBeCloseTo(8)
  })

  it('accumulates cost over time', () => {
    const segment = startSegment(6, 80)
    expect(costAt(0, segment)).toBe(0)
    expect(costAt(60_000, segment)).toBeCloseTo(8)
    expect(costAt(3_600_000, segment)).toBeCloseTo(480)
  })

  it('keeps burned money when the headcount changes', () => {
    const first = startSegment(6, 80)
    const second = changeHeadcount(first, 60_000, 12)
    expect(costAt(60_000, second)).toBeCloseTo(8)
    // Second minute burns at double speed
    expect(costAt(120_000, second)).toBeCloseTo(8 + 16)
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

  it('picks the most expensive affordable comparison', () => {
    expect(compareCost(2)).toBeNull()
    expect(compareCost(23)).toEqual({ key: 'pizza', emoji: '🍕', count: 2 })
    expect(compareCost(1300)).toEqual({ key: 'laptop', emoji: '💻', count: 1 })
  })
})
