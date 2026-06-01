'use client'

import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'
import { origenDict } from '@/lib/i18n/origen'
import CountrySelect from './CountrySelect'

const QUICK_ACCESS = [
  { slug: 'mexico', labelEs: 'México', labelEn: 'Mexico' },
  { slug: 'reino-unido', labelEs: 'Reino Unido', labelEn: 'United Kingdom' },
  { slug: 'turquia', labelEs: 'Turquía', labelEn: 'Turkey' },
  { slug: 'japon', labelEs: 'Japón', labelEn: 'Japan' },
  { slug: 'india', labelEs: 'India', labelEn: 'India' },
  { slug: 'marruecos', labelEs: 'Marruecos', labelEn: 'Morocco' },
]

export default function OrigenIndex({ countries, countryCount }) {
  const t = useTranslation(origenDict)

  const chips = [
    t('origen.index.chip_countries').replace('{n}', countryCount),
    t('origen.index.chip_agreements'),
    t('origen.index.chip_types'),
  ]

  return (
    <div className="max-w-3xl mx-auto px-5 pt-7 pb-12">
      {/* Cabecera */}
      <p className="text-sm font-semibold text-slate-500 tracking-wide mb-2">
        {t('origen.index.eyebrow')}
      </p>
      <h1 className="text-2xl font-bold text-[#0A3D5C] mb-2">
        {t('origen.index.heading')}
      </h1>
      <p className="text-[15px] text-slate-600 mb-5">
        {t('origen.index.lead')}
      </p>

      {/* Chips de cobertura */}
      <div className="flex flex-wrap gap-2 mb-7">
        {chips.map((label, i) => (
          <span
            key={i}
            className="inline-block px-3 py-1 text-[13px] font-medium rounded-full bg-slate-100 text-slate-600 border border-slate-200"
          >
            {label}
          </span>
        ))}
      </div>

      {/* Selector enmarcado */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 mb-7">
        <p className="text-sm font-semibold text-[#0A3D5C] mb-1">
          {t('origen.index.selector_title')}
        </p>
        <p className="text-[13px] text-slate-500 mb-3">
          {t('origen.index.selector_help')}
        </p>
        <CountrySelect countries={countries} />
      </div>

      {/* Accesos rápidos */}
      <div className="mb-7">
        <p className="text-sm font-semibold text-slate-500 mb-2.5">
          {t('origen.index.frecuentes')}
        </p>
        <div className="flex flex-wrap gap-2">
          {QUICK_ACCESS.map((c) => (
            <Link
              key={c.slug}
              href={`/origen/${c.slug}`}
              className="inline-block px-3.5 py-1.5 text-sm font-medium rounded-full border border-[#0A3D5C]/20 text-[#0A3D5C] hover:bg-[#0A3D5C]/5 transition-colors"
            >
              {c.labelEs}
            </Link>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 border-l-4 border-amber-400 rounded-r-lg px-4 py-3.5">
        <p className="text-[13.5px] font-semibold text-amber-900 flex items-center gap-[7px] mb-1.5">
          <AlertTriangle className="w-4 h-4 flex-none" />
          {t('origen.disclaimer_titulo')}
        </p>
        <p className="text-[13px] text-amber-900 m-0">
          {t('origen.index.disclaimer')}
        </p>
      </div>
    </div>
  )
}
