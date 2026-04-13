'use client'

import ChangeTypeBadge from './ChangeTypeBadge'
import SeverityBadge from './SeverityBadge'

/** Genera insights automáticos a partir de los datos por capítulo */
function generateInsights(chapters) {
  if (!chapters || chapters.length === 0) return []
  const insights = []

  // Top capítulos por medidas eliminadas
  const topRemoved = [...chapters]
    .filter(ch => ch.measures_removed > 0)
    .sort((a, b) => b.measures_removed - a.measures_removed)

  if (topRemoved.length > 0) {
    const totalRemoved = topRemoved.reduce((sum, ch) => sum + ch.measures_removed, 0)
    insights.push({
      icon: '🗑️',
      text: `${totalRemoved} medidas eliminadas, concentradas en capítulos ${topRemoved.slice(0, 3).map(ch => ch.chapter).join(', ')}`,
      color: '#F44336',
    })
  }

  // Top capítulos por medidas nuevas
  const topAdded = [...chapters]
    .filter(ch => ch.measures_added > 0)
    .sort((a, b) => b.measures_added - a.measures_added)

  if (topAdded.length > 0) {
    const totalAdded = topAdded.reduce((sum, ch) => sum + ch.measures_added, 0)
    insights.push({
      icon: '🆕',
      text: `${totalAdded} medidas nuevas en ${topAdded.length} capítulos`,
      color: '#4CAF50',
    })
  }

  // Capítulos con más cambios críticos
  const critChapters = [...chapters]
    .filter(ch => ch.critical > 0)
    .sort((a, b) => b.critical - a.critical)

  if (critChapters.length > 0) {
    insights.push({
      icon: '⚠️',
      text: `Cambios críticos en capítulos: ${critChapters.map(ch => `${ch.chapter} (${ch.name})`).slice(0, 4).join(', ')}`,
      color: '#F44336',
    })
  }

  // Capítulos con solo footnotes (ruido)
  const noiseChapters = chapters.filter(ch => ch.measures === 0 && ch.conditions === 0 && ch.exclusions === 0 && ch.footnotes > 0)
  if (noiseChapters.length > 0) {
    const totalNoise = noiseChapters.reduce((sum, ch) => sum + ch.footnotes, 0)
    insights.push({
      icon: '📝',
      text: `${noiseChapters.length} capítulos (${totalNoise.toLocaleString('es-ES')} registros) solo tuvieron cambios de footnotes, sin impacto arancelario real`,
      color: '#8B95A5',
    })
  }

  return insights
}

export default function HighlightsSection({ highlights, chapters }) {
  const insights = generateInsights(chapters)

  return (
    <div className="space-y-4">
      {/* Insights automáticos */}
      {insights.length > 0 && (
        <div className="bg-[#141B2D] border border-[#1E2A3A] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#1E2A3A]">
            <h3 className="text-sm font-semibold text-[#E8E8E8]">Conclusiones del mes</h3>
          </div>
          <div className="divide-y divide-[#1E2A3A]/50">
            {insights.map((insight, i) => (
              <div key={i} className="px-4 py-3 flex items-start gap-3">
                <span className="text-lg flex-shrink-0">{insight.icon}</span>
                <p className="text-sm text-[#E8E8E8]" style={{ color: insight.color === '#8B95A5' ? '#8B95A5' : undefined }}>
                  {insight.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cambios críticos destacados */}
      {highlights && highlights.length > 0 && (
        <div className="bg-[#141B2D] border border-[#1E2A3A] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#1E2A3A] flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <h3 className="text-sm font-semibold text-[#E8E8E8]">Cambios críticos</h3>
            <span className="text-xs text-[#8B95A5]">{highlights.length} destacados</span>
          </div>
          <div className="divide-y divide-[#1E2A3A]/50 max-h-[400px] overflow-y-auto">
            {highlights.map((h) => (
              <div key={h.id} className="px-4 py-3 hover:bg-[#1E2A3A]/30 transition-colors">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-mono text-[#C49B38] text-sm font-semibold">{h.goods_code}</span>
                  <ChangeTypeBadge type={h.change_type} />
                  <SeverityBadge severity={h.severity} />
                  {h.table_name && (
                    <span className="text-xs text-[#8B95A5] bg-[#1E2A3A] px-1.5 py-0.5 rounded">
                      {h.table_name === 'taric_measures' ? 'Medida' : h.table_name === 'measure_conditions' ? 'Condición' : h.table_name}
                    </span>
                  )}
                </div>

                {h.change_type === 'modified' && h.field_changed && (
                  <div className="text-xs text-[#8B95A5] mt-1">
                    <span className="text-[#E8E8E8]">{h.field_changed}</span>:
                    <span className="text-red-400 line-through ml-1">{h.old_value}</span>
                    <span className="mx-1">→</span>
                    <span className="text-green-400">{h.new_value}</span>
                  </div>
                )}

                {h.duty_expression && (
                  <div className="text-xs text-[#8B95A5] mt-0.5">
                    Arancel: <span className="text-[#E8E8E8]">{h.duty_expression}</span>
                  </div>
                )}

                <div className="flex gap-3 text-xs text-[#8B95A5] mt-1">
                  {h.origin_code && <span>Origen: {h.origin_code}</span>}
                  {h.measure_type_code && <span>Medida: {h.measure_type_code}</span>}
                  {h.start_date && <span>Desde: {h.start_date}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
