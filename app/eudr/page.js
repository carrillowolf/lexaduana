'use client'

import JsonLd from '@/components/JsonLd'
import Link from 'next/link'
import { useTranslation, useLocale } from '@/lib/i18n'
import { eudrDict } from '@/lib/i18n/eudr'

// Días restantes
const DEADLINE_OPERATORS = new Date('2026-12-30')
const DEADLINE_PYMES = new Date('2027-06-30')

function daysUntil(target) {
  return Math.ceil((target - new Date()) / (1000 * 60 * 60 * 24))
}

const OFFICIAL_LINKS = [
  { href: 'https://environment.ec.europa.eu/topics/forests/deforestation/regulation-deforestation-free-products_en' },
  { href: 'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32023R1115' },
  { href: 'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32025R2650' },
  { href: 'https://webgate.ec.europa.eu/tracesnt/' },
  { href: 'https://environment.ec.europa.eu/topics/forests/deforestation/regulation-deforestation-free-products/country-benchmarking_en' },
]

const TOOL_LINKS = [
  { href: '/calculadora' },
  { href: '/clasificador' },
  { href: '/comparador' },
  { href: '/cbam' },
]

const TIMELINE_STATUS = ['done', 'done', 'done', 'soon', 'pending', 'pending']

export default function EUDRPage() {
  const t = useTranslation(eudrDict)
  const { locale } = useLocale()
  const daysToOperators = daysUntil(DEADLINE_OPERATORS)
  const daysToPymes = daysUntil(DEADLINE_PYMES)

  const faqData = t('faq')
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: Array.isArray(faqData) ? faqData.map(item => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })) : [],
  }

  const rawMaterials = [
    { icon: '🐄', name: t('rawMaterials.cattle'), desc: t('rawMaterials.cattleDesc') },
    { icon: '🍫', name: t('rawMaterials.cocoa'), desc: t('rawMaterials.cocoaDesc') },
    { icon: '☕', name: t('rawMaterials.coffee'), desc: t('rawMaterials.coffeeDesc') },
    { icon: '🌴', name: t('rawMaterials.palm'), desc: t('rawMaterials.palmDesc') },
    { icon: '🌿', name: t('rawMaterials.rubber'), desc: t('rawMaterials.rubberDesc') },
    { icon: '🌱', name: t('rawMaterials.soy'), desc: t('rawMaterials.soyDesc') },
    { icon: '🪵', name: t('rawMaterials.wood'), desc: t('rawMaterials.woodDesc') },
  ]

  const comparisonRows = [
    { aspect: t('comparison.focus'), cbam: t('comparison.cbamFocus'), eudr: t('comparison.eudrFocus') },
    { aspect: t('comparison.products'), cbam: t('comparison.cbamProducts'), eudr: t('comparison.eudrProducts') },
    { aspect: t('comparison.data'), cbam: t('comparison.cbamData'), eudr: t('comparison.eudrData') },
    { aspect: t('comparison.system'), cbam: t('comparison.cbamSystem'), eudr: t('comparison.eudrSystem') },
    { aspect: t('comparison.date'), cbam: t('comparison.cbamDate'), eudr: t('comparison.eudrDate') },
    { aspect: t('comparison.sanctions'), cbam: t('comparison.cbamSanctions'), eudr: t('comparison.eudrSanctions') },
  ]

  const timelineItems = t('timeline.items')
  const officialLinkLabels = t('resources.officialLinks')
  const toolLinks = t('resources.toolsLinks')

  const phases = [
    { color: 'green', num: 1, title: t('dueDiligence.phase1Title'), items: t('dueDiligence.phase1Items') },
    { color: 'amber', num: 2, title: t('dueDiligence.phase2Title'), items: t('dueDiligence.phase2Items') },
    { color: 'red', num: 3, title: t('dueDiligence.phase3Title'), items: t('dueDiligence.phase3Items') },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50">
      <JsonLd data={faqSchema} />
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-700 via-green-800 to-emerald-900 py-16 md:py-20">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 text-[200px] leading-none">🌳</div>
          <div className="absolute bottom-10 right-10 text-[150px] leading-none">🌿</div>
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <span className="inline-block px-4 py-2 bg-white/15 backdrop-blur-sm text-green-100 rounded-full text-sm font-medium mb-6 border border-white/20">
            {t('hero.badge')}
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
            {t('hero.title')}{' '}
            <span className="text-green-300">{t('hero.titleHighlight')}</span>
          </h2>
          <p className="text-lg text-green-100 max-w-2xl mx-auto mb-8 leading-relaxed">
            {t('hero.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="#materias-primas" className="px-7 py-3 bg-white text-green-800 font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl text-sm hover:bg-green-50">
              {t('hero.ctaProducts')}
            </a>
            <a href="#diligencia-debida" className="px-7 py-3 bg-transparent border border-white/30 hover:border-white/50 text-white rounded-lg transition-all text-sm">
              {t('hero.ctaDueDiligence')}
            </a>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">

        {/* Alerta de Fecha Clave */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-lg border border-green-200 p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 rounded-bl-[80px]" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">📅</span>
                <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded-full uppercase tracking-wide">{t('deadlines.operators')}</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{t('deadlines.operatorsDate')}</p>
              <p className="text-sm text-gray-500 mb-4">{t('deadlines.operatorsDesc')}</p>
              <div className="flex items-center gap-2">
                <span className={`text-2xl font-bold ${daysToOperators <= 180 ? 'text-red-600' : 'text-green-700'}`}>
                  {daysToOperators > 0 ? daysToOperators : 0}
                </span>
                <span className="text-sm text-gray-600">{t('deadlines.daysRemaining')}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-emerald-200 p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-[80px]" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">📅</span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full uppercase tracking-wide">{t('deadlines.smes')}</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{t('deadlines.smesDate')}</p>
              <p className="text-sm text-gray-500 mb-4">{t('deadlines.smesDesc')}</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-emerald-700">
                  {daysToPymes > 0 ? daysToPymes : 0}
                </span>
                <span className="text-sm text-gray-600">{t('deadlines.daysRemaining')}</span>
              </div>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-400 text-center -mt-8">
          {t('deadlines.legalSource')}
        </p>

        {/* ¿Qué es el EUDR? */}
        <section>
          <div className="bg-gradient-to-br from-green-700 to-emerald-800 rounded-3xl shadow-xl p-8 md:p-10 text-white">
            <h3 className="text-2xl font-bold mb-2">{t('whatIs.title')}</h3>
            <p className="text-green-200 mb-8 text-sm">{t('whatIs.subtitle')}</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: '🌲', title: t('whatIs.pillar1Title'), desc: t('whatIs.pillar1Desc') },
                { icon: '⚖️', title: t('whatIs.pillar2Title'), desc: t('whatIs.pillar2Desc') },
                { icon: '📋', title: t('whatIs.pillar3Title'), desc: t('whatIs.pillar3Desc') },
              ].map((pillar) => (
                <div key={pillar.icon} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <span className="text-3xl mb-4 block">{pillar.icon}</span>
                  <h4 className="text-lg font-bold mb-2">{pillar.title}</h4>
                  <p className="text-green-100 text-sm leading-relaxed">{pillar.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Materias Primas Reguladas */}
        <section id="materias-primas">
          <div className="text-center mb-8">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{t('rawMaterials.title')}</h3>
            <p className="text-gray-600">{t('rawMaterials.subtitle')}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {rawMaterials.map((item) => (
              <div key={item.icon} className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 hover:shadow-lg hover:border-green-200 transition-all">
                <span className="text-3xl mb-3 block">{item.icon}</span>
                <h4 className="font-bold text-gray-900 mb-1">{item.name}</h4>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 text-center mt-4">
            {t('rawMaterials.footnote')}
          </p>
        </section>

        {/* Proceso de Diligencia Debida */}
        <section id="diligencia-debida">
          <div className="text-center mb-8">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{t('dueDiligence.title')}</h3>
            <p className="text-gray-600">{t('dueDiligence.subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {phases.map((phase, i) => (
              <div key={phase.num} className={i < 2 ? 'relative' : ''}>
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 h-full">
                  <div className={`w-10 h-10 bg-${phase.color}-100 text-${phase.color}-700 rounded-full flex items-center justify-center font-bold text-lg mb-4`}>{phase.num}</div>
                  <h4 className="text-lg font-bold text-gray-900 mb-3">{phase.title}</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    {Array.isArray(phase.items) && phase.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-2">
                        <span className={`text-${phase.color}-500 mt-0.5`}>&#10003;</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                {i < 2 && <div className="hidden md:block absolute top-1/2 -right-3 text-gray-300 text-2xl">&rarr;</div>}
              </div>
            ))}
          </div>
        </section>

        {/* Sistema de Clasificación de Países */}
        <section>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span>🌍</span> {t('countries.title')}
              </h3>
              <p className="text-sm text-gray-500 mt-1">{t('countries.subtitle')}</p>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 bg-green-50 rounded-xl border border-green-200">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-3 h-3 bg-green-500 rounded-full" />
                    <span className="font-bold text-green-800">{t('countries.lowRisk')}</span>
                  </div>
                  <p className="text-sm text-green-700 mb-2">{t('countries.lowRiskDesc')}</p>
                  <p className="text-xs text-green-600">{t('countries.lowRiskInspection')}</p>
                </div>
                <div className="p-5 bg-amber-50 rounded-xl border border-amber-200">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-3 h-3 bg-amber-500 rounded-full" />
                    <span className="font-bold text-amber-800">{t('countries.standardRisk')}</span>
                  </div>
                  <p className="text-sm text-amber-700 mb-2">{t('countries.standardRiskDesc')}</p>
                  <p className="text-xs text-amber-600">{t('countries.standardRiskInspection')}</p>
                </div>
                <div className="p-5 bg-red-50 rounded-xl border border-red-200">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-3 h-3 bg-red-500 rounded-full" />
                    <span className="font-bold text-red-800">{t('countries.highRisk')}</span>
                  </div>
                  <p className="text-sm text-red-700 mb-2">{t('countries.highRiskDesc')}</p>
                  <p className="text-xs text-red-600">{t('countries.highRiskInspection')}</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-4">
                {t('countries.footnote')}
              </p>
            </div>
          </div>
        </section>

        {/* Sanciones */}
        <section>
          <div className="bg-red-50 rounded-2xl shadow-lg border-2 border-red-200 overflow-hidden">
            <div className="px-8 py-6 bg-gradient-to-r from-red-600 to-orange-600">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span>⚠️</span> {t('penalties.title')}
              </h3>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { icon: '💰', title: t('penalties.fine'), desc: t('penalties.fineDesc') },
                  { icon: '📦', title: t('penalties.confiscation'), desc: t('penalties.confiscationDesc') },
                  { icon: '🚫', title: t('penalties.ban'), desc: t('penalties.banDesc') },
                  { icon: '🏛️', title: t('penalties.exclusion'), desc: t('penalties.exclusionDesc') },
                ].map((item) => (
                  <div key={item.icon} className="flex items-start gap-3 p-4 bg-white rounded-xl border border-red-100">
                    <span className="text-red-500 text-xl mt-0.5">{item.icon}</span>
                    <div>
                      <p className="font-bold text-gray-900">{item.title}</p>
                      <p className="text-sm text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-4 bg-white rounded-xl border border-red-100">
                <div className="flex items-start gap-3">
                  <span className="text-red-500 text-xl mt-0.5">📢</span>
                  <div>
                    <p className="font-bold text-gray-900">{t('penalties.naming')}</p>
                    <p className="text-sm text-gray-500">{t('penalties.namingDesc')}</p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-4">
                {t('penalties.footnote')}
              </p>
            </div>
          </div>
        </section>

        {/* EUDR vs CBAM */}
        <section>
          <div className="text-center mb-8">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{t('comparison.title')}</h3>
            <p className="text-gray-600">{t('comparison.subtitle')}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b-2 border-gray-200">
                    <th className="py-4 px-6 text-left text-gray-500 font-medium">{t('comparison.aspect')}</th>
                    <th className="py-4 px-6 text-left text-emerald-700 font-bold">
                      <span className="flex items-center gap-2">🌍 CBAM</span>
                    </th>
                    <th className="py-4 px-6 text-left text-green-700 font-bold">
                      <span className="flex items-center gap-2">🌳 EUDR</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-6 font-medium text-gray-700">{row.aspect}</td>
                      <td className="py-4 px-6 text-gray-600">{row.cbam}</td>
                      <td className="py-4 px-6 text-gray-600">{row.eudr}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section>
          <div className="text-center mb-8">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{t('timeline.title')}</h3>
            <p className="text-gray-600">{t('timeline.subtitle')}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <div className="space-y-0">
              {Array.isArray(timelineItems) && timelineItems.map((item, i) => {
                const status = TIMELINE_STATUS[i]
                return (
                  <div key={i} className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${
                        status === 'done' ? 'bg-green-100 text-green-700' :
                        status === 'soon' ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {status === 'done' ? '✅' : status === 'soon' ? '🔜' : '⏳'}
                      </span>
                      {i < 5 && <div className="w-0.5 h-8 bg-gray-200 my-1" />}
                    </div>
                    <div className="pb-6">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">{item.date}</p>
                      <p className={`font-medium ${status === 'pending' ? 'text-gray-900' : 'text-gray-700'}`}>{item.title}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Recursos Oficiales + Herramientas LexAduana */}
        <section>
          <div className="text-center mb-8">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{t('resources.title')}</h3>
            <p className="text-gray-600">{t('resources.subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>🇪🇺</span> {t('resources.officialTitle')}
              </h4>
              <ul className="space-y-3">
                {Array.isArray(officialLinkLabels) && officialLinkLabels.map((label, i) => (
                  <li key={i}>
                    <a href={OFFICIAL_LINKS[i]?.href} target="_blank" rel="noopener noreferrer" className="text-sm text-green-700 hover:text-green-900 underline underline-offset-2">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>🛠️</span> {t('resources.toolsTitle')}
              </h4>
              <ul className="space-y-3">
                {Array.isArray(toolLinks) && toolLinks.map((tool, i) => (
                  <li key={i}>
                    <Link href={TOOL_LINKS[i]?.href} className="flex items-center gap-2 text-green-700 hover:text-green-900 text-sm">
                      <span>{tool.icon}</span> {tool.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* CTA → CBAM */}
        <section>
          <div className="bg-gradient-to-r from-[#0A3D5C] to-[#083049] rounded-3xl shadow-xl p-8 md:p-10 text-white text-center">
            <h3 className="text-2xl font-bold mb-3">{t('ctaCbam.title')}</h3>
            <p className="text-blue-200 mb-6 max-w-2xl mx-auto">
              {t('ctaCbam.desc')}
            </p>
            <Link
              href="/cbam"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[#0A3D5C] font-bold rounded-xl hover:bg-gray-100 transition-all shadow-lg"
            >
              {t('ctaCbam.button')}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </section>

        {/* CTA → OEA */}
        <section>
          <div className="bg-gradient-to-r from-red-800 to-red-900 rounded-3xl shadow-xl p-8 md:p-10 text-white text-center">
            <h3 className="text-2xl font-bold mb-3">{t('ctaOea.title')}</h3>
            <p className="text-red-200 mb-6 max-w-2xl mx-auto">
              {t('ctaOea.desc')}
            </p>
            <Link
              href="/oea"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-red-800 font-bold rounded-xl hover:bg-red-50 transition-all shadow-lg"
            >
              {t('ctaOea.button')}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </section>
      </div>

    </div>
  )
}
