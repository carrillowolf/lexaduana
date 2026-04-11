'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'

// ── Supported locales ──────────────────────────────────────
export const LOCALES = ['es', 'en']
export const DEFAULT_LOCALE = 'es'

// ── Context ────────────────────────────────────────────────
const LocaleContext = createContext(null)

export function LocaleProvider({ children }) {
  const [locale, setLocaleState] = useState(DEFAULT_LOCALE)

  // Hydrate from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('lexaduana-locale')
    if (saved && LOCALES.includes(saved)) {
      setLocaleState(saved)
    }
  }, [])

  const setLocale = useCallback((newLocale) => {
    if (LOCALES.includes(newLocale)) {
      setLocaleState(newLocale)
      localStorage.setItem('lexaduana-locale', newLocale)
      document.documentElement.lang = newLocale
    }
  }, [])

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  const ctx = useContext(LocaleContext)
  if (!ctx) return { locale: DEFAULT_LOCALE, setLocale: () => {} }
  return ctx
}

// ── Translation hook ───────────────────────────────────────
// Usage: const t = useTranslation(dictionaries)
// where dictionaries = { es: { key: 'value' }, en: { key: 'value' } }
// then: t('key') or t('nested.key')

function getNestedValue(obj, path) {
  return path.split('.').reduce((acc, key) => acc?.[key], obj)
}

export function useTranslation(dictionaries) {
  const { locale } = useLocale()
  const dict = dictionaries[locale] || dictionaries[DEFAULT_LOCALE] || {}

  const t = useCallback(
    (key, fallback) => {
      const value = getNestedValue(dict, key)
      if (value !== undefined) return value
      // Fallback to Spanish
      const esFallback = getNestedValue(dictionaries[DEFAULT_LOCALE] || {}, key)
      return esFallback ?? fallback ?? key
    },
    [dict, dictionaries]
  )

  return t
}

// ── Helper for bilingual data objects ──────────────────────
// Usage: const data = useLocalizedData({ es: spanishData, en: englishData })
export function useLocalizedData(dataByLocale) {
  const { locale } = useLocale()
  return dataByLocale[locale] || dataByLocale[DEFAULT_LOCALE]
}
