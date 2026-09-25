import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { formatEUR } from '../lib/cost'
import de, { type Messages } from './de'
import en from './en'
import { detectLocale, type Language, type Locale } from './locale'

export const MESSAGES: Record<Locale, Messages> = { de, en }

function createI18n(locale: Locale) {
  return {
    locale,
    t: MESSAGES[locale],
    formatEUR: (amount: number, options?: { rounded?: boolean }) => formatEUR(amount, { ...options, locale }),
  }
}

export type I18n = ReturnType<typeof createI18n>

export const I18nContext = createContext<I18n>(createI18n('de'))

export function useI18n(): I18n {
  return useContext(I18nContext)
}

/** Resolves the chosen language to a locale, re-detecting when the browser language changes. */
export function useLocaleI18n(language: Language): I18n {
  const [detected, setDetected] = useState(() => detectLocale())

  useEffect(() => {
    const onChange = () => setDetected(detectLocale())
    window.addEventListener('languagechange', onChange)
    return () => window.removeEventListener('languagechange', onChange)
  }, [])

  const locale = language === 'auto' ? detected : language
  return useMemo(() => createI18n(locale), [locale])
}
