'use client'

import Link from 'next/link'
import { useTranslation } from '@/lib/i18n'
import { calculadoraCbamDict } from '@/lib/i18n/calculadora-cbam'

/**
 * CalculatorCtaBlock
 *
 * Bloque CTA que reemplaza al `CBAMCostSimulator` legacy en el hub `/cbam`.
 * Invita al usuario a la calculadora funcional (/cbam/calculadora) y al
 * Advisory Premium como secundario. Lee del mismo dict que la página de la
 * calculadora para evitar duplicación de copy.
 */
export default function CalculatorCtaBlock() {
  const t = useTranslation(calculadoraCbamDict)
  const bullets = Array.isArray(t('hubCta.bullets')) ? t('hubCta.bullets') : []

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-br from-[#0A3D5C] to-[#0d5078] px-8 py-5">
        <p className="text-[10px] uppercase tracking-[3px] font-semibold text-[#F4C542] mb-1">
          {t('hubCta.eyebrow')}
        </p>
        <h2 className="text-xl font-bold text-white mb-0.5">{t('hubCta.title')}</h2>
      </div>
      <div className="p-8">
        <p className="text-gray-600 text-sm leading-relaxed mb-5 max-w-2xl">
          {t('hubCta.desc')}
        </p>
        <ul className="space-y-2 mb-6">
          {bullets.map((b, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
              <svg className="w-4 h-4 text-emerald-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>{b}</span>
            </li>
          ))}
        </ul>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/cbam/calculadora"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#F4C542] hover:bg-[#f0b922] text-[#0A3D5C] font-bold rounded-xl transition-colors shadow-sm"
          >
            {t('hubCta.cta')}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
          <Link
            href="/cbam/asesoria"
            className="inline-flex items-center justify-center px-6 py-3 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl font-medium text-sm transition-colors"
          >
            {t('hubCta.ctaSecondary')}
          </Link>
        </div>
      </div>
    </div>
  )
}
