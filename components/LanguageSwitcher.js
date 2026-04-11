'use client'

import { useLocale } from '@/lib/i18n'

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLocale()

  return (
    <div className="flex items-center bg-gray-100 rounded-lg p-0.5 text-xs font-medium">
      <button
        onClick={() => setLocale('es')}
        className={`px-2 py-1 rounded-md transition-all ${
          locale === 'es'
            ? 'bg-white text-[#0A3D5C] shadow-sm font-bold'
            : 'text-gray-500 hover:text-gray-700'
        }`}
        aria-label="Español"
      >
        ES
      </button>
      <button
        onClick={() => setLocale('en')}
        className={`px-2 py-1 rounded-md transition-all ${
          locale === 'en'
            ? 'bg-white text-[#0A3D5C] shadow-sm font-bold'
            : 'text-gray-500 hover:text-gray-700'
        }`}
        aria-label="English"
      >
        EN
      </button>
    </div>
  )
}
