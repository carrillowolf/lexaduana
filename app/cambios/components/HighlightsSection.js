'use client'

function generateInsights(chapters) {
  if (!chapters || chapters.length === 0) return []
  const insights = []

  const topRemoved = [...chapters].filter(ch => ch.measures_removed > 0).sort((a, b) => b.measures_removed - a.measures_removed)
  if (topRemoved.length > 0) {
    const totalRemoved = topRemoved.reduce((sum, ch) => sum + ch.measures_removed, 0)
    insights.push({ icon: '🗑️', text: `${totalRemoved} medidas eliminadas, concentradas en capítulos ${topRemoved.slice(0, 3).map(ch => ch.chapter).join(', ')}`, type: 'warning' })
  }

  const topAdded = [...chapters].filter(ch => ch.measures_added > 0).sort((a, b) => b.measures_added - a.measures_added)
  if (topAdded.length > 0) {
    const totalAdded = topAdded.reduce((sum, ch) => sum + ch.measures_added, 0)
    insights.push({ icon: '🆕', text: `${totalAdded} medidas nuevas en ${topAdded.length} capítulos`, type: 'success' })
  }

  const critChapters = [...chapters].filter(ch => ch.critical > 0).sort((a, b) => b.critical - a.critical)
  if (critChapters.length > 0) {
    insights.push({ icon: '⚠️', text: `Cambios críticos en: ${critChapters.map(ch => `${ch.chapter} (${ch.name})`).slice(0, 4).join(', ')}`, type: 'danger' })
  }

  const noiseChapters = chapters.filter(ch => ch.measures === 0 && ch.conditions === 0 && ch.exclusions === 0 && ch.footnotes > 0)
  if (noiseChapters.length > 0) {
    const totalNoise = noiseChapters.reduce((sum, ch) => sum + ch.footnotes, 0)
    insights.push({ icon: '📝', text: `${noiseChapters.length} capítulos (${totalNoise.toLocaleString('es-ES')} registros) solo tuvieron cambios de footnotes — sin impacto arancelario`, type: 'muted' })
  }

  return insights
}

const INSIGHT_STYLES = {
  warning: 'border-l-amber-400 bg-amber-50/50',
  success: 'border-l-green-500 bg-green-50/50',
  danger: 'border-l-red-400 bg-red-50/50',
  muted: 'border-l-gray-300 bg-gray-50/50',
}

export default function HighlightsSection({ chapters }) {
  const insights = generateInsights(chapters)

  if (insights.length === 0) return null

  return (
    <div>
      <h3 className="text-base font-bold text-gray-800 mb-3 px-1">Conclusiones del mes</h3>
      <div className="space-y-2">
        {insights.map((insight, i) => (
          <div key={i} className={`flex items-start gap-3 px-4 py-3 rounded-lg border-l-[3px] ${INSIGHT_STYLES[insight.type]}`}>
            <span className="text-base flex-shrink-0 mt-0.5">{insight.icon}</span>
            <p className={`text-sm leading-relaxed ${insight.type === 'muted' ? 'text-gray-400' : 'text-gray-700'}`}>
              {insight.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
