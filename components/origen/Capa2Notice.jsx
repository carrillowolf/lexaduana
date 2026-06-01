'use client'

import { AlertTriangle } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'
import { origenDict } from '@/lib/i18n/origen'

export default function Capa2Notice({ agreement }) {
  const t = useTranslation(origenDict)

  const extraNotes = [agreement.notes, agreement.countryNote].filter(Boolean)

  return (
    <div className="bg-amber-50 border-l-4 border-amber-400 rounded-r-lg px-4 py-3.5 my-[18px]">
      <p className="text-[13.5px] font-semibold text-amber-900 flex items-center gap-[7px] mb-1.5">
        <AlertTriangle className="w-4 h-4 flex-none" />
        {t('origen.disclaimer_titulo')}
      </p>
      <p className="text-[13px] text-amber-900 m-0">
        {t('origen.disclaimer_texto')}
      </p>
      {extraNotes.map((note, i) => (
        <p key={i} className="text-[13px] text-amber-900 mt-2 m-0">
          {note}
        </p>
      ))}
    </div>
  )
}
