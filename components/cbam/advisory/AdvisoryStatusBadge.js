'use client'

import { useTranslation } from '@/lib/i18n'
import { cbamDict } from '@/lib/i18n/cbam'

const STATUS_STYLES = {
  draft:                 { bg: 'bg-gray-100',    text: 'text-gray-700',    dot: 'bg-gray-400' },
  intake_complete:       { bg: 'bg-blue-50',     text: 'text-blue-700',    dot: 'bg-blue-400' },
  analyzing:             { bg: 'bg-amber-50',    text: 'text-amber-700',   dot: 'bg-amber-400' },
  pending_supplier_data: { bg: 'bg-orange-50',   text: 'text-orange-700',  dot: 'bg-orange-400' },
  calculating:           { bg: 'bg-indigo-50',   text: 'text-indigo-700',  dot: 'bg-indigo-400' },
  reviewing:             { bg: 'bg-amber-50',    text: 'text-amber-700',   dot: 'bg-amber-400' },
  report_ready:          { bg: 'bg-purple-50',   text: 'text-purple-700',  dot: 'bg-purple-400' },
  pending_payment:       { bg: 'bg-orange-50',   text: 'text-orange-700',  dot: 'bg-orange-400' },
  paid:                  { bg: 'bg-emerald-50',  text: 'text-emerald-700', dot: 'bg-emerald-400' },
  delivered:             { bg: 'bg-green-50',    text: 'text-green-700',   dot: 'bg-green-500' },
  cancelled:             { bg: 'bg-red-50',      text: 'text-red-700',     dot: 'bg-red-400' },
}

export default function AdvisoryStatusBadge({ status }) {
  const t = useTranslation(cbamDict)
  const styles = STATUS_STYLES[status] || STATUS_STYLES.draft
  const label = t(`status.${status}`) || t('status.draft')

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${styles.bg} ${styles.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
      {label}
    </span>
  )
}
