'use client'

import { useState, useMemo } from 'react'
import { useTranslation } from '@/lib/i18n'
import { rrmDict } from '@/lib/i18n/rrm'
import { RRM_CASE_TYPES, REQUEST_TYPES, DUTY_CODES } from '@/lib/rrmData'

function fmt(n) {
  if (n == null) return '0,00'
  return Number(n).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// Naturaleza tributaria a partir del código (A* arancel, B* IVA, otros).
function classifyDuty(code) {
  if (!code) return 'otros'
  const c = String(code).toUpperCase()
  if (c.startsWith('A')) return 'arancel'
  if (c.startsWith('B')) return 'iva'
  return 'otros'
}

// Suma item.dutiesDeclared - item.dutiesCorrected sobre todos los códigos.
function itemDiff(item) {
  const codes = Array.from(new Set([
    ...Object.keys(item.dutiesDeclared || {}),
    ...Object.keys(item.dutiesCorrected || {}),
  ]))
  return codes.reduce(
    (acc, c) => acc + (Number(item.dutiesDeclared?.[c] || 0) - Number(item.dutiesCorrected?.[c] || 0)),
    0,
  )
}

export default function StepGenerate({ state, onRestart }) {
  const t = useTranslation(rrmDict)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [saveDraft, setSaveDraft] = useState(false)

  const caseInfo = RRM_CASE_TYPES.find((c) => c.id === state.caseType)
  const reqInfo = REQUEST_TYPES[state.requestType]

  // effectiveItems: si hay state.selectedItems, iterar sobre ellos; si no
  // (flujo manual sin XML), construir un único item virtual desde los
  // campos planos legacy. Mismo patrón que StepReview.
  const effectiveItems = useMemo(() => {
    if (state.selectedItems && state.selectedItems.length > 0) return state.selectedItems
    return [
      {
        sequenceNumber: 1,
        taricCode: state.commodityCode || '',
        description: state.goodsDescription || '',
        originCountry: state.countryOfOrigin || '',
        preference: state.preferenceDeclared || '',
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
    state.dutiesDeclared,
    state.dutiesCorrected,
  ])

  const isMulti = (state.selectedItems && state.selectedItems.length > 1) || false

  // Totales por código tributario (sumados a través de todas las partidas).
  const totalsByCode = useMemo(() => {
    const totals = {}
    for (const item of effectiveItems) {
      const codes = new Set([
        ...Object.keys(item.dutiesDeclared || {}),
        ...Object.keys(item.dutiesCorrected || {}),
      ])
      for (const c of codes) {
        const diff = Number(item.dutiesDeclared?.[c] || 0) - Number(item.dutiesCorrected?.[c] || 0)
        totals[c] = (totals[c] || 0) + diff
      }
    }
    return totals
  }, [effectiveItems])

  // Agrupados por naturaleza tributaria.
  const groups = useMemo(() => {
    const g = { arancel: [], iva: [], otros: [] }
    for (const [code, total] of Object.entries(totalsByCode)) {
      g[classifyDuty(code)].push({ code, total })
    }
    return g
  }, [totalsByCode])
  const sumGroup = (g) => g.reduce((acc, x) => acc + x.total, 0)
  const totalArancel = sumGroup(groups.arancel)
  const totalIVA = sumGroup(groups.iva)
  const totalOtros = sumGroup(groups.otros)
  const totalDiff = totalArancel + totalIVA + totalOtros

  const today = new Date().toISOString().slice(0, 10)

  const generate = async () => {
    setBusy(true)
    setError('')
    setDone(false)
    try {
      // Consolida los planos a partir de selectedItems para que la
      // página 1 del DOCX (formato AEAT estricto) siga teniendo dutiesDeclared/
      // dutiesCorrected agregados. Si no hay selectedItems, deja los planos
      // tal cual están (flujo manual sin XML).
      const useItems = state.selectedItems && state.selectedItems.length > 0
      const consolidatedDeclared = useItems ? {} : (state.dutiesDeclared || {})
      const consolidatedCorrected = useItems ? {} : (state.dutiesCorrected || {})
      if (useItems) {
        for (const item of state.selectedItems) {
          for (const c of Object.keys(item.dutiesDeclared || {})) {
            consolidatedDeclared[c] = (consolidatedDeclared[c] || 0) + Number(item.dutiesDeclared[c] || 0)
          }
          for (const c of Object.keys(item.dutiesCorrected || {})) {
            consolidatedCorrected[c] = (consolidatedCorrected[c] || 0) + Number(item.dutiesCorrected[c] || 0)
          }
        }
      }

      const payload = {
        ...state,
        // Consolidados para la página 1 del DOCX (sin tocar formato AEAT).
        dutiesDeclared: consolidatedDeclared,
        dutiesCorrected: consolidatedCorrected,
        // Detalle por partida para que el Anexo I genere mini-tablas.
        selectedItems: useItems ? state.selectedItems : null,
        amountToRecover: totalDiff,
        requestDate: state.requestDate || today.split('-').reverse().join('/'),
        place: state.place || 'BARCELONA',
        saveDraft,
      }
      const res = await fetch('/api/rrm/generate-docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || t('generate.error'))
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `solicitud-rrm-${(state.mrn || 'sin-mrn').replace(/[^a-zA-Z0-9]/g, '')}.docx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      setDone(true)

      // Tracking opcional (no rompe si no existe)
      try {
        const mod = await import('@/lib/analytics')
        if (typeof mod.trackEvent === 'function') {
          mod.trackEvent('generate_rrm', { case_type: state.caseType, request_type: state.requestType })
        }
      } catch (_) {}
    } catch (e) {
      setError(e.message || t('generate.error'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-slate-900 mb-2">{t('generate.title')}</h2>
      <p className="text-slate-600 leading-relaxed mb-6">{t('generate.subtitle')}</p>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-5">
        <h3 className="text-slate-900 font-semibold mb-3">{t('generate.summary')}</h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-slate-500">Tipo</dt><dd className="text-slate-900">{reqInfo?.code} — {reqInfo?.label}</dd></div>
          <div className="flex justify-between"><dt className="text-slate-500">Caso</dt><dd className="text-slate-900">{caseInfo?.title}</dd></div>
          <div className="flex justify-between"><dt className="text-slate-500">MRN</dt><dd className="text-slate-900 font-mono">{state.mrn || '—'}</dd></div>
          <div className="flex justify-between"><dt className="text-slate-500">Aduana</dt><dd className="text-slate-900">{state.customsOffice || '—'}</dd></div>
          <div className="flex justify-between"><dt className="text-slate-500">Importador</dt><dd className="text-slate-900">{state.importer?.name || '—'}</dd></div>
          <div className="flex justify-between"><dt className="text-slate-500">Representante</dt><dd className="text-slate-900">{state.representative?.name || '—'}</dd></div>
          {!isMulti && (
            <>
              <div className="flex justify-between"><dt className="text-slate-500">Mercancía</dt><dd className="text-slate-900 font-mono">{state.commodityCode || '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Valor en aduana</dt><dd className="text-slate-900">{fmt(state.customsValue)} €</dd></div>
            </>
          )}
          {isMulti && (
            <div className="flex justify-between"><dt className="text-slate-500">Partidas seleccionadas</dt><dd className="text-slate-900 font-semibold">{effectiveItems.length}</dd></div>
          )}
        </dl>

        {/* Liquidación: por partida si multi, plano si single/legacy */}
        <div className="mt-4 pt-4 border-t border-slate-200">
          <div className="text-slate-500 text-xs font-medium uppercase tracking-wide mb-2">
            {isMulti ? t('review.itemsLiquidation') : 'Liquidación a regularizar'}
          </div>
          {isMulti ? (
            <div className="space-y-3">
              {effectiveItems.map((item, idx) => {
                const diff = itemDiff(item)
                const codes = Array.from(new Set([
                  ...Object.keys(item.dutiesDeclared || {}),
                  ...Object.keys(item.dutiesCorrected || {}),
                ]))
                return (
                  <div key={idx} className="bg-white border border-slate-200 rounded-lg px-3 py-2">
                    <div className="text-sm font-semibold text-slate-900 mb-1">
                      {t('review.itemBlockTitle').replace('{n}', item.sequenceNumber || idx + 1)}
                      {item.taricCode && (
                        <> — <span className="font-mono text-[#0A3D5C]">{item.taricCode}</span></>
                      )}
                      {(item.originCountry || item.preference) && (
                        <span className="text-xs font-normal text-slate-500 ml-2">
                          {item.originCountry ? `· ${item.originCountry}` : ''}
                          {item.preference ? ` · Pref. ${item.preference}` : ''}
                        </span>
                      )}
                    </div>
                    {codes.map((c) => {
                      const d = Number(item.dutiesDeclared?.[c] || 0) - Number(item.dutiesCorrected?.[c] || 0)
                      return (
                        <div key={c} className="flex justify-between text-xs py-0.5">
                          <span className="text-slate-600"><span className="font-mono">{c}</span> — {DUTY_CODES[c] || ''}</span>
                          <span className={`font-mono ${d > 0 ? 'text-emerald-700' : d < 0 ? 'text-red-700' : 'text-slate-500'}`}>{fmt(d)} €</span>
                        </div>
                      )
                    })}
                    <div className="flex justify-between mt-1 pt-1 border-t border-slate-100 text-xs">
                      <span className="font-semibold text-slate-700">{t('review.partidaTotalLabel').replace('{n}', item.sequenceNumber || idx + 1)}</span>
                      <span className={`font-mono font-bold ${diff > 0 ? 'text-emerald-700' : diff < 0 ? 'text-red-700' : 'text-slate-500'}`}>{fmt(diff)} €</span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <>
              {Object.entries(totalsByCode).map(([c, diff]) => (
                <div key={c} className="flex justify-between text-sm py-1">
                  <span className="text-slate-700"><span className="font-mono">{c}</span> — {DUTY_CODES[c] || ''}</span>
                  <span className={`font-mono ${diff > 0 ? 'text-emerald-700' : diff < 0 ? 'text-red-700' : 'text-slate-500'}`}>{fmt(diff)} €</span>
                </div>
              ))}
            </>
          )}
        </div>

        {/* TOTAL GENERAL A REGULARIZAR — separado por naturaleza tributaria */}
        <div className="mt-4 pt-4 border-t-2 border-[#F4C542]">
          <div className="text-[#0A3D5C] text-sm font-bold uppercase tracking-wide mb-3">
            {t('review.totalGeneralTitle')}
          </div>

          <div className="space-y-1.5 mb-3">
            {groups.arancel.map(({ code, total }) => (
              <div key={code} className="flex justify-between text-sm">
                <span className="text-slate-700">
                  <span className="font-mono">{code}</span> — {DUTY_CODES[code] || t('review.dutyKindArancel')}
                  <span className="text-slate-500 italic"> ({t('review.arancelLegend')})</span>
                </span>
                <span className="font-mono text-slate-900">{fmt(total)} €</span>
              </div>
            ))}
            {groups.iva.map(({ code, total }) => (
              <div key={code} className="flex justify-between text-sm">
                <span className="text-slate-700">
                  <span className="font-mono">{code}</span> — {DUTY_CODES[code] || t('review.dutyKindIVA')}
                  <span className="text-slate-500 italic"> ({t('review.ivaLegend')})</span>
                </span>
                <span className="font-mono text-slate-900">{fmt(total)} €</span>
              </div>
            ))}
            {groups.otros.map(({ code, total }) => (
              <div key={code} className="flex justify-between text-sm">
                <span className="text-slate-700">
                  <span className="font-mono">{code}</span> — {DUTY_CODES[code] || t('review.dutyKindOtros')}
                  <span className="text-slate-500 italic"> ({t('review.otrosLegend')})</span>
                </span>
                <span className="font-mono text-slate-900">{fmt(total)} €</span>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-200 pt-2 space-y-1">
            {groups.arancel.length > 0 && (
              <div className="flex justify-between">
                <span className="font-semibold text-slate-900">{t('review.totalA00')}</span>
                <span className="font-mono font-bold text-[#0A3D5C]">{fmt(totalArancel)} €</span>
              </div>
            )}
            {groups.iva.length > 0 && (
              <div className="flex justify-between">
                <span className="font-semibold text-slate-900">{t('review.totalB00')}</span>
                <span className="font-mono font-bold text-[#0A3D5C]">{fmt(totalIVA)} €</span>
              </div>
            )}
            {groups.otros.length > 0 && (
              <div className="flex justify-between">
                <span className="font-semibold text-slate-900">{t('review.totalOtros')}</span>
                <span className="font-mono font-bold text-[#0A3D5C]">{fmt(totalOtros)} €</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700 mb-4">
        <input type="checkbox" checked={saveDraft} onChange={(e) => setSaveDraft(e.target.checked)} />
        {t('generate.saveDraft')}
      </label>

      {error && <div className="text-red-700 text-sm mb-3">{error}</div>}
      {done && <div className="text-emerald-700 text-sm mb-3">✓ {t('generate.generated')}</div>}

      <div className="flex flex-wrap gap-3">
        <button
          onClick={generate}
          disabled={busy}
          className="bg-[#F4C542] hover:bg-[#e0b332] text-slate-900 font-semibold px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy ? t('generate.generating') : `📥 ${t('generate.download')}`}
        </button>
        <button
          onClick={onRestart}
          className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-6 py-3 rounded-lg transition-colors"
        >
          🔄 {t('common.restart')}
        </button>
      </div>
    </div>
  )
}
