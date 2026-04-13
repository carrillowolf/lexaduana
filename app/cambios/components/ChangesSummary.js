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

export default function ChangesSummary({ summary, t }) {
  if (!summary) return null

  const { measures, measures_added, measures_removed, conditions, exclusions, critical, chapters_with_measures } = summary

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 px-1">
      <StatNumber
        value={measures}
        label={t('summary.measures')}
        color="#B8860B"
        sub={`${measures_added} ${t('summary.newLabel')} · ${measures_removed} ${t('summary.removedLabel')}`}
      />
      <StatNumber
        value={critical}
        label={t('summary.critical')}
        color="#DC2626"
        sub={t('summary.criticalSub')}
      />
      <StatNumber
        value={conditions + exclusions}
        label={t('summary.conditionsExclusions')}
        color="#059669"
        sub={`${summary.conditions_added || 0} ${t('summary.conditionsNew')}`}
      />
      <StatNumber
        value={chapters_with_measures}
        label={t('summary.chapters')}
        color="#2563EB"
        sub={t('summary.chaptersSub')}
      />
    </div>
  )
}
