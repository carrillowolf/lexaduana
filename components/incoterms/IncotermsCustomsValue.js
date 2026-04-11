'use client'

import Link from 'next/link'
import {
  INCOTERMS_2020,
  DUA_H1_FIELDS,
  VAT_BASE_IMPACT,
  CAU_ADJUSTMENTS,
} from '@/lib/incotermsData'
import { useTranslation } from '@/lib/i18n'
import { incotermsDict } from '@/lib/i18n/incoterms'

// ── 1. Tabla de ajustes al valor en aduana por Incoterm ──────

function AdjustmentsTable({ t }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">📋</span>
        <h3 className="text-xl font-bold text-gray-900">{t('customs.adjustments.title')}</h3>
      </div>
      <p className="text-sm text-gray-600 mb-4" dangerouslySetInnerHTML={{ __html: t('customs.adjustments.subtitle') }} />

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 w-[100px]">Incoterm</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-red-700">
                <span className="flex items-center gap-1">{t('customs.adjustments.addHeader')}</span>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-700">
                <span className="flex items-center gap-1">{t('customs.adjustments.deductHeader')}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {INCOTERMS_2020.map((item) => {
              const adj = item.customsValueAdjustments
              const hasAdd = adj.addToCustomsValue.length > 0
              const hasDeduct = adj.deductFromCustomsValue.length > 0
              return (
                <tr key={item.code} className="border-b border-gray-100 hover:bg-gray-50/50">
                  <td className="px-4 py-3 align-top">
                    <span className="text-sm font-bold text-[#0A3D5C]">{item.code}</span>
                  </td>
                  <td className={`px-4 py-3 align-top ${hasAdd ? 'bg-red-50/40' : 'bg-gray-50/30'}`}>
                    {hasAdd ? (
                      <ul className="space-y-1">
                        {adj.addToCustomsValue.map((a, i) => (
                          <li key={i} className="text-sm text-gray-800">
                            <span className="text-red-600 font-medium">+</span> {a.concept}
                            {!a.mandatory && <span className="text-gray-400 text-xs ml-1">({t('customs.adjustments.ifApplies')})</span>}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-gray-400 text-sm">—</span>
                    )}
                  </td>
                  <td className={`px-4 py-3 align-top ${hasDeduct ? 'bg-emerald-50/40' : 'bg-gray-50/30'}`}>
                    {hasDeduct ? (
                      <ul className="space-y-1">
                        {adj.deductFromCustomsValue.map((d, i) => (
                          <li key={i} className="text-sm text-gray-800">
                            <span className="text-emerald-600 font-medium">−</span> {d.concept}
                            {d.condition && <span className="text-gray-400 text-xs ml-1">({d.condition})</span>}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-gray-400 text-sm">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {INCOTERMS_2020.map((item) => {
          const adj = item.customsValueAdjustments
          const hasAdd = adj.addToCustomsValue.length > 0
          const hasDeduct = adj.deductFromCustomsValue.length > 0
          return (
            <div key={item.code} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-base font-bold text-[#0A3D5C]">{item.code}</span>
                <span className="text-xs text-gray-400">{item.nameEs}</span>
              </div>
              {hasAdd && (
                <div className="mb-2">
                  <p className="text-[10px] font-semibold text-red-700 uppercase tracking-wider mb-1">{t('customs.adjustments.addMobile')}</p>
                  <ul className="space-y-0.5">
                    {adj.addToCustomsValue.map((a, i) => (
                      <li key={i} className="text-xs text-gray-700 bg-red-50/50 rounded px-2 py-1">
                        {a.concept}{!a.mandatory && <span className="text-gray-400"> ({t('customs.adjustments.ifApplies')})</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {hasDeduct && (
                <div>
                  <p className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider mb-1">{t('customs.adjustments.deductMobile')}</p>
                  <ul className="space-y-0.5">
                    {adj.deductFromCustomsValue.map((d, i) => (
                      <li key={i} className="text-xs text-gray-700 bg-emerald-50/50 rounded px-2 py-1">
                        {d.concept}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {!hasAdd && !hasDeduct && (
                <p className="text-xs text-gray-400">{t('customs.adjustments.noAdjustments')}</p>
              )}
              <p className="text-[10px] text-gray-400 mt-2 border-t border-gray-100 pt-2">{adj.legalBasis}</p>
            </div>
          )
        })}
      </div>

      <p className="text-xs text-gray-500 mt-3">
        <strong>Base legal:</strong> {t('customs.adjustments.legalBasis')}
      </p>
    </div>
  )
}

// ── 2. Base arancel vs Base IVA ──────────────────────────────

function DutyVsVatBase({ t }) {
  return (
    <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4 border-b border-amber-200">
        <h3 className="text-lg font-bold text-amber-900 flex items-center gap-2">
          <span>⚠️</span> {t('customs.dutyVsVat.title')}
        </h3>
      </div>
      <div className="p-6 space-y-4">
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="font-bold text-blue-900 mb-1">{t('customs.dutyVsVat.dutyLabel')}</p>
            <p className="text-blue-800" dangerouslySetInnerHTML={{ __html: t('customs.dutyVsVat.dutyDesc') }} />
            <p className="text-xs text-blue-600 mt-1">{t('customs.dutyVsVat.dutyRef')}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <p className="font-bold text-purple-900 mb-1">{t('customs.dutyVsVat.vatLabel')}</p>
            <p className="text-purple-800" dangerouslySetInnerHTML={{ __html: t('customs.dutyVsVat.vatDesc') }} />
            <p className="text-xs text-purple-600 mt-1">{t('customs.dutyVsVat.vatRef')}</p>
          </div>
        </div>

        <p className="text-sm text-gray-600">{t('customs.dutyVsVat.firstPlace')}</p>

        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600">{t('customs.dutyVsVat.concept')}</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-blue-700 whitespace-nowrap">{t('customs.dutyVsVat.dutyBase')}</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-purple-700 whitespace-nowrap">{t('customs.dutyVsVat.vatBase')}</th>
              </tr>
            </thead>
            <tbody>
              {VAT_BASE_IMPACT.comparison.map((row, i) => (
                <tr key={i} className="border-t border-gray-100">
                  <td className="px-4 py-2 text-sm text-gray-800">{row.concept}</td>
                  <td className="px-3 py-2 text-center">
                    {row.inDutyBase
                      ? <span className="text-emerald-600 font-bold">{t('customs.dutyVsVat.yes')}</span>
                      : <span className="text-red-400 font-medium">{t('customs.dutyVsVat.no')}</span>
                    }
                  </td>
                  <td className="px-3 py-2 text-center">
                    {row.inVatBase
                      ? <span className="text-emerald-600 font-bold">{t('customs.dutyVsVat.yes')}</span>
                      : <span className="text-red-400 font-medium">{t('customs.dutyVsVat.no')}</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-gray-500">
          <strong>References:</strong> {t('customs.dutyVsVat.references')}
        </p>
      </div>
    </div>
  )
}

// ── 3. Tabla DUA / H1 ────────────────────────────────────────

function DuaH1Table({ t }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">📄</span>
        <h3 className="text-xl font-bold text-gray-900">{t('customs.dua.title')}</h3>
      </div>
      <p className="text-sm text-gray-600 mb-4">{t('customs.dua.subtitle')}</p>

      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">{t('customs.dua.concept')}</th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 whitespace-nowrap">{t('customs.dua.duaOld')}</th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-[#0A3D5C] whitespace-nowrap">{t('customs.dua.h1Current')}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 hidden sm:table-cell">{t('customs.dua.contains')}</th>
            </tr>
          </thead>
          <tbody>
            {DUA_H1_FIELDS.map((field, i) => (
              <tr key={i} className="border-t border-gray-100 hover:bg-gray-50/50">
                <td className="px-4 py-2.5 text-sm font-medium text-gray-800">{field.concept}</td>
                <td className="px-3 py-2.5 text-center text-sm text-gray-500 font-mono">{field.dua}</td>
                <td className="px-3 py-2.5 text-center text-sm text-[#0A3D5C] font-mono font-semibold">{field.h1}</td>
                <td className="px-4 py-2.5 text-sm text-gray-600 hidden sm:table-cell">{field.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-gray-50 rounded-lg p-3 mt-3 text-xs text-gray-500">
        <strong>Note:</strong> {t('customs.dua.note')}
      </div>
    </div>
  )
}

// ── 4. Ejemplo numérico completo ─────────────────────────────

function NumericalExample({ t }) {
  return (
    <div className="bg-gradient-to-br from-[#0A3D5C] via-[#0D5A8A] to-[#1A6FA0] rounded-2xl overflow-hidden shadow-lg">
      <div className="p-6 md:p-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">🔢</span>
          <h3 className="text-xl font-bold text-white">{t('customs.example.title')}</h3>
        </div>
        <p className="text-blue-200 text-sm mb-6">{t('customs.example.subtitle')}</p>

        <div className="grid md:grid-cols-2 gap-5">
          {/* PASO 1 */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/10">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-7 h-7 rounded-full bg-white/20 text-white flex items-center justify-center text-xs font-bold">1</span>
              <h4 className="text-sm font-bold text-white">{t('customs.example.step1Title')}</h4>
            </div>
            <div className="space-y-1.5 text-sm font-mono">
              <div className="flex justify-between text-blue-100">
                <span>{t('customs.example.priceFob')}</span>
                <span>45.000 EUR</span>
              </div>
              <div className="flex justify-between text-red-300">
                <span>{t('customs.example.freightMaritime')}</span>
                <span>4.500 EUR</span>
              </div>
              <div className="flex justify-between text-red-300">
                <span>{t('customs.example.internationalInsurance')}</span>
                <span>500 EUR</span>
              </div>
              <div className="flex justify-between text-white font-bold border-t border-white/20 pt-1.5 mt-1.5">
                <span>{t('customs.example.customsValueResult')}</span>
                <span>50.000 EUR</span>
              </div>
            </div>
            <div className="mt-3 space-y-1 text-xs text-blue-200">
              <p>Cas. 14 01 (H1) / cas. 42 (DUA): 45.000 EUR</p>
              <p>Cas. 14 07 (H1) / cas. 45 (DUA): +5.000 EUR</p>
              <p>Cas. 14 06 (H1) / cas. 46 (DUA): 50.000 EUR</p>
            </div>
          </div>

          {/* PASO 2 */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/10">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-7 h-7 rounded-full bg-white/20 text-white flex items-center justify-center text-xs font-bold">2</span>
              <h4 className="text-sm font-bold text-white">{t('customs.example.step2Title')}</h4>
            </div>
            <div className="space-y-1.5 text-sm font-mono">
              <div className="flex justify-between text-blue-100">
                <span>50.000 EUR × 3,7%</span>
                <span className="text-white font-bold">= 1.850 EUR</span>
              </div>
            </div>
            <p className="text-xs text-blue-200 mt-3">Cas. 14 03 A00 (H1) / cas. 47 A00 (DUA)</p>
          </div>

          {/* PASO 3 */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/10">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-7 h-7 rounded-full bg-amber-400/30 text-amber-200 flex items-center justify-center text-xs font-bold">3</span>
              <h4 className="text-sm font-bold text-amber-200">{t('customs.example.step3Title')}</h4>
            </div>
            <div className="space-y-1.5 text-sm font-mono">
              <div className="flex justify-between text-blue-100">
                <span>{t('customs.example.customsValue')}</span>
                <span>50.000 EUR</span>
              </div>
              <div className="flex justify-between text-amber-300">
                <span>{t('customs.example.duties')}</span>
                <span>1.850 EUR</span>
              </div>
              <div className="flex justify-between text-amber-300">
                <span>{t('customs.example.inlandTransport')}</span>
                <span>800 EUR</span>
              </div>
              <div className="flex justify-between text-amber-300">
                <span>{t('customs.example.inlandInsurance')}</span>
                <span>50 EUR</span>
              </div>
              <div className="flex justify-between text-white font-bold border-t border-white/20 pt-1.5 mt-1.5">
                <span>{t('customs.example.vatBaseResult')}</span>
                <span>52.700 EUR</span>
              </div>
            </div>
            <p className="text-xs text-blue-200 mt-3">Cas. 14 03 B00 (H1) / cas. 47 B00 (DUA)</p>
          </div>

          {/* PASO 4 — Total */}
          <div className="bg-white rounded-xl p-5 shadow-lg">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-7 h-7 rounded-full bg-[#0A3D5C] text-white flex items-center justify-center text-xs font-bold">4</span>
              <h4 className="text-sm font-bold text-gray-900">{t('customs.example.step4Title')}</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">{t('customs.example.vatCalc')}</span>
                <span className="font-semibold text-gray-900">11.067 EUR</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2">
                <span className="text-gray-600">{t('customs.example.dutyLine')}</span>
                <span className="font-semibold">1.850 EUR</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('customs.example.vatImport')}</span>
                <span className="font-semibold">11.067 EUR</span>
              </div>
              <div className="flex justify-between bg-[#0A3D5C] text-white rounded-lg px-3 py-2 mt-2">
                <span className="font-bold">{t('customs.example.total')}</span>
                <span className="font-bold text-lg">12.917 EUR</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── 5. Otros ajustes CAU (art. 71/72) ────────────────────────

function OtherAdjustments({ t }) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl border border-red-200 shadow-sm overflow-hidden">
        <div className="bg-red-50 px-5 py-3 border-b border-red-200">
          <h4 className="text-sm font-bold text-red-800 flex items-center gap-2">
            <span>+</span> {t('customs.otherAdjustments.alwaysAdd')}
          </h4>
        </div>
        <div className="p-5 space-y-3">
          {CAU_ADJUSTMENTS.alwaysAdd.map((item, i) => (
            <div key={i} className="border-b border-gray-100 last:border-0 pb-2 last:pb-0">
              <p className="text-sm font-medium text-gray-900">{item.concept}</p>
              <p className="text-xs text-gray-500 mt-0.5">{item.note}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{item.article}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-emerald-200 shadow-sm overflow-hidden">
        <div className="bg-emerald-50 px-5 py-3 border-b border-emerald-200">
          <h4 className="text-sm font-bold text-emerald-800 flex items-center gap-2">
            <span>−</span> {t('customs.otherAdjustments.neverInclude')}
          </h4>
        </div>
        <div className="p-5 space-y-3">
          {CAU_ADJUSTMENTS.neverInclude.map((item, i) => (
            <div key={i} className="border-b border-gray-100 last:border-0 pb-2 last:pb-0">
              <p className="text-sm font-medium text-gray-900">{item.concept}</p>
              {item.note && <p className="text-xs text-gray-500 mt-0.5">{item.note}</p>}
              <p className="text-[10px] text-gray-400 mt-0.5">{item.article}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── 6. CTA a valor en aduana ─────────────────────────────────

function CustomsValueCTA({ t }) {
  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6 flex flex-col sm:flex-row items-center gap-4">
      <div className="flex-1">
        <p className="text-sm font-bold text-amber-900 mb-1">{t('customs.cta.title')}</p>
        <p className="text-sm text-amber-700">{t('customs.cta.subtitle')}</p>
      </div>
      <Link
        href="/valor-en-aduana"
        className="flex-shrink-0 px-5 py-2.5 bg-[#0A3D5C] text-white font-semibold rounded-lg text-sm hover:bg-[#0D5A8A] transition-colors"
      >
        {t('customs.cta.button')}
      </Link>
    </div>
  )
}

// ── Componente principal ─────────────────────────────────────

export default function IncotermsCustomsValue() {
  const t = useTranslation(incotermsDict)

  return (
    <section id="valor-aduana" className="space-y-12">
      <div className="text-center mb-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
          {t('customs.title')}
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto text-sm">
          {t('customs.subtitle')}
        </p>
      </div>

      <AdjustmentsTable t={t} />
      <DutyVsVatBase t={t} />
      <DuaH1Table t={t} />
      <NumericalExample t={t} />

      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">📚</span>
          <h3 className="text-xl font-bold text-gray-900">{t('customs.otherAdjustments.title')}</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">{t('customs.otherAdjustments.subtitle')}</p>
        <OtherAdjustments t={t} />
      </div>

      <CustomsValueCTA t={t} />
    </section>
  )
}
