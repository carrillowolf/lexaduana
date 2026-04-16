'use client'

import Link from 'next/link'
import { useTranslation } from '@/lib/i18n'
import { calculadoraCbamDict } from '@/lib/i18n/calculadora-cbam'
import CbamBreadcrumb from '@/components/cbam/CbamBreadcrumb'

export default function CbamCalculadoraPlaceholderPage() {
  const t = useTranslation(calculadoraCbamDict)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      <CbamBreadcrumb />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center mb-10">
          <span className="inline-block px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold uppercase tracking-wide mb-6">
            {t('badge')}
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#0A3D5C] mb-4 tracking-tight">
            {t('title')}
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            {t('subtitle')}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 sm:p-10 mb-10">
          <div className="flex items-start gap-4 mb-6">
            <div className="flex-shrink-0 w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-700 leading-relaxed">
              {t('meanwhile')}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
            <Link
              href="/cbam/assessment"
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#0A3D5C] hover:bg-[#0d5078] text-white rounded-xl font-semibold text-sm transition-colors shadow-sm"
            >
              {t('ctaPrimary')}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link
              href="/cbam/asesoria"
              className="inline-flex items-center justify-center px-6 py-3.5 border border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 rounded-xl font-medium text-sm transition-colors"
            >
              {t('ctaSecondary')}
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400">
          {t('footnote')}
        </p>
      </main>
    </div>
  )
}
