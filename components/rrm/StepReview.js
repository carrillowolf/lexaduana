'use client'

import { useMemo } from 'react'
import { useTranslation } from '@/lib/i18n'
import { rrmDict } from '@/lib/i18n/rrm'
import { DUTY_CODES, SPANISH_CUSTOMS_OFFICES, IBAN_REGEX } from '@/lib/rrmData'

const inputCls =
  'w-full bg-[#0d1f35] border border-[#1a2d4a] rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-[#F4C542]'
const labelCls = 'block text-xs text-gray-400 mb-1'

function fmt(n) {
  if (n == null || Number.isNaN(Number(n))) return '0,00'
  return Number(n).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function StepReview({ state, setState }) {
  const t = useTranslation(rrmDict)
  const isRep = state.requestType === 'REP'

  const allCodes = useMemo(() => {
    return Array.from(new Set([
      ...Object.keys(state.dutiesDeclared || {}),
      ...Object.keys(state.dutiesCorrected || {}),
    ]))
  }, [state.dutiesDeclared, state.dutiesCorrected])

  const totalDiff = useMemo(() => {
    return allCodes.reduce((acc, code) => {
      const decl = Number(state.dutiesDeclared?.[code] || 0)
      const corr = Number(state.dutiesCorrected?.[code] || 0)
      return acc + (decl - corr)
    }, 0)
  }, [allCodes, state.dutiesDeclared, state.dutiesCorrected])

  const setDeclared = (code, v) => {
    setState({
      ...state,
      dutiesDeclared: { ...(state.dutiesDeclared || {}), [code]: Number(v) || 0 },
    })
  }
  const setCorrected = (code, v) => {
    setState({
      ...state,
      dutiesCorrected: { ...(state.dutiesCorrected || {}), [code]: Number(v) || 0 },
    })
  }
  const addDuty = () => {
    const code = prompt('Código de tributo (ej: A00, B00, A30):')
    if (!code) return
    const c = code.toUpperCase()
    setState({
      ...state,
      dutiesDeclared: { ...(state.dutiesDeclared || {}), [c]: 0 },
      dutiesCorrected: { ...(state.dutiesCorrected || {}), [c]: 0 },
    })
  }

  const ibanInvalid = isRep && state.bank?.iban && !IBAN_REGEX.test(state.bank.iban.replace(/\s/g, ''))

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">{t('review.title')}</h2>
      <p className="text-gray-400 mb-6">{t('review.subtitle')}</p>

      {/* Tabla comparativa */}
      <div className="bg-[#0a1628] border border-[#1a2d4a] rounded-lg p-4 mb-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 border-b border-[#1a2d4a]">
              <th className="text-left py-2 px-2">Tributo</th>
              <th className="text-right py-2 px-2 bg-red-950/30">{t('review.declared')} (€)</th>
              <th className="text-right py-2 px-2 bg-green-950/30">{t('review.correct')} (€)</th>
              <th className="text-right py-2 px-2">{t('review.diff')} (€)</th>
            </tr>
          </thead>
          <tbody>
            {allCodes.map((code) => {
              const decl = Number(state.dutiesDeclared?.[code] || 0)
              const corr = Number(state.dutiesCorrected?.[code] || 0)
              const diff = decl - corr
              return (
                <tr key={code} className="border-b border-[#1a2d4a]/50">
                  <td className="py-2 px-2 text-white">
                    <div className="font-mono">{code}</div>
                    <div className="text-xs text-gray-500">{DUTY_CODES[code] || ''}</div>
                  </td>
                  <td className="py-1 px-2 bg-red-950/10">
                    <input
                      type="number"
                      step="0.01"
                      value={decl}
                      onChange={(e) => setDeclared(code, e.target.value)}
                      className={`${inputCls} text-right`}
                    />
                  </td>
                  <td className="py-1 px-2 bg-green-950/10">
                    <input
                      type="number"
                      step="0.01"
                      value={corr}
                      onChange={(e) => setCorrected(code, e.target.value)}
                      className={`${inputCls} text-right`}
                    />
                  </td>
                  <td className={`py-2 px-2 text-right font-mono ${diff > 0 ? 'text-green-400' : diff < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                    {fmt(diff)}
                  </td>
                </tr>
              )
            })}
            <tr>
              <td colSpan={4} className="py-2 px-2">
                <button onClick={addDuty} type="button" className="text-xs text-[#F4C542] hover:underline">
                  + {t('review.addDuty')}
                </button>
              </td>
            </tr>
            <tr className="bg-[#F4C542]/10 border-t-2 border-[#F4C542]">
              <td colSpan={3} className="py-3 px-2 text-right font-semibold text-white">{t('review.total')}</td>
              <td className="py-3 px-2 text-right font-mono font-bold text-[#F4C542]">{fmt(totalDiff)} €</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Motivos */}
        <div className="lg:col-span-2 bg-[#0a1628] border border-[#1a2d4a] rounded-lg p-4">
          <label className={labelCls}>{t('review.motivos')}</label>
          <textarea
            rows={5}
            value={state.motivosText || ''}
            onChange={(e) => setState({ ...state, motivosText: e.target.value })}
            className={`${inputCls} font-mono`}
            placeholder={t('review.motivosHelp')}
          />
          <p className="text-xs text-gray-500 mt-1">{t('review.motivosHelp')}</p>
        </div>

        {/* Contacto */}
        <div className="bg-[#0a1628] border border-[#1a2d4a] rounded-lg p-4">
          <h3 className="text-white font-semibold mb-3">{t('review.contact')}</h3>
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
        <div className="bg-[#0a1628] border border-[#1a2d4a] rounded-lg p-4">
          <h3 className="text-white font-semibold mb-3">Ubicación y aduanas</h3>
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
        <div className="lg:col-span-2 bg-[#0a1628] border border-[#1a2d4a] rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold">{t('review.bank')}</h3>
            <span className={`text-xs ${isRep ? 'text-[#F4C542]' : 'text-gray-500'}`}>
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
              {ibanInvalid && <p className="text-xs text-orange-400 mt-1">Formato IBAN no válido</p>}
            </div>
            <div>
              <label className={labelCls}>{t('review.bankBic')}</label>
              <input className={inputCls} value={state.bank?.bic || ''} onChange={(e) => setState({ ...state, bank: { ...state.bank, bic: e.target.value } })} />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">🔒 {t('review.bankWarning')}</p>
        </div>
      </div>
    </div>
  )
}
