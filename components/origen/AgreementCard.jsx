'use client'

import { useTranslation } from '@/lib/i18n'
import { origenDict } from '@/lib/i18n/origen'

const STATUS_STYLES = {
  en_vigor: 'bg-green-50 text-green-700 border border-green-200',
  aplicacion_provisional: 'bg-amber-50 text-amber-800 border border-amber-300',
  suspendido: 'bg-slate-100 text-slate-500 border border-slate-200',
}

const TYPE_LABELS = {
  tlc_bilateral: 'TLC bilateral',
  acuerdo_asociacion: 'Acuerdo de asociación',
  aae: 'AAE',
  union_aduanera: 'Unión aduanera',
  eee: 'EEE',
  spg: 'SPG',
}

export default function AgreementCard({ agreement }) {
  const t = useTranslation(origenDict)

  const statusClass = STATUS_STYLES[agreement.status] || STATUS_STYLES.en_vigor
  const statusLabel = t(`origen.estado.${agreement.status}`)
  const typeLabel = TYPE_LABELS[agreement.type] || agreement.type

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-[18px_20px] mb-3.5">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[17px] font-semibold text-[#0A3D5C]">
          {agreement.title}
        </span>
        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap ${statusClass}`}>
          {statusLabel}
        </span>
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap bg-slate-100 text-slate-700">
          {typeLabel}
        </span>
      </div>
    </div>
  )
}
