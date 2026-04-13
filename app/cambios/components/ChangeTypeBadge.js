'use client'

const TYPE_STYLES = {
  added: 'bg-green-500/20 text-green-400 border-green-500/30',
  removed: 'bg-red-500/20 text-red-400 border-red-500/30',
  modified: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
}

const TYPE_LABELS = {
  added: 'Añadido',
  removed: 'Eliminado',
  modified: 'Modificado',
}

const TYPE_ICONS = {
  added: '+',
  removed: '−',
  modified: '~',
}

export default function ChangeTypeBadge({ type }) {
  const style = TYPE_STYLES[type] || TYPE_STYLES.modified
  const label = TYPE_LABELS[type] || type
  const icon = TYPE_ICONS[type] || '?'
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${style}`}>
      <span className="font-bold">{icon}</span>
      {label}
    </span>
  )
}
