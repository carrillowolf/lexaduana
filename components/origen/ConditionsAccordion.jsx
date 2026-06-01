'use client'

import { ChevronDown } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'
import { origenDict } from '@/lib/i18n/origen'

function ConditionRow({ label, pill, text }) {
  if (!text) return null
  return (
    <div className="py-3 border-t border-slate-100">
      <p className="flex items-center gap-2 text-sm font-semibold mb-1">
        {label}
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 whitespace-nowrap">
          {pill}
        </span>
      </p>
      <p className="text-[13px] text-slate-500 leading-relaxed m-0">
        {text}
      </p>
    </div>
  )
}

export default function ConditionsAccordion({ agreement }) {
  const t = useTranslation(origenDict)

  const hasAny = agreement.drawbackNote || agreement.transportNote || agreement.cumulation
  if (!hasAny) return null

  const drawbackPill = agreement.drawbackAllowed === false ? 'Aplica' : 'No aplica'
  const transportPill = agreement.transportNote ? 'Permitida con condiciones' : null

  return (
    <details className="bg-white border border-slate-200 rounded-2xl shadow-sm px-5 py-1 mb-3.5">
      <summary className="list-none cursor-pointer flex items-center gap-2 py-3.5 text-[15px] font-semibold text-[#0A3D5C] [&::-webkit-details-marker]:hidden">
        {t('origen.condiciones')}
        <ChevronDown className="w-[18px] h-[18px] ml-auto text-slate-400 transition-transform duration-150 [[open]>&]:rotate-180" />
      </summary>

      <ConditionRow
        label={t('origen.cond.drawback')}
        pill={drawbackPill}
        text={agreement.drawbackNote}
      />
      <ConditionRow
        label={t('origen.cond.no_alteracion')}
        pill={transportPill || 'Permitida con condiciones'}
        text={agreement.transportNote}
      />
      <ConditionRow
        label={t('origen.cond.acumulacion')}
        pill={agreement.cumulation?.includes('bilateral') ? 'Bilateral' : agreement.cumulation?.includes('diagonal') ? 'Diagonal' : 'Bilateral'}
        text={agreement.cumulation}
      />
    </details>
  )
}
