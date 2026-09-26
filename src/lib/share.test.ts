import { describe, expect, it } from 'vitest'
import de from '../i18n/de'
import en from '../i18n/en'
import { formatEUR } from './cost'
import { shareText } from './share'

const url = 'https://ubongfx.github.io/burn-rate-meter/'
const eur = (locale: 'de' | 'en') => (amount: number) => formatEUR(amount, { locale })

describe('shareText', () => {
  it('describes a meeting in German', () => {
    const text = shareText(de, eur('de'), { name: 'Teammeeting', cost: 135.08, elapsedMs: 20 * 60_000, people: 8 }, url)
    expect(text).toBe(
      [
        '🔥 Teammeeting hat 135,08 € gekostet.',
        '⏱ 20:00 · 👥 8 Personen',
        '🍕 Das sind 12 Pizzen!',
        '',
        `Gemessen mit Burn Rate Meter: ${url}`,
      ].join('\n'),
    )
  })

  it('describes a meeting in English, without a preset name', () => {
    const text = shareText(en, eur('en'), { name: null, cost: 1300, elapsedMs: 3_725_000, people: 1 }, url)
    expect(text.split('\n').slice(0, 3)).toEqual([
      '🔥 This meeting cost €1,300.00.',
      '⏱ 1:02:05 · 👥 1 person',
      '👟 That\'s 10 pairs of sneakers!',
    ])
  })

  it('praises meetings cheaper than a coffee', () => {
    const text = shareText(de, eur('de'), { name: null, cost: 2, elapsedMs: 30_000, people: 2 }, url)
    expect(text.split('\n')[2]).toBe('☕ Nicht mal ein Kaffee. Gut gemacht!')
  })
})
