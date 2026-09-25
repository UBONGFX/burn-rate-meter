import { describe, expect, it } from 'vitest'
import de from './de'
import en from './en'
import { detectLocale } from './locale'

describe('detectLocale', () => {
  it('matches German and English regional variants', () => {
    expect(detectLocale(['de-AT', 'en-US'])).toBe('de')
    expect(detectLocale(['en-GB'])).toBe('en')
    expect(detectLocale(['DE'])).toBe('de')
  })

  it('uses the first supported language in the preference list', () => {
    expect(detectLocale(['fr-FR', 'en-US', 'de-DE'])).toBe('en')
  })

  it('falls back to English', () => {
    expect(detectLocale(['fr'])).toBe('en')
    expect(detectLocale([])).toBe('en')
  })
})

// Lists every key path (e.g. "meter.status.paused") so missing translations fail loudly.
function keyPaths(value: object, prefix = ''): string[] {
  return Object.entries(value).flatMap(([key, child]) =>
    child !== null && typeof child === 'object' && !Array.isArray(child)
      ? keyPaths(child, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  )
}

describe('dictionaries', () => {
  it('have the same keys in German and English', () => {
    expect(keyPaths(en).sort()).toEqual(keyPaths(de).sort())
  })
})
