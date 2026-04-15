'use client'

import { useTranslation } from '@/lib/i18n'
import { rrmDict } from '@/lib/i18n/rrm'
import { RRM_CASE_TYPES, REQUEST_TYPES, LEGAL_BASES } from '@/lib/rrmData'

export default function StepSelector({ state, setState }) {
  const t = useTranslation(rrmDict)

  const selectCase = (id) => {
    const c = RRM_CASE_TYPES.find((x) => x.id === id)
    setState({
      ...state,
      caseType: id,
      legalBasis: c?.legalBasis || 'A',
      // Pre-llenar plantilla si aún no se ha tocado
      motivosText: state.motivosText || c?.templateMotivos || '',
    })
  }

  const setRequestType = (rt) => setState({ ...state, requestType: rt })

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">{t('selector.title')}</h2>
      <p className="text-gray-400 mb-6">{t('selector.subtitle')}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {RRM_CASE_TYPES.map((c) => {
          const selected = state.caseType === c.id
          const lb = LEGAL_BASES[c.legalBasis]
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => selectCase(c.id)}
              className={[
                'text-left p-4 rounded-lg border transition-all',
                selected
                  ? 'border-[#F4C542] bg-[#0d1f35] shadow-[0_0_0_1px_#F4C542]'
                  : 'border-[#1a2d4a] bg-[#0a1628] hover:border-[#F4C542]/50',
              ].join(' ')}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{c.icon}</span>
                <span className="text-white font-semibold">{c.title}</span>
              </div>
              <p className="text-sm text-gray-400 mb-3">{c.description}</p>
              <div className="text-xs text-gray-500 italic mb-2">{t('common.example')}: {c.example}</div>
              <div className="text-xs text-[#F4C542]">
                {t('common.legalBasis')}: {lb?.code} — Art. {lb?.article} CAU
              </div>
            </button>
          )
        })}
      </div>

      <h3 className="text-lg font-semibold text-white mb-3">{t('selector.requestTypeTitle')}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Object.values(REQUEST_TYPES).map((rt) => {
          const selected = state.requestType === rt.code
          const titleKey = rt.code === 'REM' ? 'selector.remTitle' : 'selector.repTitle'
          const descKey = rt.code === 'REM' ? 'selector.remDesc' : 'selector.repDesc'
          return (
            <button
              key={rt.code}
              type="button"
              onClick={() => setRequestType(rt.code)}
              className={[
                'p-4 rounded-lg border text-left transition-all',
                selected
                  ? 'border-[#F4C542] bg-[#0d1f35]'
                  : 'border-[#1a2d4a] bg-[#0a1628] hover:border-[#F4C542]/50',
              ].join(' ')}
            >
              <div className="text-white font-semibold mb-1">{t(titleKey)}</div>
              <div className="text-sm text-gray-400">{t(descKey)}</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
