'use client'

import { ShieldAlert } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'
import { origenDict } from '@/lib/i18n/origen'

export default function TradeStatusBanner({ tradeStatus }) {
  const t = useTranslation(origenDict)

  if (!tradeStatus?.length) return null

  return (
    <div className="mb-5 space-y-3">
      {tradeStatus.map((ts, i) => (
        <div
          key={i}
          className="bg-red-50 border-l-4 border-red-600 rounded-r-lg px-4 py-3.5"
        >
          <p className="text-[14px] font-semibold text-red-900 flex items-center gap-2 mb-1.5">
            <ShieldAlert className="w-[18px] h-[18px] flex-none" />
            {t('origen.trade_status_titulo')}
          </p>
          <p className="text-[13px] text-red-800 m-0">
            {ts.scopeEs}
          </p>
          {ts.sourceUrl && (
            <a
              href={ts.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[13px] font-medium text-red-900 underline mt-2"
            >
              {t('origen.trade_status_link')}
            </a>
          )}
        </div>
      ))}
    </div>
  )
}
