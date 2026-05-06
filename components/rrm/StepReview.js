'use client'

import { useMemo, useState } from 'react'
import { useTranslation } from '@/lib/i18n'
import { rrmDict } from '@/lib/i18n/rrm'
import { DUTY_CODES, SPANISH_CUSTOMS_OFFICES, IBAN_REGEX } from '@/lib/rrmData'

const inputCls =
  'w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:border-[#0A3D5C] focus:ring-1 focus:ring-[#0A3D5C]'
const labelCls = 'block text-sm font-medium text-slate-700 mb-1'

function fmt(n) {
  if (n == null || Number.isNaN(Number(n))) return '0,00'
  return Number(n).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function itemDiff(item) {
  const codes = Array.from(new Set([
    ...Object.keys(item.dutiesDeclared || {}),
    ...Object.keys(item.dutiesCorrected || {}),
  ]))
  return codes.reduce((acc, c) => {
    const decl = Number(item.dutiesDeclared?.[c] || 0)
    const corr = Number(item.dutiesCorrected?.[c] || 0)
    return acc + (decl - corr)
  }, 0)
}

export default function StepReview({ state, setState }) {
  const t = useTranslation(rrmDict)
  const isRep = state.requestType === 'REP'

  // effectiveItems: si hay selección multi-partida → usar selectedItems.
  // Si no (1 partida XML o flujo manual sin XML) → construir un único item
  // virtual desde los campos planos del state legacy.
  const effectiveItems = useMemo(() => {
    if (state.selectedItems && state.selectedItems.length > 0) return state.selectedItems
    return [
      {
        sequenceNumber: 1,
        taricCode: state.commodityCode || '',
        description: state.goodsDescription || '',
        originCountry: state.countryOfOrigin || '',
        preference: state.preferenceDeclared || '',
        netMass: state.netMass || null,
        statisticalValue: state.customsValue ?? null,
        dutiesDeclared: state.dutiesDeclared || {},
        dutiesCorrected: state.dutiesCorrected || {},
      },
    ]
  }, [
    state.selectedItems,
    state.commodityCode,
    state.goodsDescription,
    state.countryOfOrigin,
    state.preferenceDeclared,
    state.netMass,
    state.customsValue,
    state.dutiesDeclared,
    state.dutiesCorrected,
  ])

  const useSelectedItems = (state.selectedItems && state.selectedItems.length > 0) || false

  // Total general (suma de diferencias por partida)
  const totalDiff = useMemo(() => effectiveItems.reduce((acc, it) => acc + itemDiff(it), 0), [effectiveItems])

  // Por defecto: si N <= 4 todos expandidos, si N >= 5 sólo los 2 primeros.
  const [expandedItems, setExpandedItems] = useState(() => {
    const n = effectiveItems.length
    if (n <= 4) return new Set(effectiveItems.map((_, i) => i))
    return new Set([0, 1])
  })
  const toggleExpanded = (idx) => {
    setExpandedItems((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }
  const expandAll = () => setExpandedItems(new Set(effectiveItems.map((_, i) => i)))
  const collapseAll = () => setExpandedItems(new Set())

  // Mutadores: modo multi-partida → escriben en selectedItems[idx]; modo
  // legacy → escriben en state.dutiesDeclared/dutiesCorrected planos.
  const setDeclared = (itemIdx, code, v) => {
    if (useSelectedItems) {
      setState((prev) => {
        const items = prev.selectedItems.slice()
        items[itemIdx] = {
          ...items[itemIdx],
          dutiesDeclared: { ...(items[itemIdx].dutiesDeclared || {}), [code]: Number(v) || 0 },
        }
        return { ...prev, selectedItems: items }
      })
    } else {
      setState((prev) => ({
        ...prev,
        dutiesDeclared: { ...(prev.dutiesDeclared || {}), [code]: Number(v) || 0 },
      }))
    }
  }
  const setCorrected = (itemIdx, code, v) => {
    if (useSelectedItems) {
      setState((prev) => {
        const items = prev.selectedItems.slice()
        items[itemIdx] = {
          ...items[itemIdx],
          dutiesCorrected: { ...(items[itemIdx].dutiesCorrected || {}), [code]: Number(v) || 0 },
        }
        return { ...prev, selectedItems: items }
      })
    } else {
      setState((prev) => ({
        ...prev,
        dutiesCorrected: { ...(prev.dutiesCorrected || {}), [code]: Number(v) || 0 },
      }))
    }
  }
  const addDuty = (itemIdx) => {
    const code = prompt('Código de tributo (ej: A00, B00, A30):')
    if (!code) return
    const c = code.toUpperCase()
    if (useSelectedItems) {
      setState((prev) => {
        const items = prev.selectedItems.slice()
        items[itemIdx] = {
          ...items[itemIdx],
          dutiesDeclared: { ...(items[itemIdx].dutiesDeclared || {}), [c]: 0 },
          dutiesCorrected: { ...(items[itemIdx].dutiesCorrected || {}), [c]: 0 },
        }
        return { ...prev, selectedItems: items }
      })
    } else {
      setState((prev) => ({
        ...prev,
        dutiesDeclared: { ...(prev.dutiesDeclared || {}), [c]: 0 },
        dutiesCorrected: { ...(prev.dutiesCorrected || {}), [c]: 0 },
      }))
    }
  }

  const ibanInvalid = isRep && state.bank?.iban && !IBAN_REGEX.test(state.bank.iban.replace(/\s/g, ''))

  return (
    <div>
      <h2 className="text-2xl font-semibold text-slate-900 mb-2">{t('review.title')}</h2>
      <p className="text-slate-600 leading-relaxed mb-6">{t('review.subtitle')}</p>

      {/* Sub-bloques por partida (colapsables) */}
      {effectiveItems.length > 1 && (
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-slate-900 font-semibold">{t('review.itemsLiquidation')}</h3>
          <div className="flex gap-4 text-sm">
            <button type="button" onClick={expandAll} className="text-[#0A3D5C] hover:underline">
              {t('review.expandAll')}
            </button>
            <button type="button" onClick={collapseAll} className="text-[#0A3D5C] hover:underline">
              {t('review.collapseAll')}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3 mb-6">
        {effectiveItems.map((item, idx) => {
          const codes = Array.from(new Set([
            ...Object.keys(item.dutiesDeclared || {}),
            ...Object.keys(item.dutiesCorrected || {}),
          ]))
          const diff = itemDiff(item)
          const expanded = expandedItems.has(idx)
          return (
            <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => toggleExpanded(idx)}
                className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-slate-100 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-slate-900 font-semibold">
                    {t('review.itemBlockTitle').replace('{n}', item.sequenceNumber || idx + 1)}
                    {item.taricCode && (
                      <> — <span className="font-mono text-[#0A3D5C]">{item.taricCode}</span></>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 truncate mt-0.5">
                    {item.description || '—'}
                    {item.originCountry ? ` · ${item.originCountry}` : ''}
                    {item.preference ? ` · Pref. ${item.preference}` : ''}
                  </div>
                </div>
                <div className={`text-sm font-mono shrink-0 ${diff > 0 ? 'text-emerald-700' : diff < 0 ? 'text-red-700' : 'text-slate-500'}`}>
                  {fmt(diff)} €
                </div>
                <svg
                  className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${expanded ? 'rotate-90' : ''}`}
                  fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </button>

              {expanded && (
                <div className="px-5 pb-5 border-t border-slate-200 pt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-slate-600 border-b border-slate-200">
                        <th className="text-left py-2 px-2">Tributo</th>
                        <th className="text-right py-2 px-2 bg-red-50">{t('review.declared')} (€)</th>
                        <th className="text-right py-2 px-2 bg-emerald-50">{t('review.correct')} (€)</th>
                        <th className="text-right py-2 px-2">{t('review.diff')} (€)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {codes.map((code) => {
                        const decl = Number(item.dutiesDeclared?.[code] || 0)
                        const corr = Number(item.dutiesCorrected?.[code] || 0)
                        const d = decl - corr
                        return (
                          <tr key={code} className="border-b border-slate-100">
                            <td className="py-2 px-2 text-slate-900">
                              <div className="font-mono">{code}</div>
                              <div className="text-xs text-slate-500">{DUTY_CODES[code] || ''}</div>
                            </td>
                            <td className="py-1 px-2 bg-red-50/50">
                              <input
                                type="number"
                                step="0.01"
                                value={decl}
                                onChange={(e) => setDeclared(idx, code, e.target.value)}
                                className={`${inputCls} text-right`}
                              />
                            </td>
                            <td className="py-1 px-2 bg-emerald-50/50">
                              <input
                                type="number"
                                step="0.01"
                                value={corr}
                                onChange={(e) => setCorrected(idx, code, e.target.value)}
                                className={`${inputCls} text-right`}
                              />
                            </td>
                            <td className={`py-2 px-2 text-right font-mono ${d > 0 ? 'text-emerald-700' : d < 0 ? 'text-red-700' : 'text-slate-500'}`}>
                              {fmt(d)}
                            </td>
                          </tr>
                        )
                      })}
                      <tr>
                        <td colSpan={4} className="py-2 px-2">
                          <button
                            onClick={() => addDuty(idx)}
                            type="button"
                            className="text-xs text-[#0A3D5C] font-medium hover:underline"
                          >
                            + {t('review.addDuty')}
                          </button>
                        </td>
                      </tr>
                      <tr className="border-t border-slate-200">
                        <td colSpan={3} className="py-2 px-2 text-right text-sm font-semibold text-slate-700">
                          {t('review.itemTotalDiff')}
                        </td>
                        <td className={`py-2 px-2 text-right font-mono font-bold ${diff > 0 ? 'text-emerald-700' : diff < 0 ? 'text-red-700' : 'text-slate-500'}`}>
                          {fmt(diff)} €
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Total general */}
      <div className="bg-amber-50 border-2 border-[#F4C542] rounded-xl px-5 py-4 mb-6 flex items-center justify-between">
        <span className="font-semibold text-slate-900">
          {effectiveItems.length > 1 ? t('review.generalTotal') : t('review.total')}
        </span>
        <span className="font-mono font-bold text-xl text-[#0A3D5C]">{fmt(totalDiff)} €</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Motivos */}
        <div className="lg:col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-5">
          <label className={labelCls}>{t('review.motivos')}</label>
          <textarea
            rows={5}
            value={state.motivosText || ''}
            onChange={(e) => setState({ ...state, motivosText: e.target.value })}
            className={`${inputCls} font-mono`}
            placeholder={t('review.motivosHelp')}
          />
          <p className="text-xs text-slate-500 mt-1">{t('review.motivosHelp')}</p>
          <p className="text-sm text-slate-500 italic mt-2">{t('motivation.placeholderHelp')}</p>
        </div>

        {/* Contacto */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
          <h3 className="text-slate-900 font-semibold mb-3">{t('review.contact')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>{t('review.contactName')}</label>
              <input className={inputCls} value={state.contact?.name || ''} onChange={(e) => setState({ ...state, contact: { ...state.contact, name: e.target.value } })} />
            </div>
            <div>
              <label className={labelCls}>{t('review.contactRole')}</label>
              <input className={inputCls} value={state.contact?.role || ''} onChange={(e) => setState({ ...state, contact: { ...state.contact, role: e.target.value } })} />
            </div>
            <div>
              <label className={labelCls}>{t('review.contactEmail')}</label>
              <input type="email" className={inputCls} value={state.contact?.email || ''} onChange={(e) => setState({ ...state, contact: { ...state.contact, email: e.target.value } })} />
            </div>
            <div>
              <label className={labelCls}>{t('review.contactPhone')}</label>
              <input className={inputCls} value={state.contact?.phone || ''} onChange={(e) => setState({ ...state, contact: { ...state.contact, phone: e.target.value } })} />
            </div>
          </div>
        </div>

        {/* Ubicación / Aduanas */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
          <h3 className="text-slate-900 font-semibold mb-3">Ubicación y aduanas</h3>
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className={labelCls}>{t('review.location')}</label>
              <input className={inputCls} value={state.goodsLocation || ''} onChange={(e) => setState({ ...state, goodsLocation: e.target.value })} placeholder="Almacén del cliente / dirección" />
            </div>
            <div>
              <label className={labelCls}>{t('review.customsCompetent')}</label>
              <select className={inputCls} value={state.customsCompetent || ''} onChange={(e) => setState({ ...state, customsCompetent: e.target.value })}>
                <option value="">— {t('review.customsCompetentHelp')} —</option>
                {SPANISH_CUSTOMS_OFFICES.map((o) => (
                  <option key={o.code} value={o.code}>{o.code} — {o.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>{t('review.useDestination')}</label>
              <input className={inputCls} value={state.useDestination || ''} onChange={(e) => setState({ ...state, useDestination: e.target.value })} placeholder="EMPAQUETADO" />
            </div>
            <div>
              <label className={labelCls}>{t('review.additionalInfo')}</label>
              <input className={inputCls} value={state.additionalInfo || ''} onChange={(e) => setState({ ...state, additionalInfo: e.target.value })} />
            </div>
          </div>
        </div>

        {/* Banco */}
        <div className="lg:col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-slate-900 font-semibold">{t('review.bank')}</h3>
            <span className={`text-xs font-medium ${isRep ? 'text-[#0A3D5C]' : 'text-slate-500'}`}>
              {isRep ? t('review.bankRequired') : t('common.optional')}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>{t('review.bankHolder')}</label>
              <input className={inputCls} value={state.bank?.holder || ''} onChange={(e) => setState({ ...state, bank: { ...state.bank, holder: e.target.value } })} />
            </div>
            <div>
              <label className={labelCls}>{t('review.bankIban')}</label>
              <input className={inputCls} value={state.bank?.iban || ''} onChange={(e) => setState({ ...state, bank: { ...state.bank, iban: e.target.value } })} placeholder="ES00 0000 0000 00 0000000000" />
              {ibanInvalid && <p className="text-xs text-orange-700 mt-1">Formato IBAN no válido</p>}
            </div>
            <div>
              <label className={labelCls}>{t('review.bankBic')}</label>
              <input className={inputCls} value={state.bank?.bic || ''} onChange={(e) => setState({ ...state, bank: { ...state.bank, bic: e.target.value } })} />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2">🔒 {t('review.bankWarning')}</p>
        </div>
      </div>
    </div>
  )
}
