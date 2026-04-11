'use client'

import { useState } from 'react'
import Link from 'next/link'
import { INCOTERMS_2020 } from '@/lib/incotermsData'
import {
  VALUATION_METHODS,
  NUMERICAL_EXAMPLES,
  DV1_INFO,
  EXTENDED_DUA_H1_FIELDS,
  ENHANCED_CAU_ADJUSTMENTS,
  PROBLEMATIC_CASES,
  GENERAL_NOTES,
  DUTY_VS_VAT_COMPARISON,
  PAGE_SECTIONS,
} from '@/lib/customsValueData'
import {
  VALUATION_METHODS_EN,
  NUMERICAL_EXAMPLES_EN,
  DV1_INFO_EN,
  EXTENDED_DUA_H1_FIELDS_EN,
  ENHANCED_CAU_ADJUSTMENTS_EN,
  PROBLEMATIC_CASES_EN,
  GENERAL_NOTES_EN,
  DUTY_VS_VAT_COMPARISON_EN,
  PAGE_SECTIONS_EN,
} from '@/lib/customsValueData.en'
import { useTranslation, useLocale } from '@/lib/i18n'
import { valorDict } from '@/lib/i18n/valor-en-aduana'

/* ================================================================
   Hook to pick locale-aware data
   ================================================================ */

function useLocalizedData() {
  const { locale } = useLocale()
  const isEn = locale === 'en'
  return {
    valuationMethods: isEn ? VALUATION_METHODS_EN : VALUATION_METHODS,
    numericalExamples: isEn ? NUMERICAL_EXAMPLES_EN : NUMERICAL_EXAMPLES,
    dv1Info: isEn ? DV1_INFO_EN : DV1_INFO,
    duaFields: isEn ? EXTENDED_DUA_H1_FIELDS_EN : EXTENDED_DUA_H1_FIELDS,
    cauAdjustments: isEn ? ENHANCED_CAU_ADJUSTMENTS_EN : ENHANCED_CAU_ADJUSTMENTS,
    problematicCases: isEn ? PROBLEMATIC_CASES_EN : PROBLEMATIC_CASES,
    generalNotes: isEn ? GENERAL_NOTES_EN : GENERAL_NOTES,
    dutyVsVatComparison: isEn ? DUTY_VS_VAT_COMPARISON_EN : DUTY_VS_VAT_COMPARISON,
    pageSections: isEn ? PAGE_SECTIONS_EN : PAGE_SECTIONS,
    locale,
  }
}

/* ================================================================
   MINI-TOC — section navigation
   ================================================================ */

function MiniTOC() {
  const t = useTranslation(valorDict)
  const { pageSections } = useLocalizedData()

  return (
    <nav className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">{t('toc.label')}</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
        {pageSections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-50 hover:bg-blue-50 hover:text-blue-700 transition-colors text-xs font-medium text-gray-600"
          >
            <span>{s.icon}</span>
            <span className="truncate">{s.label}</span>
          </a>
        ))}
      </div>
    </nav>
  )
}

/* ================================================================
   BLOCK 1 — Valuation methods
   ================================================================ */

function ValuationMethods() {
  const t = useTranslation(valorDict)
  const { valuationMethods } = useLocalizedData()

  const frequencyConfig = {
    habitual: { bg: 'bg-emerald-100 text-emerald-800', icon: '✅' },
    secundario: { bg: 'bg-blue-100 text-blue-700', icon: '🔄' },
    excepcional: { bg: 'bg-amber-100 text-amber-800', icon: '⚠️' },
  }

  return (
    <section id="metodos" className="scroll-mt-8">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
        {t('methods.title')}
      </h2>
      <p className="text-sm text-gray-600 mb-6" dangerouslySetInnerHTML={{ __html: t('methods.desc') }} />

      {/* Visual sequence arrow */}
      <div className="hidden sm:flex items-center justify-center gap-1 mb-6 text-xs text-gray-400">
        {valuationMethods.map((m, i) => (
          <span key={m.number} className="flex items-center gap-1">
            <span className={`px-2 py-1 rounded font-bold ${i === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'}`}>
              M{m.number}
            </span>
            {i < 5 && <span className="text-gray-300">→</span>}
          </span>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {valuationMethods.map((m) => {
          const freq = frequencyConfig[m.frequency]
          return (
            <div key={m.number} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-[#0A3D5C] text-white flex items-center justify-center text-sm font-bold">
                    {m.number}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">{m.title}</h3>
                    <p className="text-[11px] text-gray-400">{m.article}</p>
                  </div>
                </div>
              </div>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold mb-3 ${freq.bg}`}>
                {freq.icon} {m.frequencyLabel}
              </span>
              <p className="text-sm text-gray-700 leading-relaxed mb-3">{m.description}</p>
              {m.keyChange && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs text-amber-800">
                  <strong>{t('methods.keyChange')}</strong> {m.keyChange}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

/* ================================================================
   BLOCK 2 — Incoterm adjustments (interactive wizard)
   ================================================================ */

function IncotermWizard() {
  const [selected, setSelected] = useState('CIF')
  const t = useTranslation(valorDict)
  const { generalNotes } = useLocalizedData()
  const item = INCOTERMS_2020.find((i) => i.code === selected)
  const adj = item?.customsValueAdjustments

  return (
    <section id="ajustes-incoterm" className="scroll-mt-8">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
        {t('wizard.title')}
      </h2>
      <p className="text-sm text-gray-600 mb-6">
        {t('wizard.desc')}
      </p>

      {/* Incoterm selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {INCOTERMS_2020.map((inc) => (
          <button
            key={inc.code}
            onClick={() => setSelected(inc.code)}
            className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
              selected === inc.code
                ? 'bg-[#0A3D5C] text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {inc.code}
          </button>
        ))}
      </div>

      {adj && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0A3D5C] to-[#0D5A8A] px-5 py-4 text-white">
            <h3 className="text-lg font-bold">{item.code} — {item.name}</h3>
            <p className="text-sm text-blue-200">{item.nameEs}</p>
          </div>

          <div className="p-5 space-y-5">
            {/* Additions */}
            {adj.addToCustomsValue.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="text-sm font-bold text-red-800 mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-red-200 text-red-800 flex items-center justify-center text-xs">+</span>
                  {t('wizard.addTitle')}
                </h4>
                <div className="space-y-2">
                  {adj.addToCustomsValue.map((a, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-red-500 font-bold mt-0.5">+</span>
                      <div>
                        <span className="font-medium text-gray-800">{a.concept}</span>
                        {a.mandatory === false && (
                          <span className="ml-1.5 text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{t('wizard.conditional')}</span>
                        )}
                        {a.note && <p className="text-xs text-gray-500 mt-0.5">{a.note}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No additions */}
            {adj.addToCustomsValue.length === 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-xs">+</span>
                  {t('wizard.noAdditions')}
                </p>
              </div>
            )}

            {/* Deductions */}
            {adj.deductFromCustomsValue.length > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <h4 className="text-sm font-bold text-emerald-800 mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center text-xs">−</span>
                  {t('wizard.deductTitle')}
                </h4>
                <div className="space-y-2">
                  {adj.deductFromCustomsValue.map((d, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-emerald-600 font-bold mt-0.5">−</span>
                      <div>
                        <span className="font-medium text-gray-800">{d.concept}</span>
                        {d.condition && <p className="text-xs text-gray-500 mt-0.5">{d.condition}</p>}
                        {d.note && <p className="text-xs text-amber-600 mt-0.5">{d.note}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No deductions */}
            {adj.deductFromCustomsValue.length === 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-xs">−</span>
                  {t('wizard.noDeductions')}
                </p>
              </div>
            )}

            {/* Formula */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">{t('wizard.formula')}</p>
              <p className="text-sm font-mono font-bold text-blue-900">{adj.formula}</p>
              <p className="text-xs text-blue-600 mt-1">{adj.legalBasis}</p>
            </div>

            {/* Alert */}
            {item.dispatcherAlert && (
              <div className={`rounded-lg p-3.5 text-sm flex items-start gap-2.5 ${
                item.dispatcherAlert.type === 'critical'
                  ? 'bg-red-50 border border-red-200 text-red-800'
                  : item.dispatcherAlert.type === 'warning'
                  ? 'bg-amber-50 border border-amber-200 text-amber-800'
                  : item.dispatcherAlert.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-blue-50 border border-blue-200 text-blue-800'
              }`}>
                <span className="flex-shrink-0 text-base mt-0.5">
                  {item.dispatcherAlert.type === 'critical' ? '🚨' : item.dispatcherAlert.type === 'warning' ? '⚠️' : item.dispatcherAlert.type === 'success' ? '✅' : 'ℹ️'}
                </span>
                <div>
                  <p className="font-semibold text-xs uppercase tracking-wider mb-0.5">{t('wizard.dispatcherAlert')}</p>
                  <p className="leading-relaxed">{item.dispatcherAlert.text}</p>
                </div>
              </div>
            )}

            {/* Additional note */}
            {(adj.note || adj.warning) && (
              <p className="text-xs text-gray-500 italic">{adj.note || adj.warning}</p>
            )}
          </div>
        </div>
      )}

      {/* General notes */}
      <div className="mt-4 grid sm:grid-cols-2 gap-3">
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-800">
          <strong>{t('wizard.insuranceLabel')}</strong> {generalNotes.insurance}
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-800">
          <strong>{t('wizard.airFreightLabel')}</strong> {generalNotes.airFreight}
        </div>
      </div>
    </section>
  )
}

/* ================================================================
   BLOCK 3 — Mandatory adjustments (art. 71/72 UCC)
   ================================================================ */

function MandatoryAdjustments() {
  const t = useTranslation(valorDict)
  const { cauAdjustments } = useLocalizedData()

  return (
    <section id="ajustes-obligatorios" className="scroll-mt-8">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
        {t('mandatory.title')}
      </h2>
      <p className="text-sm text-gray-600 mb-6" dangerouslySetInnerHTML={{ __html: t('mandatory.desc') }} />

      <div className="grid md:grid-cols-2 gap-5">
        {/* Always add */}
        <div className="bg-white rounded-xl border border-red-200 shadow-sm overflow-hidden">
          <div className="bg-red-50 px-5 py-3 border-b border-red-200">
            <h3 className="text-sm font-bold text-red-800">{t('mandatory.alwaysAddTitle')}</h3>
            <p className="text-[11px] text-red-600">Art. 71 CAU</p>
          </div>
          <div className="p-4 space-y-4">
            {cauAdjustments.alwaysAdd.map((item, i) => (
              <div key={i} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                <div className="flex items-start gap-2">
                  <span className="text-red-400 font-bold text-sm mt-0.5">+</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{item.concept}</p>
                    <p className="text-xs text-gray-400 mb-1">{item.article}</p>
                    <p className="text-xs text-gray-600 leading-relaxed">{item.description}</p>
                    {item.warning && (
                      <p className="text-xs text-amber-700 bg-amber-50 rounded p-2 mt-2">⚠️ {item.warning}</p>
                    )}
                    {item.example && (
                      <p className="text-xs text-blue-700 bg-blue-50 rounded p-2 mt-2">💡 <em>{item.example}</em></p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Never include */}
        <div className="bg-white rounded-xl border border-emerald-200 shadow-sm overflow-hidden">
          <div className="bg-emerald-50 px-5 py-3 border-b border-emerald-200">
            <h3 className="text-sm font-bold text-emerald-800">{t('mandatory.neverIncludeTitle')}</h3>
            <p className="text-[11px] text-emerald-600">Art. 72 CAU</p>
          </div>
          <div className="p-4 space-y-4">
            {cauAdjustments.neverInclude.map((item, i) => (
              <div key={i} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold text-sm mt-0.5">−</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{item.concept}</p>
                    <p className="text-xs text-gray-400 mb-1">{item.article}</p>
                    <p className="text-xs text-gray-600 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ================================================================
   BLOCK 4 — Tariff base vs VAT base + numerical examples
   ================================================================ */

function DutyVsVat() {
  const [activeExample, setActiveExample] = useState('fob')
  const t = useTranslation(valorDict)
  const { numericalExamples, generalNotes, dutyVsVatComparison, locale } = useLocalizedData()
  const example = numericalExamples.find((e) => e.id === activeExample)
  const fmt = (n) => n.toLocaleString(locale === 'en' ? 'en-GB' : 'es-ES')

  return (
    <section id="base-arancel-iva" className="scroll-mt-8">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
        {t('dutyVsVat.title')}
      </h2>
      <p className="text-sm text-gray-600 mb-6" dangerouslySetInnerHTML={{ __html: t('dutyVsVat.desc') }} />

      {/* Two definition cards */}
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="text-sm font-bold text-blue-900 mb-1">{dutyVsVatComparison.dutyBasis.name}</h3>
          <p className="text-xs text-blue-700 font-mono mb-2">{dutyVsVatComparison.dutyBasis.formula}</p>
          <p className="text-[11px] text-blue-600">{dutyVsVatComparison.dutyBasis.legalBasis}</p>
          <p className="text-[11px] text-blue-500 mt-1">{dutyVsVatComparison.dutyBasis.declaration}</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h3 className="text-sm font-bold text-amber-900 mb-1">{dutyVsVatComparison.vatBasis.name}</h3>
          <p className="text-xs text-amber-700 font-mono mb-2">{dutyVsVatComparison.vatBasis.formula}</p>
          <p className="text-[11px] text-amber-600">{dutyVsVatComparison.vatBasis.legalBasis}</p>
          <p className="text-[11px] text-amber-500 mt-1">{dutyVsVatComparison.vatBasis.declaration}</p>
        </div>
      </div>

      {/* Comparative table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">{t('dutyVsVat.concept')}</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-blue-700 w-32">{t('dutyVsVat.dutyBase')}</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-amber-700 w-32">{t('dutyVsVat.vatBase')}</th>
            </tr>
          </thead>
          <tbody>
            {dutyVsVatComparison.comparison.map((row, i) => (
              <tr key={i} className="border-b border-gray-100">
                <td className="px-4 py-2.5 text-sm text-gray-700">{row.concept}</td>
                <td className={`px-4 py-2.5 text-center text-sm font-bold ${row.inDutyBase ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-400'}`}>
                  {row.inDutyBase ? '✅' : '—'}
                </td>
                <td className={`px-4 py-2.5 text-center text-sm font-bold ${row.inVatBase ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-400'}`}>
                  {row.inVatBase ? '✅' : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* First destination note */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-800 mb-6">
        <strong>{t('dutyVsVat.firstDestLabel')}</strong> {generalNotes.firstDestination}
      </div>

      {/* Numerical examples */}
      <h3 className="text-lg font-bold text-gray-900 mb-4">{t('dutyVsVat.examplesTitle')}</h3>

      <div className="flex gap-2 mb-4">
        {numericalExamples.map((ex) => (
          <button
            key={ex.id}
            onClick={() => setActiveExample(ex.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeExample === ex.id
                ? 'bg-[#0A3D5C] text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {ex.incoterm.split(' ')[0]}
          </button>
        ))}
      </div>

      {example && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gray-800 px-5 py-3">
            <p className="text-sm font-bold text-white">{example.title}</p>
            <p className="text-xs text-gray-400">
              {example.product} ({example.hs}) — {example.incoterm} — {t('dutyVsVat.tariff')}: {example.dutyRate} — {locale === 'en' ? 'VAT' : 'IVA'}: {example.vatRate} — {t('dutyVsVat.billOfLading')} {example.cartaPorte}
            </p>
          </div>

          <div className="p-5">
            {/* DDP breakdown */}
            {example.priceBreakdown && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-xs">
                <p className="font-semibold text-amber-800 mb-1">{t('dutyVsVat.invoiceBreakdown')} ({fmt(example.totalInvoice)} EUR):</p>
                {example.priceBreakdown.map((b, i) => (
                  <div key={i} className="flex justify-between text-amber-700">
                    <span>{b.concept}</span>
                    <span className="font-mono">{fmt(b.amount)} EUR</span>
                  </div>
                ))}
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              {/* Step 1: Customs value */}
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold mr-1">1</span>
                  {example.steps.customsValue.label}
                </p>
                {example.steps.customsValue.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm py-0.5">
                    <span className="text-gray-600">{item.sign ? `${item.sign} ` : ''}{item.concept}</span>
                    <span className="font-mono font-semibold text-gray-900">{fmt(Math.abs(item.amount))} EUR</span>
                  </div>
                ))}
                {example.steps.customsValue.note && (
                  <p className="text-[11px] text-gray-400 italic mt-1">{example.steps.customsValue.note}</p>
                )}
                <div className="border-t border-slate-300 mt-2 pt-2 flex justify-between text-sm font-bold">
                  <span className="text-slate-700">{t('dutyVsVat.customsValueLabel')}</span>
                  <span className="text-[#0A3D5C] font-mono">{fmt(example.steps.customsValue.total)} EUR</span>
                </div>
              </div>

              {/* Step 2: Tariff */}
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-2">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-200 text-blue-600 text-[10px] font-bold mr-1">2</span>
                  {t('dutyVsVat.tariff')}
                </p>
                <p className="text-sm text-gray-600">{fmt(example.steps.duty.base)} EUR x {example.dutyRate}</p>
                <p className="text-lg font-bold text-blue-800 mt-2">{fmt(example.steps.duty.amount)} EUR</p>
              </div>

              {/* Step 3: VAT base */}
              <div className="bg-amber-50 rounded-lg p-4">
                <p className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-2">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-200 text-amber-600 text-[10px] font-bold mr-1">3</span>
                  {example.steps.vatBase.label}
                </p>
                {example.steps.vatBase.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm py-0.5">
                    <span className="text-gray-600">{item.sign ? `${item.sign} ` : ''}{item.concept}</span>
                    <span className="font-mono font-semibold text-gray-900">{fmt(item.amount)} EUR</span>
                  </div>
                ))}
                {example.steps.vatBase.note && (
                  <p className="text-[11px] text-gray-400 italic mt-1">{example.steps.vatBase.note}</p>
                )}
                <div className="border-t border-amber-300 mt-2 pt-2 flex justify-between text-sm font-bold">
                  <span className="text-amber-700">{t('dutyVsVat.vatBaseLabel')}</span>
                  <span className="text-amber-900 font-mono">{fmt(example.steps.vatBase.total)} EUR</span>
                </div>
              </div>

              {/* Step 4: Total taxes */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-2">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-200 text-emerald-600 text-[10px] font-bold mr-1">4</span>
                  {t('dutyVsVat.totalTax')}
                </p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('dutyVsVat.vatLabel')} {fmt(example.steps.vat.base)} x {example.vatRate}</span>
                    <span className="font-mono">{fmt(example.steps.vat.amount)} EUR</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('dutyVsVat.tariff')}</span>
                    <span className="font-mono">{fmt(example.steps.duty.amount)} EUR</span>
                  </div>
                </div>
                <div className="border-t border-emerald-300 mt-2 pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-emerald-800">{t('dutyVsVat.total')}</span>
                    <span className="text-xl font-bold text-emerald-900 font-mono">{fmt(example.steps.totalTax)} EUR</span>
                  </div>
                </div>
              </div>
            </div>

            {/* DDP alert: overpayment */}
            {example.wrongDeclaration && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
                <p className="font-bold mb-2">⚠️ {t('dutyVsVat.wrongDeclTitle')} {fmt(example.totalInvoice)} {t('dutyVsVat.wrongDeclSuffix')}</p>
                <div className="grid sm:grid-cols-3 gap-2 text-xs">
                  <div>
                    <p>{t('dutyVsVat.wrongTariff')} {fmt(example.wrongDeclaration.wrongDuty.amount)} EUR</p>
                    <p className="font-bold text-red-900">+{fmt(example.wrongDeclaration.overpayDuty)} EUR {t('dutyVsVat.overpay')}</p>
                  </div>
                  <div>
                    <p>{t('dutyVsVat.wrongVat')} {fmt(example.wrongDeclaration.wrongVat)} EUR</p>
                    <p className="font-bold text-red-900">+{fmt(example.wrongDeclaration.overpayVat)} EUR {t('dutyVsVat.overpay')}</p>
                  </div>
                  <div className="flex items-center">
                    <p className="text-base font-bold text-red-900">{t('dutyVsVat.overpayTotal')} {fmt(example.wrongDeclaration.overpayTotal)} EUR</p>
                  </div>
                </div>
              </div>
            )}

            {/* DUA refs */}
            <div className="mt-3 text-[11px] text-gray-400 space-x-3">
              {example.duaRefs.map((ref, i) => (
                <span key={i}>{ref}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

/* ================================================================
   BLOCK 5 — DV1 and DUA/H1 fields
   ================================================================ */

function DV1AndFields() {
  const t = useTranslation(valorDict)
  const { dv1Info, duaFields } = useLocalizedData()

  return (
    <section id="dv1-casillas" className="scroll-mt-8">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
        {t('dv1.title')}
      </h2>

      {/* DV1 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
        <h3 className="text-base font-bold text-gray-900 mb-3">{t('dv1.whatIsDv1')}</h3>
        <p className="text-sm text-gray-700 mb-3">{dv1Info.definition}</p>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 mb-4">
          <strong>{t('dv1.mandatory')}</strong> {t('dv1.mandatoryText')} {dv1Info.threshold} {t('dv1.mandatoryPerShipment')}{' '}
          {t('dv1.exceptions')} {dv1Info.exceptions.join('; ')}.
        </div>

        <div className="grid sm:grid-cols-3 gap-3 mb-4">
          {dv1Info.sections.map((s, i) => (
            <div key={i} className={`rounded-lg p-3 border ${
              i === 1 ? 'bg-red-50 border-red-200' : i === 2 ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'
            }`}>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">{s.label}</p>
              <p className="text-sm font-semibold text-gray-900 mb-1">{s.title}</p>
              <p className="text-xs text-gray-600">{s.content}</p>
              {s.note && <p className="text-[11px] text-blue-600 mt-1 font-medium">{s.note}</p>}
            </div>
          ))}
        </div>

        {/* Operative formula */}
        <div className="bg-gray-800 rounded-lg p-4">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">{t('dv1.operativeFormula')}</p>
          <p className="text-sm font-mono text-emerald-400 mb-1">{dv1Info.formula}</p>
          <p className="text-xs font-mono text-gray-500">{t('dv1.inDua')} {dv1Info.formulaDUA}</p>
        </div>
      </div>

      {/* Fields table */}
      <h3 className="text-base font-bold text-gray-900 mb-3">{t('dv1.tableTitle')}</h3>
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm mb-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600">{t('dv1.concept')}</th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 whitespace-nowrap">{t('dv1.duaLegacy')}</th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-blue-700 whitespace-nowrap">{t('dv1.h1Current')}</th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 whitespace-nowrap">{t('dv1.eucdmGroup')}</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600">{t('dv1.contents')}</th>
            </tr>
          </thead>
          <tbody>
            {duaFields.map((field, i) => (
              <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-2.5 text-sm font-medium text-gray-800">{field.concept}</td>
                <td className="px-3 py-2.5 text-center text-xs text-gray-500 font-mono">{field.dua}</td>
                <td className="px-3 py-2.5 text-center text-xs text-blue-700 font-mono font-bold">{field.h1}</td>
                <td className="px-3 py-2.5 text-center text-[11px] text-gray-400">{field.group}</td>
                <td className="px-3 py-2.5 text-xs text-gray-600">{field.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400 italic">
        {t('dv1.migrationNote')}
      </p>
    </section>
  )
}

/* ================================================================
   BLOCK 6 — Problematic cases
   ================================================================ */

function ProblematicCases() {
  const [expandedId, setExpandedId] = useState(null)
  const t = useTranslation(valorDict)
  const { problematicCases } = useLocalizedData()

  const severityStyles = {
    critical: 'border-red-200 hover:border-red-300',
    warning: 'border-amber-200 hover:border-amber-300',
    info: 'border-blue-200 hover:border-blue-300',
  }

  return (
    <section id="casos-problematicos" className="scroll-mt-8">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
        {t('cases.title')}
      </h2>
      <p className="text-sm text-gray-600 mb-6">
        {t('cases.desc')}
      </p>

      <div className="space-y-3">
        {problematicCases.map((c) => {
          const isExpanded = expandedId === c.id
          return (
            <div key={c.id} className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-colors ${severityStyles[c.severity]}`}>
              <button
                onClick={() => setExpandedId(isExpanded ? null : c.id)}
                className="w-full px-5 py-4 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{c.icon}</span>
                  <span className="text-sm font-semibold text-gray-900">{c.title}</span>
                </div>
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </button>

              {isExpanded && (
                <div className="px-5 pb-5 space-y-3 animate-fadeIn">
                  <div className="bg-red-50 rounded-lg p-3">
                    <p className="text-xs font-bold text-red-700 uppercase tracking-wider mb-1">{t('cases.problem')}</p>
                    <p className="text-sm text-red-800">{c.problem}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{t('cases.why')}</p>
                    <p className="text-sm text-gray-700">{c.why}</p>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-3">
                    <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">{t('cases.solution')}</p>
                    <p className="text-sm text-emerald-800">{c.solution}</p>
                  </div>
                  <p className="text-xs text-gray-400">{t('cases.reference')} {c.reference}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

/* ================================================================
   CROSS-LINKS
   ================================================================ */

function CrossLinks() {
  const t = useTranslation(valorDict)

  return (
    <div className="grid sm:grid-cols-3 gap-4">
      <Link href="/incoterms" className="group bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md hover:border-blue-300 transition-all">
        <span className="text-2xl mb-2 block">📦</span>
        <p className="text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{t('crossLinks.incoterms')}</p>
        <p className="text-xs text-gray-500 mt-1">{t('crossLinks.incotermsDesc')}</p>
      </Link>
      <Link href="/calculadora" className="group bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md hover:border-blue-300 transition-all">
        <span className="text-2xl mb-2 block">🧮</span>
        <p className="text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{t('crossLinks.calculator')}</p>
        <p className="text-xs text-gray-500 mt-1">{t('crossLinks.calculatorDesc')}</p>
      </Link>
      <Link href="/cbam/assessment" className="group bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md hover:border-blue-300 transition-all">
        <span className="text-2xl mb-2 block">🌍</span>
        <p className="text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{t('crossLinks.cbam')}</p>
        <p className="text-xs text-gray-500 mt-1">{t('crossLinks.cbamDesc')}</p>
      </Link>
    </div>
  )
}

/* ================================================================
   MAIN PAGE
   ================================================================ */

export default function ValorEnAduanaPage() {
  const t = useTranslation(valorDict)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#0A3D5C] py-14 md:py-18">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHptMCAyYzguODM3IDAgMTYgNy4xNjMgMTYgMTZzLTcuMTYzIDE2LTE2IDE2LTE2LTcuMTYzLTE2LTE2IDcuMTYzLTE2IDE2LTE2eiIgZmlsbD0iI2ZmZiIgZmlsbC1vcGFjaXR5PSIuMDIiLz48L2c+PC9zdmc+')] opacity-30"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <span className="inline-block px-4 py-1.5 bg-white/10 border border-white/10 text-white/70 rounded-full text-sm font-medium mb-5">
            {t('hero.badge')}
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight tracking-tight">
            {t('hero.titleMain')}{' '}
            <span className="text-[#F4C542]">{t('hero.titleHighlight')}</span>
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto mb-8 leading-relaxed">
            {t('hero.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="#ajustes-incoterm"
              className="px-7 py-3 bg-[#F4C542] text-[#0A3D5C] font-bold rounded-xl transition-all hover:bg-[#F4C542]/90 text-sm"
            >
              {t('hero.ctaPrimary')}
            </a>
            <a
              href="#casos-problematicos"
              className="px-7 py-3 bg-white/10 border border-white/20 hover:bg-white/20 text-white rounded-xl transition-all text-sm"
            >
              {t('hero.ctaSecondary')}
            </a>
          </div>
        </div>
      </section>

      {/* Main content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-14">
        <MiniTOC />
        <ValuationMethods />
        <IncotermWizard />
        <MandatoryAdjustments />
        <DutyVsVat />
        <DV1AndFields />
        <ProblematicCases />
        <CrossLinks />
      </div>
    </div>
  )
}
