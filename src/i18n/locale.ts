export const LANGUAGES = ['auto', 'de', 'en'] as const
/** What the user picked in the settings; 'auto' follows the browser/OS language. */
export type Language = (typeof LANGUAGES)[number]
/** The language the UI is actually rendered in. */
export type Locale = Exclude<Language, 'auto'>

const FALLBACK_LOCALE: Locale = 'en'

function browserLanguages(): readonly string[] {
  return typeof navigator === 'undefined' ? [] : navigator.languages
}

/** Picks the first supported language from the browser's preference list (which mirrors the OS setting). */
export function detectLocale(languages: readonly string[] = browserLanguages()): Locale {
  for (const tag of languages) {
    const base = tag.toLowerCase().split('-')[0]
    if (base === 'de' || base === 'en') return base
  }
  return FALLBACK_LOCALE
}
