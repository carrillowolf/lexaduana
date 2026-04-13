'use client'

const SEVERITY_STYLES = {
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  info: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
}

const SEVERITY_LABELS = {
  critical: 'Crítico',
  warning: 'Warning',
  info: 'Info',
}

export default function SeverityBadge({ severity }) {
  const style = SEVERITY_STYLES[severity] || SEVERITY_STYLES.info
  const label = SEVERITY_LABELS[severity] || severity
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${style}`}>
      {label}
    </span>
  )
}
