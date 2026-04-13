'use client'

import { useLocale } from '@/lib/i18n'
import { CHAPTER_NAMES_I18N } from '@/lib/i18n/cambios'

const MEASURE_TYPES = {
  es: {
    '103': 'Arancel terceros países', '142': 'Preferencia arancelaria',
    '143': 'Contingente arancelario', '551': 'Derecho anti-dumping provisional',
    '552': 'Derecho anti-dumping definitivo', '553': 'Derecho compensatorio provisional',
    '554': 'Derecho compensatorio definitivo', '695': 'Medida de salvaguardia',
    '696': 'Vigilancia previa', '714': 'Prohibición importación',
    '750': 'Arancel adicional', '490': 'Precio de entrada',
  },
  en: {
    '103': 'Third-country duty', '142': 'Tariff preference',
    '143': 'Tariff quota', '551': 'Provisional anti-dumping duty',
    '552': 'Definitive anti-dumping duty', '553': 'Provisional countervailing duty',
    '554': 'Definitive countervailing duty', '695': 'Safeguard measure',
    '696': 'Prior surveillance', '714': 'Import prohibition',
    '750': 'Additional duty', '490': 'Entry price',
  },
}

const ORIGINS = {
  es: {
    'CA': '🇨🇦 Canadá', 'CN': '🇨🇳 China', 'JP': '🇯🇵 Japón',
    'US': '🇺🇸 EE.UU.', 'RU': '🇷🇺 Rusia', 'IN': '🇮🇳 India',
    'KR': '🇰🇷 Corea del Sur', 'TR': '🇹🇷 Turquía', 'BR': '🇧🇷 Brasil',
    'TW': '🇹🇼 Taiwán', 'ID': '🇮🇩 Indonesia', 'MY': '🇲🇾 Malasia',
    'TH': '🇹🇭 Tailandia', 'VN': '🇻🇳 Vietnam', 'AR': '🇦🇷 Argentina',
    'EG': '🇪🇬 Egipto', 'UA': '🇺🇦 Ucrania', 'NZ': '🇳🇿 Nueva Zelanda',
    'MA': '🇲🇦 Marruecos', 'ZA': '🇿🇦 Sudáfrica', 'PK': '🇵🇰 Pakistán',
    'BD': '🇧🇩 Bangladés', 'MX': '🇲🇽 México', 'CL': '🇨🇱 Chile',
    'PE': '🇵🇪 Perú', 'CO': '🇨🇴 Colombia', 'BY': '🇧🇾 Bielorrusia',
    '1008': '🌍 Todos los países', '1011': '🌍 Erga omnes',
    '2005': '🌍 No-UE', '2020': '🌍 Países en desarrollo',
  },
  en: {
    'CA': '🇨🇦 Canada', 'CN': '🇨🇳 China', 'JP': '🇯🇵 Japan',
    'US': '🇺🇸 USA', 'RU': '🇷🇺 Russia', 'IN': '🇮🇳 India',
    'KR': '🇰🇷 South Korea', 'TR': '🇹🇷 Turkey', 'BR': '🇧🇷 Brazil',
    'TW': '🇹🇼 Taiwan', 'ID': '🇮🇩 Indonesia', 'MY': '🇲🇾 Malaysia',
    'TH': '🇹🇭 Thailand', 'VN': '🇻🇳 Vietnam', 'AR': '🇦🇷 Argentina',
    'EG': '🇪🇬 Egypt', 'UA': '🇺🇦 Ukraine', 'NZ': '🇳🇿 New Zealand',
    'MA': '🇲🇦 Morocco', 'ZA': '🇿🇦 South Africa', 'PK': '🇵🇰 Pakistan',
    'BD': '🇧🇩 Bangladesh', 'MX': '🇲🇽 Mexico', 'CL': '🇨🇱 Chile',
    'PE': '🇵🇪 Peru', 'CO': '🇨🇴 Colombia', 'BY': '🇧🇾 Belarus',
    '1008': '🌍 All countries', '1011': '🌍 Erga omnes',
    '2005': '🌍 Non-EU', '2020': '🌍 Developing countries',
  },
}

function formatDuty(value, unit) {
  if (value == null) return '—'
  if (unit === '%') return `${value.toFixed(1)}%`
  if (unit?.includes('EUR')) return `${value.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 1 })} ${unit}`
  return `${value} ${unit || ''}`
}

function DirectionArrow({ direction, delta, unit, newLabel = 'NUEVO', typeChangedLabel = 'Cambio tipo' }) {
  if (direction === 'new') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m0-16l-4 4m4-4l4 4" />
        </svg>
        {newLabel}
      </span>
    )
  }
  if (direction === 'up') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
        </svg>
        +{formatDuty(Math.abs(delta), unit)}
      </span>
    )
  }
  if (direction === 'down') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
        -{formatDuty(Math.abs(delta), unit)}
      </span>
    )
  }
  return <span className="text-xs text-gray-500">{typeChangedLabel}</span>
}

export default function TopChanges({ changes, t }) {
  const { locale } = useLocale()
  const chapterNames = CHAPTER_NAMES_I18N[locale] || CHAPTER_NAMES_I18N.es

  if (!changes || changes.length === 0) return null

  return (
    <div>
      <div className="flex items-center gap-2 mb-3 px-1">
        <svg className="w-5 h-5 text-[#B8860B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
        <h3 className="text-base font-bold text-gray-800">{t('top.title')}</h3>
        <span className="text-xs text-gray-400">{t('top.subtitle')}</span>
      </div>

      <div className="rounded-xl border border-gray-200 shadow-sm overflow-hidden divide-y divide-gray-100">
        {changes.map((ch, i) => {
          const chapter = ch.goods_code?.substring(0, 2)
          const chapterName = chapterNames[chapter] || ''
          const measureTypes = MEASURE_TYPES[locale] || MEASURE_TYPES.es
          const origins = ORIGINS[locale] || ORIGINS.es
          const measureLabel = measureTypes[ch.measure_type_code] || `${locale === 'en' ? 'Measure' : 'Medida'} ${ch.measure_type_code}`
          const originLabel = origins[ch.origin_code] || ch.origin_code

          return (
            <div key={`${ch.goods_code}-${ch.measure_type_code}-${i}`} className={`px-4 py-3 hover:bg-blue-50/40 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-gray-400 text-xs font-bold w-5">{i + 1}.</span>
                    <span className="font-mono text-[#0A3D5C] text-sm font-bold">{ch.goods_code}</span>
                    {originLabel && (
                      <span className="text-xs text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
                        {originLabel}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 ml-7">
                    {measureLabel}
                    {chapterName && <span className="ml-2 text-gray-400">· Cap. {chapter} {chapterName}</span>}
                  </div>
                </div>

                <div className="flex-shrink-0 text-right">
                  <DirectionArrow direction={ch.direction} delta={ch.delta} unit={ch.unit} newLabel={t('top.new')} typeChangedLabel={t('top.typeChanged')} />
                  <div className="text-xs text-gray-500 mt-1 space-x-1">
                    {ch.direction !== 'new' && (
                      <>
                        <span className="text-red-400 line-through">{formatDuty(ch.old_duty, ch.old_unit || ch.unit)}</span>
                        <span>→</span>
                      </>
                    )}
                    <span className="text-gray-800 font-semibold">{formatDuty(ch.new_duty, ch.unit)}</span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
