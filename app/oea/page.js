'use client'

import JsonLd from '@/components/JsonLd'
import Link from 'next/link'
import { useTranslation, useLocale } from '@/lib/i18n'
import { oeaDict } from '@/lib/i18n/oea'

/* ── Static data (non-translatable structure) ─────────────── */

const MODALIDADES_META = [
  { id: 'oeac', nombre: 'OEAC', icon: '📋', badgeColor: 'bg-blue-100 text-blue-700 border-blue-200', cardBorder: 'border-blue-200 hover:border-blue-400', stat: '48%' },
  { id: 'oeas', nombre: 'OEAS', icon: '🔒', badgeColor: 'bg-amber-100 text-amber-700 border-amber-200', cardBorder: 'border-amber-200 hover:border-amber-400', stat: '4%' },
  { id: 'oeaf', nombre: 'OEAF', icon: '🛡️', badgeColor: 'bg-red-100 text-red-700 border-red-200', cardBorder: 'border-red-200 hover:border-red-400', stat: '48%' },
]

const BENEFICIOS_STRUCTURE = [
  { oeac: true, oeas: false },
  { oeac: true, oeas: false },
  { oeac: true, oeas: false },
  { oeac: true, oeas: false },
  { oeac: false, oeas: true },
  { oeac: true, oeas: false },
  { oeac: false, oeas: true },
  { oeac: true, oeas: false },
  { oeac: false, oeas: true },
  { oeac: true, oeas: true },
  { oeac: true, oeas: true },
  { oeac: false, oeas: true },
]

const PASO_COLORS = [
  'bg-red-100 text-red-700',
  'bg-orange-100 text-orange-700',
  'bg-amber-100 text-amber-700',
  'bg-green-100 text-green-700',
]

const ARM_FLAGS = ['🇨🇭🇳🇴', '🇯🇵', '🇺🇸', '🇨🇳', '🇬🇧', '🇲🇩', '🇨🇦', '🇦🇩']
const ARM_YEARS = [2009, 2011, 2012, 2014, 2021, 2022, 2025, null]

const SME_ICONS = ['📄', '🔐', '🗣️', '📏']

const OFFICIAL_HREFS = [
  'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32013R0952',
  'https://taxation-customs.ec.europa.eu/customs-4/aeo-authorised-economic-operator_en',
  'https://sede.agenciatributaria.gob.es/',
  'https://taxation-customs.ec.europa.eu/customs-4/aeo-authorised-economic-operator/aeo-guidelines_en',
  'https://ec.europa.eu/taxation_customs/dds2/eos/aeo_consultation.jsp',
  'https://taxation-customs.ec.europa.eu/customs-4/aeo-authorised-economic-operator/mutual-recognition_en',
]

const CRITERIA_SOLO_TAGS = [null, null, null, 'OEAC', 'OEAS']

export default function OEAPage() {
  const t = useTranslation(oeaDict)
  const { locale } = useLocale()

  const oeaFaqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: locale === 'en' ? 'What is an AEO (Authorised Economic Operator)?' : '¿Qué es el OEA (Operador Económico Autorizado)?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: locale === 'en'
            ? 'An AEO is an economic operator that meets criteria for compliance, records, solvency, competence and security, and is recognised as reliable throughout the EU customs territory. Based on the WCO SAFE Framework, it grants advantages such as fewer controls, reduced guarantees and international recognition.'
            : 'El OEA es un operador económico que cumple criterios de cumplimiento, registros, solvencia, competencia y seguridad, y es reconocido como fiable en todo el territorio aduanero de la UE. Basado en el Marco SAFE de la OMA, concede ventajas como menos controles, garantías reducidas y reconocimiento internacional.',
        },
      },
    ],
  }

  // Get translated arrays
  const modalityKeys = ['oeac', 'oeas', 'oeaf']
  const criteriaItems = t('criteria.items') || []
  const benefitLabels = t('benefits.items') || []
  const steps = t('procedure.steps') || []
  const deadlines = t('procedure.deadlines.items') || []
  const countries = t('countries') || []
  const smeItems = t('sme.items') || []
  const futureItems = t('future.items') || []
  const officialLinks = t('resources.officialLinks') || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50/30">
      <JsonLd data={oeaFaqSchema} />

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-red-800 via-red-900 to-red-950 py-16 md:py-20">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 text-[200px] leading-none">🛡️</div>
          <div className="absolute bottom-10 right-10 text-[150px] leading-none">🏛️</div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <span className="inline-block px-4 py-2 bg-white/15 backdrop-blur-sm text-red-100 rounded-full text-sm font-medium mb-6 border border-white/20">
                🇪🇺 {t('hero.badge')}
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
                {t('hero.title')}{' '}
                <span className="text-red-300">{t('hero.titleHighlight')}</span>
              </h1>
              <p className="text-lg text-red-100 max-w-xl mb-8 leading-relaxed">
                {t('hero.subtitle')}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a href="#modalidades" className="px-7 py-3 bg-white text-red-800 font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl text-sm hover:bg-red-50">
                  {t('hero.ctaModalities')}
                </a>
                <a href="#procedimiento" className="px-7 py-3 bg-transparent border border-white/30 hover:border-white/50 text-white rounded-lg transition-all text-sm">
                  {t('hero.ctaHowTo')}
                </a>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 flex flex-col justify-center">
              <div className="text-center">
                <span className="text-6xl font-bold text-white">{t('hero.stat')}</span>
                <p className="text-red-200 text-sm mt-2 mb-4">{t('hero.statDesc')}</p>
                <div className="h-px bg-white/20 my-4" />
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl font-bold text-red-300">{t('hero.statSpain')}</span>
                  <span className="text-red-200 text-sm">{t('hero.statSpainLabel')}</span>
                </div>
                <p className="text-red-300/60 text-xs mt-3">{t('hero.statFooter')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-14">

        {/* 1. ¿Qué es el OEA? */}
        <section>
          <div className="bg-white rounded-2xl shadow-lg border-l-4 border-red-600 p-8 md:p-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('whatIs.title')}</h2>
            <p className="text-gray-700 leading-relaxed mb-6" dangerouslySetInnerHTML={{ __html: t('whatIs.p1') }} />
            <p className="text-gray-600 leading-relaxed mb-6" dangerouslySetInnerHTML={{ __html: t('whatIs.p2') }} />
            <div className="bg-gray-50 border-l-4 border-gray-300 rounded-r-lg p-5">
              <p className="text-sm text-gray-600 italic leading-relaxed">{t('whatIs.quote')}</p>
              <p className="text-xs text-gray-400 mt-2 font-medium">{t('whatIs.quoteSource')}</p>
            </div>
          </div>
        </section>

        {/* 2. Tres Modalidades */}
        <section id="modalidades">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{t('modalities.title')}</h2>
            <p className="text-gray-600">{t('modalities.subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {MODALIDADES_META.map((m, idx) => {
              const key = modalityKeys[idx]
              const mData = t(`modalities.${key}`) || {}
              const criteria = mData.criteria || []
              const benefits = mData.benefits || []
              return (
                <div key={m.id} className={`bg-white rounded-2xl shadow-lg border-2 ${m.cardBorder} p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1`}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">{m.icon}</span>
                    <div>
                      <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full border ${m.badgeColor}`}>
                        {m.nombre}
                      </span>
                      <p className="text-sm font-semibold text-gray-900 mt-1">{mData.title}</p>
                    </div>
                  </div>
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t('modalities.criteriaRequired')}</p>
                    <div className="flex flex-wrap gap-1">
                      {criteria.map((c) => (
                        <span key={c} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{c}</span>
                      ))}
                    </div>
                  </div>
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t('modalities.keyBenefits')}</p>
                    <ul className="space-y-1">
                      {benefits.map((b) => (
                        <li key={b} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="text-red-500 mt-0.5 flex-shrink-0">✓</span>{b}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{t('modalities.whoShould')}</p>
                    <p className="text-sm text-gray-600">{mData.who}</p>
                  </div>
                  <div className="pt-4 border-t border-gray-100 text-center">
                    <span className="text-3xl font-bold text-gray-900">{m.stat}</span>
                    <p className="text-xs text-gray-500 mt-1">{mData.statLabel}</p>
                  </div>
                </div>
              )
            })}
          </div>
          <p className="text-xs text-gray-400 text-center mt-4">{t('modalities.legalNote')}</p>
        </section>

        {/* 3. Los 5 Criterios */}
        <section id="criterios">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{t('criteria.title')}</h2>
            <p className="text-gray-600">{t('criteria.subtitle')}</p>
          </div>
          <div className="bg-red-50/30 rounded-3xl p-6 md:p-8 space-y-6">
            {Array.isArray(criteriaItems) && criteriaItems.map((c, idx) => (
              <div key={idx} className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 md:p-8">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-red-600 text-white rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-gray-900">{c.title}</h3>
                      {c.soloTag && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.soloTag === 'OEAC' || c.soloTag === 'AEOC' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                          ⚡ {t('criteria.only')} {c.soloTag}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 font-medium">{c.baseLegal}</p>
                    <p className="text-xs text-red-600 font-medium">{t('criteria.appliesTo')}: {c.appliesTo}</p>
                  </div>
                </div>
                <p className="text-gray-700 leading-relaxed mb-4">{c.description}</p>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{t('criteria.keyAspects')}</p>
                  <ul className="space-y-2">
                    {(c.details || []).map((d, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-red-400 mt-1 flex-shrink-0">•</span>{d}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 4. Tabla de Beneficios */}
        <section id="beneficios">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{t('benefits.title')}</h2>
            <p className="text-gray-600">{t('benefits.subtitle')}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b-2 border-gray-200">
                    <th className="py-4 px-6 text-left text-gray-500 font-medium">{t('benefits.benefitLabel')}</th>
                    <th className="py-4 px-6 text-center text-blue-700 font-bold">
                      <span className="flex items-center justify-center gap-1">📋 OEAC</span>
                    </th>
                    <th className="py-4 px-6 text-center text-amber-700 font-bold">
                      <span className="flex items-center justify-center gap-1">🔒 OEAS</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {BENEFICIOS_STRUCTURE.map((row, i) => (
                    <tr key={i} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-red-50/30 transition-colors`}>
                      <td className="py-3.5 px-6 font-medium text-gray-700">{Array.isArray(benefitLabels) ? benefitLabels[i] : ''}</td>
                      <td className="py-3.5 px-6 text-center">
                        {row.oeac
                          ? <span className="inline-flex items-center justify-center w-7 h-7 bg-green-100 text-green-600 rounded-full text-base">✓</span>
                          : <span className="inline-flex items-center justify-center w-7 h-7 bg-gray-100 text-gray-300 rounded-full text-base">✗</span>
                        }
                      </td>
                      <td className="py-3.5 px-6 text-center">
                        {row.oeas
                          ? <span className="inline-flex items-center justify-center w-7 h-7 bg-green-100 text-green-600 rounded-full text-base">✓</span>
                          : <span className="inline-flex items-center justify-center w-7 h-7 bg-gray-100 text-gray-300 rounded-full text-base">✗</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-3 bg-red-50 border-t border-red-100">
              <p className="text-xs text-red-700 font-medium text-center">🛡️ {t('benefits.oeafNote')}</p>
            </div>
          </div>
        </section>

        {/* 5. Procedimiento */}
        <section id="procedimiento">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{t('procedure.title')}</h2>
            <p className="text-gray-600">{t('procedure.subtitle')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.isArray(steps) && steps.map((paso, idx) => (
              <div key={idx} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-red-400" />
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 ${PASO_COLORS[idx]} rounded-full flex items-center justify-center font-bold text-lg`}>
                    {idx + 1}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{paso.title}</h3>
                    <p className="text-xs text-gray-500">{paso.time}</p>
                  </div>
                </div>
                <ul className="space-y-2">
                  {(paso.items || []).map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-red-500 mt-0.5 flex-shrink-0">▸</span>{item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Deadlines table */}
          <div className="mt-6 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <span>⏱️</span> {t('procedure.deadlines.title')}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-3 px-6 text-left text-gray-500 font-medium">{t('procedure.deadlines.phase')}</th>
                    <th className="py-3 px-6 text-left text-gray-500 font-medium">{t('procedure.deadlines.deadline')}</th>
                    <th className="py-3 px-6 text-left text-gray-500 font-medium">{t('procedure.deadlines.legalBasis')}</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(deadlines) && deadlines.map((row, i) => (
                    <tr key={i} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                      <td className="py-3 px-6 text-gray-700 font-medium">{row.phase}</td>
                      <td className="py-3 px-6 text-gray-900 font-semibold">{row.deadline}</td>
                      <td className="py-3 px-6 text-gray-400 text-xs">{row.basis}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* 6. Reconocimiento Mutuo */}
        <section id="reconocimiento">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{t('mutualRecognition.title')}</h2>
            <p className="text-gray-600">{t('mutualRecognition.subtitle')}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {ARM_FLAGS.map((flag, i) => {
                const countryData = Array.isArray(countries) ? countries[i] : {}
                return (
                  <div key={i} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-red-200 hover:bg-red-50/30 transition-all">
                    <span className="text-2xl">{flag}</span>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{countryData?.country || ''}</p>
                      {ARM_YEARS[i] && <p className="text-xs text-gray-500">{t('mutualRecognition.since')} {ARM_YEARS[i]}</p>}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm text-amber-800" dangerouslySetInnerHTML={{ __html: t('mutualRecognition.important') }} />
            </div>
          </div>
        </section>

        {/* 7. PYMEs */}
        <section>
          <div className="bg-amber-50 rounded-2xl shadow-lg border-2 border-amber-200 p-8 md:p-10">
            <div className="flex items-start gap-4 mb-6">
              <span className="text-4xl">🏢</span>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">{t('sme.title')}</h2>
                <p className="text-amber-700 text-sm font-medium">{t('sme.legalRef')}</p>
              </div>
            </div>
            <p className="text-gray-700 leading-relaxed mb-6">{t('sme.description')}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.isArray(smeItems) && smeItems.map((text, i) => (
                <div key={i} className="flex items-start gap-3 p-4 bg-white rounded-xl border border-amber-100">
                  <span className="text-xl flex-shrink-0">{SME_ICONS[i]}</span>
                  <p className="text-sm text-gray-700">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 8. Trust & Check */}
        <section>
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-xl p-8 md:p-10 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-bl-[100px]" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🔮</span>
                <span className="text-xs font-bold text-red-400 bg-red-500/20 px-3 py-1 rounded-full uppercase tracking-wide">{t('future.badge')}</span>
              </div>
              <h2 className="text-2xl font-bold mb-4">{t('future.title')}</h2>
              <p className="text-slate-300 leading-relaxed mb-6">{t('future.description')}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.isArray(futureItems) && futureItems.map((item, i) => (
                  <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-xl">
                    <h4 className="font-semibold text-white text-sm mb-1">{item.title}</h4>
                    <p className="text-slate-400 text-xs">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 9. Conexión CBAM / EUDR */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-lg border border-emerald-200 p-6 hover:shadow-xl transition-all">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🏭</span>
                <h3 className="font-bold text-gray-900">{t('connections.cbam.title')}</h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">{t('connections.cbam.description')}</p>
              <Link href="/cbam" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-900 transition-colors">
                {t('connections.cbam.link')}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
              </Link>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-green-200 p-6 hover:shadow-xl transition-all">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🌳</span>
                <h3 className="font-bold text-gray-900">{t('connections.eudr.title')}</h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">{t('connections.eudr.description')}</p>
              <Link href="/eudr" className="inline-flex items-center gap-2 text-sm font-semibold text-green-700 hover:text-green-900 transition-colors">
                {t('connections.eudr.link')}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
              </Link>
            </div>
          </div>
        </section>

        {/* 10. Recursos */}
        <section>
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{t('resources.title')}</h2>
            <p className="text-gray-600">{t('resources.subtitle')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>🇪🇺</span> {t('resources.official')}
              </h3>
              <ul className="space-y-3">
                {OFFICIAL_HREFS.map((href, i) => (
                  <li key={href}>
                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-sm text-red-700 hover:text-red-900 underline underline-offset-2">
                      {Array.isArray(officialLinks) && officialLinks[i] ? officialLinks[i].label : ''}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>🛠️</span> {t('resources.tools')}
              </h3>
              <ul className="space-y-3">
                <li><Link href="/calculadora" className="flex items-center gap-2 text-red-700 hover:text-red-900 text-sm"><span>🧮</span> {t('resources.toolLinks.calculator')}</Link></li>
                <li><Link href="/clasificador" className="flex items-center gap-2 text-red-700 hover:text-red-900 text-sm"><span>🤖</span> {t('resources.toolLinks.classifier')}</Link></li>
                <li><Link href="/cbam" className="flex items-center gap-2 text-red-700 hover:text-red-900 text-sm"><span>🏭</span> {t('resources.toolLinks.cbam')}</Link></li>
                <li><Link href="/eudr" className="flex items-center gap-2 text-red-700 hover:text-red-900 text-sm"><span>🌳</span> {t('resources.toolLinks.eudr')}</Link></li>
              </ul>
            </div>
          </div>
        </section>

        {/* Footer legal */}
        <section>
          <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6 text-center">
            <p className="text-xs text-gray-500 leading-relaxed mb-2">{t('footer.line1')}</p>
            <p className="text-xs text-gray-400">{t('footer.line2')}</p>
          </div>
        </section>
      </div>
    </div>
  )
}
