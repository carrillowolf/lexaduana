'use client'

import Link from 'next/link'
import { useTranslation } from '@/lib/i18n'
import { incotermsDict } from '@/lib/i18n/incoterms'

export default function IncotermsSEO() {
  const t = useTranslation(incotermsDict)

  return (
    <section className="max-w-4xl mx-auto space-y-10">
      {/* Bloque 1 — Qué son los Incoterms 2020 */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {t('seo.whatAre.title')}
        </h2>
        <div className="prose prose-sm prose-gray max-w-none space-y-4 text-gray-700 leading-relaxed">
          <p dangerouslySetInnerHTML={{ __html: t('seo.whatAre.p1') }} />
          <p>{t('seo.whatAre.p2')}</p>
          <ul className="list-disc list-inside space-y-1">
            <li dangerouslySetInnerHTML={{ __html: t('seo.whatAre.costs') }} />
            <li dangerouslySetInnerHTML={{ __html: t('seo.whatAre.risks') }} />
            <li dangerouslySetInnerHTML={{ __html: t('seo.whatAre.docs') }} />
          </ul>
          <p dangerouslySetInnerHTML={{ __html: t('seo.whatAre.p3') }} />

          <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-2">{t('seo.whatAre.groupsTitle')}</h3>
          <p>{t('seo.whatAre.groupsP')}</p>
          <ul className="list-disc list-inside space-y-1">
            <li dangerouslySetInnerHTML={{ __html: t('seo.whatAre.multimodal') }} />
            <li dangerouslySetInnerHTML={{ __html: t('seo.whatAre.maritime') }} />
          </ul>

          <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-2">{t('seo.whatAre.changesTitle')}</h3>
          <ul className="list-disc list-inside space-y-1">
            <li dangerouslySetInnerHTML={{ __html: t('seo.whatAre.change1') }} />
            <li dangerouslySetInnerHTML={{ __html: t('seo.whatAre.change2') }} />
            <li dangerouslySetInnerHTML={{ __html: t('seo.whatAre.change3') }} />
          </ul>
        </div>
      </div>

      {/* Bloque 2 — Impacto en el valor en aduana */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {t('seo.customsImpact.title')}
        </h2>
        <div className="prose prose-sm prose-gray max-w-none space-y-4 text-gray-700 leading-relaxed">
          <p dangerouslySetInnerHTML={{ __html: t('seo.customsImpact.p1') }} />
          <p dangerouslySetInnerHTML={{ __html: t('seo.customsImpact.p2') }} />

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 not-prose">
            <h4 className="text-sm font-bold text-blue-900 mb-3">{t('seo.customsImpact.adjustmentsTitle')}</h4>
            <div className="space-y-2 text-sm text-blue-800">
              <div className="flex gap-2">
                <span className="font-bold min-w-[80px]">EXW / FOB:</span>
                <span dangerouslySetInnerHTML={{ __html: t('seo.customsImpact.exwFob') }} />
              </div>
              <div className="flex gap-2">
                <span className="font-bold min-w-[80px]">CFR:</span>
                <span dangerouslySetInnerHTML={{ __html: t('seo.customsImpact.cfr') }} />
              </div>
              <div className="flex gap-2">
                <span className="font-bold min-w-[80px]">CIF:</span>
                <span dangerouslySetInnerHTML={{ __html: t('seo.customsImpact.cif') }} />
              </div>
              <div className="flex gap-2">
                <span className="font-bold min-w-[80px]">CIP / DDP:</span>
                <span dangerouslySetInnerHTML={{ __html: t('seo.customsImpact.cipDdp') }} />
              </div>
            </div>
          </div>

          <p>{t('seo.customsImpact.p3')}</p>

          <div className="bg-gradient-to-r from-[#0A3D5C] to-[#0D5A8A] rounded-xl p-5 not-prose">
            <p className="text-white text-sm mb-3">{t('seo.customsImpact.ctaText')}</p>
            <Link
              href="/calculadora"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-[#0A3D5C] font-semibold rounded-lg text-sm hover:bg-blue-50 transition-colors"
            >
              {t('seo.customsImpact.ctaButton')}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
