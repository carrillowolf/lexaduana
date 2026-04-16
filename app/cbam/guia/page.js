'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslation } from '@/lib/i18n'
import { cbamDict } from '@/lib/i18n/cbam'
import CbamBreadcrumb from '@/components/cbam/CbamBreadcrumb'

export default function CBAMGuiaPage() {
  const [activeQuestion, setActiveQuestion] = useState(null)
  const t = useTranslation(cbamDict)

  const toggleQuestion = (index) => {
    setActiveQuestion(activeQuestion === index ? null : index)
  }

  const faqs = [
    { question: t('guide.faq1Q'), answer: t('guide.faq1A') },
    { question: t('guide.faq2Q'), answer: t('guide.faq2A') },
    { question: t('guide.faq3Q'), answer: t('guide.faq3A') },
    { question: t('guide.faq4Q'), answer: t('guide.faq4A') },
    { question: t('guide.faq5Q'), answer: t('guide.faq5A') },
    { question: t('guide.faq6Q'), answer: t('guide.faq6A') },
  ]

  const sectors = [
    { icon: '🏗️', name: t('guide.sectorCement'), examples: t('guide.sectorCementEx') },
    { icon: '🔩', name: t('guide.sectorSteel'), examples: t('guide.sectorSteelEx') },
    { icon: '🥫', name: t('guide.sectorAluminium'), examples: t('guide.sectorAluminiumEx') },
    { icon: '🌱', name: t('guide.sectorFertilizers'), examples: t('guide.sectorFertilizersEx') },
    { icon: '⚡', name: t('guide.sectorElectricity'), examples: t('guide.sectorElectricityEx') },
    { icon: '💨', name: t('guide.sectorHydrogen'), examples: t('guide.sectorHydrogenEx') },
  ]

  const steps = [
    { step: 1, icon: '📝', title: t('guide.step1Title'), description: t('guide.step1Desc'), color: 'from-blue-500 to-blue-600' },
    { step: 2, icon: '📊', title: t('guide.step2Title'), description: t('guide.step2Desc'), color: 'from-purple-500 to-purple-600' },
    { step: 3, icon: '🎫', title: t('guide.step3Title'), description: t('guide.step3Desc'), color: 'from-emerald-500 to-emerald-600' },
    { step: 4, icon: '📤', title: t('guide.step4Title'), description: t('guide.step4Desc'), color: 'from-orange-500 to-orange-600' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <CbamBreadcrumb />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Hero */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-6">
            {t('guide.badge')}
          </span>
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            {t('guide.heroTitle1')}<br />
            <span className="text-emerald-600">{t('guide.heroTitle2')}</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t('guide.heroDesc')}
          </p>
        </div>

        {/* What is CBAM */}
        <section className="mb-16">
          <div className="bg-white rounded-3xl shadow-xl p-8 lg:p-12 border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-4xl">🤔</span>
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">{t('guide.whatIsTitle')}</h2>
            </div>

            <div className="prose prose-lg max-w-none text-gray-600">
              <p className="text-xl leading-relaxed">
                {t('guide.whatIsP1')}
              </p>

              <div className="my-8 p-6 bg-amber-50 rounded-2xl border-2 border-amber-200">
                <p className="text-amber-800 font-medium text-lg mb-0">
                  <span dangerouslySetInnerHTML={{ __html: `💡 <strong>${t('guide.whatIsProblem')}</strong> ${t('guide.whatIsProblemText')}` }} />
                </p>
              </div>

              <p className="text-xl leading-relaxed" dangerouslySetInnerHTML={{ __html: t('guide.whatIsP2') }} />
            </div>

            {/* Visual analogy */}
            <div className="mt-10 grid md:grid-cols-2 gap-6">
              <div className="bg-red-50 rounded-2xl p-6 border border-red-200">
                <div className="text-3xl mb-3">❌</div>
                <h3 className="font-bold text-red-800 mb-2">{t('guide.beforeTitle')}</h3>
                <p className="text-red-700 whitespace-pre-line">
                  {t('guide.beforeText')}
                </p>
              </div>

              <div className="bg-green-50 rounded-2xl p-6 border border-green-200">
                <div className="text-3xl mb-3">✅</div>
                <h3 className="font-bold text-green-800 mb-2">{t('guide.afterTitle')}</h3>
                <p className="text-green-700 whitespace-pre-line">
                  {t('guide.afterText')}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Who is affected */}
        <section className="mb-16">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl shadow-xl p-8 lg:p-12 text-white">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-4xl">🎯</span>
              <h2 className="text-2xl lg:text-3xl font-bold">{t('guide.whoTitle')}</h2>
            </div>

            <p className="text-xl text-blue-100 mb-8">
              {t('guide.whoDesc')}
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sectors.map((sector, idx) => (
                <div key={idx} className="bg-white/10 backdrop-blur rounded-xl p-4">
                  <div className="text-2xl mb-2">{sector.icon}</div>
                  <h3 className="font-bold text-white">{sector.name}</h3>
                  <p className="text-sm text-blue-200">{sector.examples}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 p-4 bg-white/10 rounded-xl">
              <p className="text-blue-100">
                <strong className="text-white">📦 </strong>
                {t('guide.exceptionText')}
              </p>
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="mb-16">
          <div className="bg-white rounded-3xl shadow-xl p-8 lg:p-12 border border-gray-100">
            <div className="flex items-center gap-3 mb-8">
              <span className="text-4xl">📅</span>
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">{t('guide.whenTitle')}</h2>
            </div>

            <div className="space-y-6">
              {/* Current phase */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                    ✓
                  </div>
                  <div className="w-1 h-full bg-gray-200 mt-2"></div>
                </div>
                <div className="pb-8">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-900">{t('guide.phase1Dates')}</span>
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">{t('guide.phase1Badge')}</span>
                  </div>
                  <h3 className="text-lg font-bold text-green-700 mb-2">{t('guide.phase1Title')}</h3>
                  <p className="text-gray-600" dangerouslySetInnerHTML={{ __html: t('guide.phase1Desc') }} />
                </div>
              </div>

              {/* Critical phase */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white font-bold animate-pulse">
                    !
                  </div>
                  <div className="w-1 h-full bg-gray-200 mt-2"></div>
                </div>
                <div className="pb-8">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-900">{t('guide.phase2Date')}</span>
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">{t('guide.phase2Badge')}</span>
                  </div>
                  <h3 className="text-lg font-bold text-red-700 mb-2">{t('guide.phase2Title')}</h3>
                  <p className="text-gray-600" dangerouslySetInnerHTML={{ __html: t('guide.phase2Desc') }} />
                </div>
              </div>

              {/* Future phase */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-white font-bold">
                    →
                  </div>
                </div>
                <div>
                  <span className="font-bold text-gray-900">{t('guide.phase3Date')}</span>
                  <h3 className="text-lg font-bold text-gray-700 mb-2">{t('guide.phase3Title')}</h3>
                  <p className="text-gray-600">
                    {t('guide.phase3Desc')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it works - 4 steps */}
        <section className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">
              {t('guide.howTitle')}
            </h2>
            <p className="text-gray-600">{t('guide.howSubtitle')}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {steps.map((item) => (
              <div key={item.step} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className={`bg-gradient-to-r ${item.color} p-4 flex items-center gap-3`}>
                  <span className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white font-bold">
                    {item.step}
                  </span>
                  <span className="text-2xl">{item.icon}</span>
                  <h3 className="text-lg font-bold text-white">{item.title}</h3>
                </div>
                <div className="p-5">
                  <p className="text-gray-600">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQs */}
        <section className="mb-16">
          <div className="bg-white rounded-3xl shadow-xl p-8 lg:p-12 border border-gray-100">
            <div className="flex items-center gap-3 mb-8">
              <span className="text-4xl">❓</span>
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">{t('guide.faqTitle')}</h2>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className={`border-2 rounded-xl overflow-hidden transition-all ${
                    activeQuestion === idx ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200'
                  }`}
                >
                  <button
                    onClick={() => toggleQuestion(idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4"
                  >
                    <span className="font-bold text-gray-900">{faq.question}</span>
                    <svg
                      className={`w-5 h-5 text-gray-500 transition-transform ${activeQuestion === idx ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {activeQuestion === idx && (
                    <div className="px-5 pb-5">
                      <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section>
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl shadow-xl p-8 lg:p-12 text-white text-center">
            <h2 className="text-2xl lg:text-3xl font-bold mb-4">
              {t('guide.ctaTitle')}
            </h2>
            <p className="text-emerald-100 text-lg mb-8 max-w-xl mx-auto">
              {t('guide.ctaDesc')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/cbam"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-emerald-700 font-bold rounded-xl hover:bg-emerald-50 transition-colors"
              >
                <span className="mr-2">🔍</span>
                {t('guide.ctaVerify')}
              </Link>
              <Link
                href="/calculadora"
                className="inline-flex items-center justify-center px-8 py-4 bg-emerald-700 text-white font-bold rounded-xl hover:bg-emerald-800 transition-colors border-2 border-emerald-500"
              >
                <span className="mr-2">🧮</span>
                {t('guide.ctaCalculator')}
              </Link>
            </div>
          </div>
        </section>

        {/* Credits */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>
            {t('guide.disclaimer')}{' '}
            <a
              href="https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism_es"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 hover:underline"
            >
              {t('guide.disclaimerLink')}
            </a>
            .
          </p>
        </div>
      </main>

    </div>
  )
}
