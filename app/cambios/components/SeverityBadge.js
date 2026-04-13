'use client'

const SEVERITY_STYLES = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  warning: 'bg-amber-100 text-amber-700 border-amber-200',
  info: 'bg-blue-100 text-blue-700 border-blue-200',
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
