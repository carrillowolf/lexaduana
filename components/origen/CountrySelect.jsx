'use client'

import { useRouter, useParams } from 'next/navigation'
import { useTranslation } from '@/lib/i18n'
import { origenDict } from '@/lib/i18n/origen'

export default function CountrySelect({ countries }) {
  const router = useRouter()
  const params = useParams()
  const t = useTranslation(origenDict)

  const current = params?.pais || ''

  return (
    <div className="flex items-center gap-3">
      <label className="text-sm text-slate-500">
        {t('origen.selector_label')}
      </label>
      <select
        value={current}
        onChange={(e) => {
          if (e.target.value) router.push(`/origen/${e.target.value}`)
        }}
        className="font-inherit px-3 py-2 border border-slate-200 rounded-[10px] bg-white text-slate-900 min-w-[220px]"
      >
        <option value="">—</option>
        {countries.map((c) => (
          <option key={c.areaCode} value={c.slug}>
            {c.nameEs}
          </option>
        ))}
      </select>
    </div>
  )
}
