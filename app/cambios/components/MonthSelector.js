'use client'

const MONTH_NAMES = {
  '01': 'Enero', '02': 'Febrero', '03': 'Marzo', '04': 'Abril',
  '05': 'Mayo', '06': 'Junio', '07': 'Julio', '08': 'Agosto',
  '09': 'Septiembre', '10': 'Octubre', '11': 'Noviembre', '12': 'Diciembre',
}

function formatMonth(yyyymm) {
  const [year, month] = yyyymm.split('-')
  return `${MONTH_NAMES[month] || month} ${year}`
}

export default function MonthSelector({ months, selected, onChange }) {
  if (!months || months.length === 0) return null

  return (
    <select
      value={selected || ''}
      onChange={(e) => onChange(e.target.value)}
      className="bg-[#1E2A3A] text-[#E8E8E8] border border-[#2D3B4E] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#C49B38] transition-colors cursor-pointer"
    >
      {months.map((m) => (
        <option key={m.month} value={m.month}>
          {formatMonth(m.month)} — {m.total_changes.toLocaleString('es-ES')} cambios
        </option>
      ))}
    </select>
  )
}
