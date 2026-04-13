'use client'

function StatNumber({ value, label, color, sub }) {
  return (
    <div className="text-center sm:text-left">
      <div className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color }}>
        {typeof value === 'number' ? value.toLocaleString('es-ES') : value}
      </div>
      <div className="text-sm font-semibold text-gray-800 mt-1">{label}</div>
      {sub && <div className="text-xs text-gray-500 mt-0.5">{sub}</div>}
    </div>
  )
}

export default function ChangesSummary({ summary }) {
  if (!summary) return null

  const { measures, measures_added, measures_removed, conditions, exclusions, critical, chapters_with_measures } = summary

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 px-1">
      <StatNumber
        value={measures}
        label="Cambios en medidas"
        color="#B8860B"
        sub={`${measures_added} nuevas · ${measures_removed} eliminadas`}
      />
      <StatNumber
        value={critical}
        label="Cambios críticos"
        color="#DC2626"
        sub="Anti-dumping, aranceles"
      />
      <StatNumber
        value={conditions + exclusions}
        label="Condiciones y exclusiones"
        color="#059669"
        sub={`${summary.conditions_added || 0} condiciones nuevas`}
      />
      <StatNumber
        value={chapters_with_measures}
        label="Capítulos afectados"
        color="#2563EB"
        sub="Con cambios reales"
      />
    </div>
  )
}
