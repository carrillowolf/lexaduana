'use client'

const STATUS_CONFIG = {
  draft: {
    label: 'Borrador',
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    dot: 'bg-gray-400',
  },
  intake_complete: {
    label: 'Enviada',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    dot: 'bg-blue-400',
  },
  analyzing: {
    label: 'En análisis',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-400',
  },
  pending_supplier_data: {
    label: 'Pendiente datos proveedor',
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    dot: 'bg-orange-400',
  },
  calculating: {
    label: 'Calculando',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    dot: 'bg-indigo-400',
  },
  report_ready: {
    label: 'Informe listo',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    dot: 'bg-emerald-400',
  },
  delivered: {
    label: 'Entregado',
    bg: 'bg-green-50',
    text: 'text-green-700',
    dot: 'bg-green-500',
  },
  cancelled: {
    label: 'Cancelada',
    bg: 'bg-red-50',
    text: 'text-red-700',
    dot: 'bg-red-400',
  },
}

export default function AdvisoryStatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  )
}
