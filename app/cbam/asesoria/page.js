'use client'

import Link from 'next/link'
import { useTranslation } from '@/lib/i18n'
import { cbamDict } from '@/lib/i18n/cbam'

export default function AdvisoryLandingPage() {
  const t = useTranslation(cbamDict)

  const steps = [
    { num: 1, title: t('advisory.step1Title'), desc: t('advisory.step1Desc') },
    { num: 2, title: t('advisory.step2Title'), desc: t('advisory.step2Desc') },
    { num: 3, title: t('advisory.step3Title'), desc: t('advisory.step3Desc') },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-5xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#0A3D5C] mb-4">
            {t('advisory.title')}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('advisory.subtitle')}
          </p>
        </div>

        {/* How it works */}
        <div className="mb-16">
          <h2 className="text-xl font-bold text-gray-900 text-center mb-8">{t('advisory.howTitle')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step) => (
              <div key={step.num} className="bg-white rounded-xl border border-gray-200 p-6 text-center">
                <div className="w-12 h-12 bg-[#0A3D5C]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-[#0A3D5C]">{step.num}</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Why real data */}
        <div className="mb-16 bg-white rounded-xl border border-gray-200 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{t('advisory.whyRealTitle')}</h2>

          <div className="space-y-4 text-gray-700">
            <p dangerouslySetInnerHTML={{ __html: t('advisory.whyRealP1') }} />
            <p dangerouslySetInnerHTML={{ __html: t('advisory.whyRealP2') }} />
          </div>

          {/* Visual example */}
          <div className="mt-6 p-6 bg-gray-50 rounded-xl border border-gray-100">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
              {t('advisory.exampleTitle')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-red-50 rounded-lg border border-red-100">
                <p className="text-xs text-red-600 font-medium mb-1">{t('advisory.exampleDefault')}</p>
                <p className="text-2xl font-bold text-red-700">~32.500 &euro;</p>
                <p className="text-xs text-red-500 mt-1">{t('advisory.exampleDefaultYear')}</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-100">
                <p className="text-xs text-green-600 font-medium mb-1">{t('advisory.exampleReal')}</p>
                <p className="text-2xl font-bold text-green-700">~18.700 &euro;</p>
                <p className="text-xs text-green-500 mt-1">{t('advisory.exampleRealYear')}</p>
              </div>
              <div className="text-center p-4 bg-[#0A3D5C]/5 rounded-lg border border-[#0A3D5C]/10">
                <p className="text-xs text-[#0A3D5C] font-medium mb-1">{t('advisory.exampleSaving')}</p>
                <p className="text-2xl font-bold text-[#0A3D5C]">~13.800 &euro;</p>
                <p className="text-xs text-[#0A3D5C]/70 mt-1">{t('advisory.exampleSavingPct')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/cbam/asesoria/solicitud"
            className="inline-block px-8 py-4 bg-[#0A3D5C] text-white rounded-xl text-lg font-semibold hover:bg-[#0d5078] transition-colors shadow-lg shadow-[#0A3D5C]/20"
          >
            {t('advisory.ctaButton')}
          </Link>
          <p className="mt-4 text-sm text-gray-500">
            {t('advisory.ctaAlt')}{' '}
            <Link href="/cbam/assessment" className="text-[#0A3D5C] hover:underline font-medium">
              {t('advisory.ctaAltLink')}
            </Link>
          </p>
        </div>
      </main>

    </div>
  )
}
