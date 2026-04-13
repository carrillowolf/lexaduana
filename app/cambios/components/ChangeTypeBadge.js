'use client'

const TYPE_STYLES = {
  added: 'bg-green-100 text-green-700 border-green-200',
  removed: 'bg-red-100 text-red-700 border-red-200',
  modified: 'bg-amber-100 text-amber-700 border-amber-200',
}

const TYPE_ICONS = {
  added: '+',
  removed: '−',
  modified: '~',
}

export default function ChangeTypeBadge({ type, t }) {
  const style = TYPE_STYLES[type] || TYPE_STYLES.modified
  const label = t ? t(`badges.${type}`) : (type === 'added' ? 'Añadido' : type === 'removed' ? 'Eliminado' : 'Modificado')
  const icon = TYPE_ICONS[type] || '?'
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${style}`}>
      <span className="font-bold">{icon}</span>
      {label}
    </span>
  )
}
