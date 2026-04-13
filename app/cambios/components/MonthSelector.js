'use client'

const MONTH_NAMES_ES = {
  '01': 'Enero', '02': 'Febrero', '03': 'Marzo', '04': 'Abril',
  '05': 'Mayo', '06': 'Junio', '07': 'Julio', '08': 'Agosto',
  '09': 'Septiembre', '10': 'Octubre', '11': 'Noviembre', '12': 'Diciembre',
}
const MONTH_NAMES_EN = {
  '01': 'January', '02': 'February', '03': 'March', '04': 'April',
  '05': 'May', '06': 'June', '07': 'July', '08': 'August',
  '09': 'September', '10': 'October', '11': 'November', '12': 'December',
}

import { useLocale } from '@/lib/i18n'

function formatMonth(yyyymm, locale) {
  const [year, month] = yyyymm.split('-')
  const names = locale === 'en' ? MONTH_NAMES_EN : MONTH_NAMES_ES
  return `${names[month] || month} ${year}`
}

export default function MonthSelector({ months, selected, onChange, t }) {
  const { locale } = useLocale()

  if (!months || months.length === 0) return null

  const current = months.find(m => m.month === selected)

  return (
    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
      <select
        value={selected || ''}
        onChange={(e) => onChange(e.target.value)}
        className="bg-white/10 text-white border border-white/20 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-[#F4C542] focus:ring-1 focus:ring-[#F4C542]/30 transition-all cursor-pointer appearance-none pr-8 hover:bg-white/15"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='white' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10l-5 5z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
      >
        {months.map((m) => (
          <option key={m.month} value={m.month} className="bg-[#0A3D5C] text-white">
            {formatMonth(m.month, locale)}
          </option>
        ))}
      </select>
      {current && (
        <span className="text-xs text-white/50">
          {current.total_changes?.toLocaleString(locale === 'en' ? 'en-GB' : 'es-ES')} {t('month.detected')}
        </span>
      )}
    </div>
  )
}
