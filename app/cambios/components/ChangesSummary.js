'use client'

function SummaryCard({ label, value, color = '#E8E8E8', sub, accent }) {
  return (
    <div className={`bg-[#141B2D] border rounded-xl p-4 flex flex-col ${accent ? 'border-[#C49B38]/40' : 'border-[#1E2A3A]'}`}>
      <span className="text-xs text-[#8B95A5] uppercase tracking-wider mb-1">{label}</span>
      <span className="text-2xl font-bold" style={{ color }}>
        {typeof value === 'number' ? value.toLocaleString('es-ES') : value}
      </span>
      {sub && <span className="text-xs text-[#8B95A5] mt-1">{sub}</span>}
    </div>
  )
}

function MiniBar({ label, value, total, color }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-[#8B95A5] w-24 text-right">{label}</span>
      <div className="flex-1 bg-[#1E2A3A] rounded-full h-2 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-[#E8E8E8] w-16 font-mono">{value.toLocaleString('es-ES')}</span>
      <span className="text-[#8B95A5] w-10 text-right">{pct}%</span>
    </div>
  )
}

export default function ChangesSummary({ summary }) {
  if (!summary) return null

  const { measures, measures_added, measures_removed, measures_modified, conditions, exclusions, footnotes, critical, total, chapters_with_measures } = summary

  return (
    <div className="space-y-4">
      {/* Tarjetas principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard
          label="Cambios en medidas"
          value={measures}
          color="#C49B38"
          accent
          sub={`${measures_added} nuevas · ${measures_removed} eliminadas · ${measures_modified} modificadas`}
        />
        <SummaryCard
          label="Cambios críticos"
          value={critical}
          color="#F44336"
          sub="Anti-dumping, aranceles, CBAM"
        />
        <SummaryCard
          label="Condiciones"
          value={conditions}
          color="#4CAF50"
          sub={`${summary.conditions_added || 0} nuevas condiciones de medida`}
        />
        <SummaryCard
          label="Capítulos afectados"
          value={chapters_with_measures}
          color="#2196F3"
          sub="Con cambios reales en medidas"
        />
      </div>

      {/* Desglose visual */}
      <div className="bg-[#141B2D] border border-[#1E2A3A] rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold text-[#8B95A5] uppercase tracking-wider">
            Desglose de {total.toLocaleString('es-ES')} cambios detectados
          </h4>
          <span className="text-xs text-[#8B95A5]">
            Solo el <span className="text-[#C49B38] font-semibold">{total > 0 ? Math.round((measures / total) * 100) : 0}%</span> son cambios de medidas (impacto real)
          </span>
        </div>
        <div className="space-y-2">
          <MiniBar label="Medidas" value={measures} total={total} color="#C49B38" />
          <MiniBar label="Condiciones" value={conditions} total={total} color="#4CAF50" />
          <MiniBar label="Exclusiones" value={exclusions} total={total} color="#2196F3" />
          <MiniBar label="Footnotes" value={footnotes} total={total} color="#4A5568" />
        </div>
      </div>
    </div>
  )
}
