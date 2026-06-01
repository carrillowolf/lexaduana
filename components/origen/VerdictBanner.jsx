'use client'

import { CheckCircle } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'
import { origenDict } from '@/lib/i18n/origen'

export default function VerdictBanner({ hasPreference, isCustomsUnion }) {
  const t = useTranslation(origenDict)

  if (isCustomsUnion) {
    return (
      <div className="flex items-start gap-3 mb-[18px]">
        <span className="text-green-700 mt-0.5">
          <CheckCircle className="w-5 h-5" />
        </span>
        <div>
          <p className="text-lg font-semibold m-0">
            {t('origen.verdicto_union')}
          </p>
          <p className="text-[13.5px] text-slate-500 mt-0.5">
            {t('origen.verdicto_sub_union')}
          </p>
        </div>
      </div>
    )
  }

  if (hasPreference) {
    return (
      <div className="flex items-start gap-3 mb-[18px]">
        <span className="text-green-700 mt-0.5">
          <CheckCircle className="w-5 h-5" />
        </span>
        <div>
          <p className="text-lg font-semibold m-0">
            {t('origen.verdicto_si')}
          </p>
          <p className="text-[13.5px] text-slate-500 mt-0.5">
            {t('origen.verdicto_sub_si')}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-3 mb-[18px]">
      <span className="text-slate-400 mt-0.5">
        <CheckCircle className="w-5 h-5" />
      </span>
      <div>
        <p className="text-lg font-semibold m-0">
          {t('origen.verdicto_no')}
        </p>
        <p className="text-[13.5px] text-slate-500 mt-0.5">
          {t('origen.verdicto_sub_no')}
        </p>
      </div>
    </div>
  )
}
