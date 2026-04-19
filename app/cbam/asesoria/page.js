'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslation } from '@/lib/i18n'
import { cbamDict } from '@/lib/i18n/cbam'
import CbamBreadcrumb from '@/components/cbam/CbamBreadcrumb'

function ProductCard({ variant, t, namespace, href, ctaKey, highlighted }) {
  const bullets = [
    t(`${namespace}.bullet1`),
    t(`${namespace}.bullet2`),
    t(`${namespace}.bullet3`),
    t(`${namespace}.bullet4`),
    t(`${namespace}.bullet5`),
  ]

  return (
    <div
      className={`flex flex-col bg-white rounded-2xl border p-7 transition-shadow hover:shadow-lg ${
        highlighted ? 'border-[#0A3D5C] shadow-md' : 'border-gray-200'
      }`}
    >
      <div className="mb-4">
        <h3 className="text-xl font-bold text-[#0A3D5C]">{t(`${namespace}.name`)}</h3>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-bold text-gray-900 tabular-nums">{t(`${namespace}.price`)}</span>
          <span className="text-sm text-gray-500">{t(`${namespace}.priceMode`)}</span>
        </div>
      </div>

      <p className="text-sm text-gray-700 mb-2">{t(`${namespace}.pitch`)}</p>
      <p className="text-xs text-gray-500 italic mb-5">{t(`${namespace}.typicalClient`)}</p>

      <ul className="space-y-2.5 mb-6">
        {bullets.map((b, i) => (
          <li key={i} className="flex gap-2 text-sm text-gray-700">
            <svg className="w-4 h-4 text-[#0A3D5C] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            <span>{b}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto">
        <div className="mb-4 pt-4 border-t border-gray-100">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1">
            {t(`${namespace}.scopeHeading`)}
          </p>
          <p className="text-sm text-gray-700">{t(`${namespace}.scopeLine`)}</p>
        </div>
        <Link
          href={href}
          className={`block w-full text-center px-4 py-3 rounded-xl font-semibold text-sm transition-colors ${
            highlighted
              ? 'bg-[#0A3D5C] text-white hover:bg-[#0d5078]'
              : 'bg-white text-[#0A3D5C] border border-[#0A3D5C] hover:bg-[#0A3D5C] hover:text-white'
          }`}
        >
          {t(`${namespace}.cta`)}
        </Link>
      </div>
    </div>
  )
}

function ComparisonCell({ children, strong }) {
  return (
    <td className={`px-4 py-3 text-sm text-center ${strong ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
      {children}
    </td>
  )
}

function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-gray-200 last:border-0">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-4 py-4 text-left"
      >
        <span className="text-sm font-semibold text-gray-900">{question}</span>
        <svg
          className={`w-4 h-4 text-gray-500 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <p className="pb-4 -mt-1 text-sm text-gray-700 leading-relaxed">{answer}</p>
      )}
    </div>
  )
}

export default function AdvisoryLandingPage() {
  const t = useTranslation(cbamDict)

  const yes = t('advisory.compare.yes')
  const no = t('advisory.compare.no')

  return (
    <div className="min-h-screen bg-gray-50">
      <CbamBreadcrumb />
      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero */}
        <section className="text-center mb-14">
          <p className="inline-block text-[11px] tracking-[0.2em] font-semibold text-[#0A3D5C]/70 uppercase mb-4 px-3 py-1 bg-[#0A3D5C]/5 rounded-full">
            {t('advisory.regBadge')}
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#0A3D5C] mb-4 tracking-tight">
            {t('advisory.title')}
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {t('advisory.subtitle')}
          </p>
        </section>

        {/* Productos */}
        <section className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('advisory.productsTitle')}</h2>
            <p className="text-sm text-gray-600 max-w-2xl mx-auto">{t('advisory.productsSubtitle')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ProductCard
              variant="basic"
              namespace="advisory.basic"
              href="/cbam/asesoria/solicitud?tipo=basico"
              t={t}
            />
            <ProductCard
              variant="complete"
              namespace="advisory.complete"
              href="/cbam/asesoria/solicitud?tipo=completo"
              t={t}
            />
            <ProductCard
              variant="monitoring"
              namespace="advisory.monitoring"
              href="/cbam/asesoria/solicitud/monitorizacion"
              t={t}
              highlighted
            />
          </div>

          <div className="mt-6 max-w-3xl mx-auto bg-[#0A3D5C]/5 border border-[#0A3D5C]/10 rounded-xl px-5 py-4">
            <p className="text-sm text-gray-700 leading-relaxed">
              <span className="inline-block mr-2 text-[#0A3D5C]" aria-hidden="true">●</span>
              {t('advisory.duaEdge')}
            </p>
          </div>
        </section>

        {/* Tabla comparativa */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">{t('advisory.compareTitle')}</h2>
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500">{t('advisory.compare.col1')}</th>
                    <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-gray-500">{t('advisory.compare.col2')}</th>
                    <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-gray-500">{t('advisory.compare.col3')}</th>
                    <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-[#0A3D5C]">{t('advisory.compare.col4')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="px-4 py-3 font-medium text-gray-900">{t('advisory.compare.rowPrice')}</td>
                    <ComparisonCell strong>{t('advisory.compare.valPriceBasic')}</ComparisonCell>
                    <ComparisonCell strong>{t('advisory.compare.valPriceComplete')}</ComparisonCell>
                    <ComparisonCell strong>{t('advisory.compare.valPriceMonitoring')}</ComparisonCell>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-gray-900">{t('advisory.compare.rowScope')}</td>
                    <ComparisonCell>{t('advisory.compare.valScopeBasic')}</ComparisonCell>
                    <ComparisonCell>{t('advisory.compare.valScopeComplete')}</ComparisonCell>
                    <ComparisonCell>{t('advisory.compare.valScopeMonitoring')}</ComparisonCell>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-gray-900">{t('advisory.compare.rowOfficialReport')}</td>
                    <ComparisonCell>{t('advisory.compare.valOfficialReportBasic')}</ComparisonCell>
                    <ComparisonCell>{t('advisory.compare.valOfficialReportComplete')}</ComparisonCell>
                    <ComparisonCell>{t('advisory.compare.valOfficialReportMonitoring')}</ComparisonCell>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-gray-900">{t('advisory.compare.rowDualScenario')}</td>
                    <ComparisonCell>{yes}</ComparisonCell>
                    <ComparisonCell>{yes}</ComparisonCell>
                    <ComparisonCell>{yes}</ComparisonCell>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-gray-900">{t('advisory.compare.rowOfficialData')}</td>
                    <ComparisonCell>{yes}</ComparisonCell>
                    <ComparisonCell>{yes}</ComparisonCell>
                    <ComparisonCell>{yes}</ComparisonCell>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-gray-900">{t('advisory.compare.rowDashboard')}</td>
                    <ComparisonCell>{no}</ComparisonCell>
                    <ComparisonCell>{no}</ComparisonCell>
                    <ComparisonCell>{yes}</ComparisonCell>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-gray-900">{t('advisory.compare.rowMonthlyEmail')}</td>
                    <ComparisonCell>{no}</ComparisonCell>
                    <ComparisonCell>{no}</ComparisonCell>
                    <ComparisonCell>{yes}</ComparisonCell>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-gray-900">{t('advisory.compare.rowAutoDua')}</td>
                    <ComparisonCell>{no}</ComparisonCell>
                    <ComparisonCell>{no}</ComparisonCell>
                    <ComparisonCell>{yes}</ComparisonCell>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-gray-900">{t('advisory.compare.rowSnapshot')}</td>
                    <ComparisonCell>{yes}</ComparisonCell>
                    <ComparisonCell>{yes}</ComparisonCell>
                    <ComparisonCell>{yes}</ComparisonCell>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-gray-900">{t('advisory.compare.rowSupport')}</td>
                    <ComparisonCell>{t('advisory.compare.valSupportBasic')}</ComparisonCell>
                    <ComparisonCell>{t('advisory.compare.valSupportComplete')}</ComparisonCell>
                    <ComparisonCell>{t('advisory.compare.valSupportMonitoring')}</ComparisonCell>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">{t('advisory.faqTitle')}</h2>
          <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-gray-200 px-6">
            <FaqItem question={t('advisory.faq.q1')} answer={t('advisory.faq.a1')} />
            <FaqItem question={t('advisory.faq.q2')} answer={t('advisory.faq.a2')} />
            <FaqItem question={t('advisory.faq.q3')} answer={t('advisory.faq.a3')} />
            <FaqItem question={t('advisory.faq.q4')} answer={t('advisory.faq.a4')} />
            <FaqItem question={t('advisory.faq.q5')} answer={t('advisory.faq.a5')} />
            <FaqItem question={t('advisory.faq.q6')} answer={t('advisory.faq.a6')} />
          </div>
        </section>

        {/* Footer CTA alt */}
        <div className="text-center text-sm text-gray-500">
          {t('advisory.ctaAlt')}{' '}
          <Link href="/cbam/assessment" className="text-[#0A3D5C] hover:underline font-medium">
            {t('advisory.ctaAltLink')}
          </Link>
        </div>
      </main>
    </div>
  )
}
