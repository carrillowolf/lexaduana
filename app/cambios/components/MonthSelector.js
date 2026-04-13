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
            {formatMonth(m.month)}
          </option>
        ))}
      </select>
      {current && (
        <span className="text-xs text-white/50">
          {current.total_changes?.toLocaleString('es-ES')} cambios detectados
        </span>
      )}
    </div>
  )
}
