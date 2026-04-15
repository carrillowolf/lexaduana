'use client'

import { useState } from 'react'
import { useTranslation } from '@/lib/i18n'
import { rrmDict } from '@/lib/i18n/rrm'
import { RRM_CASE_TYPES, REQUEST_TYPES, DUTY_CODES } from '@/lib/rrmData'

function fmt(n) {
  if (n == null) return '0,00'
  return Number(n).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function StepGenerate({ state, onRestart }) {
  const t = useTranslation(rrmDict)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [saveDraft, setSaveDraft] = useState(false)

  const caseInfo = RRM_CASE_TYPES.find((c) => c.id === state.caseType)
  const reqInfo = REQUEST_TYPES[state.requestType]

  const allCodes = Array.from(new Set([
    ...Object.keys(state.dutiesDeclared || {}),
    ...Object.keys(state.dutiesCorrected || {}),
  ]))
  const totalDiff = allCodes.reduce(
    (acc, c) => acc + (Number(state.dutiesDeclared?.[c] || 0) - Number(state.dutiesCorrected?.[c] || 0)),
    0
  )

  const today = new Date().toISOString().slice(0, 10)

  const generate = async () => {
    setBusy(true)
    setError('')
    setDone(false)
    try {
      // Construimos el payload final
      const payload = {
        ...state,
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
      <h2 className="text-2xl font-bold text-white mb-2">{t('generate.title')}</h2>
      <p className="text-gray-400 mb-6">{t('generate.subtitle')}</p>

      <div className="bg-[#0a1628] border border-[#1a2d4a] rounded-lg p-5 mb-5">
        <h3 className="text-white font-semibold mb-3">{t('generate.summary')}</h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-gray-400">Tipo</dt><dd className="text-white">{reqInfo?.code} — {reqInfo?.label}</dd></div>
          <div className="flex justify-between"><dt className="text-gray-400">Caso</dt><dd className="text-white">{caseInfo?.title}</dd></div>
          <div className="flex justify-between"><dt className="text-gray-400">MRN</dt><dd className="text-white font-mono">{state.mrn || '—'}</dd></div>
          <div className="flex justify-between"><dt className="text-gray-400">Aduana</dt><dd className="text-white">{state.customsOffice || '—'}</dd></div>
          <div className="flex justify-between"><dt className="text-gray-400">Importador</dt><dd className="text-white">{state.importer?.name || '—'}</dd></div>
          <div className="flex justify-between"><dt className="text-gray-400">Representante</dt><dd className="text-white">{state.representative?.name || '—'}</dd></div>
          <div className="flex justify-between"><dt className="text-gray-400">Mercancía</dt><dd className="text-white font-mono">{state.commodityCode || '—'}</dd></div>
          <div className="flex justify-between"><dt className="text-gray-400">Valor en aduana</dt><dd className="text-white">{fmt(state.customsValue)} €</dd></div>
        </dl>

        <div className="mt-4 pt-4 border-t border-[#1a2d4a]">
          <div className="text-gray-400 text-xs mb-2">Liquidación a regularizar</div>
          {allCodes.map((c) => {
            const diff = Number(state.dutiesDeclared?.[c] || 0) - Number(state.dutiesCorrected?.[c] || 0)
            return (
              <div key={c} className="flex justify-between text-sm py-1">
                <span className="text-white"><span className="font-mono">{c}</span> — {DUTY_CODES[c] || ''}</span>
                <span className={diff > 0 ? 'text-green-400' : diff < 0 ? 'text-red-400' : 'text-gray-400'}>{fmt(diff)} €</span>
              </div>
            )
          })}
          <div className="flex justify-between mt-3 pt-3 border-t border-[#F4C542]/30 text-base">
            <span className="font-semibold text-white">Total a devolver</span>
            <span className="font-bold text-[#F4C542]">{fmt(totalDiff)} €</span>
          </div>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-300 mb-4">
        <input type="checkbox" checked={saveDraft} onChange={(e) => setSaveDraft(e.target.checked)} />
        {t('generate.saveDraft')}
      </label>

      {error && <div className="text-red-400 text-sm mb-3">{error}</div>}
      {done && <div className="text-green-400 text-sm mb-3">✓ {t('generate.generated')}</div>}

      <div className="flex flex-wrap gap-3">
        <button
          onClick={generate}
          disabled={busy}
          className="bg-[#F4C542] text-black font-semibold px-5 py-2.5 rounded hover:bg-[#e3b637] transition-colors disabled:opacity-50"
        >
          {busy ? t('generate.generating') : `📥 ${t('generate.download')}`}
        </button>
        <button
          onClick={onRestart}
          className="border border-[#1a2d4a] text-gray-300 px-5 py-2.5 rounded hover:border-[#F4C542]/50 transition-colors"
        >
          🔄 {t('common.restart')}
        </button>
      </div>
    </div>
  )
}
