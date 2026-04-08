'use client'

// Asigna una única columna por despacho con prioridad: del estado más avanzado
// hacia atrás. Garantiza que todo despacho cae en exactamente una columna.
export const getKanbanColumn = (d) => {
  if (d.stage_levante === 'ok') return 'cierre'
  if (d.dua_status === 'mrn') return 'levante'
  const isImport = d.operation_type?.startsWith('import')
  const sumariaOk = !isImport || d.sumaria_status === 'ok' || d.stage_sumaria === 'ok'
  if (d.stage_docs === 'ok' && sumariaOk && d.stage_gastos === 'ok') return 'dua'
  if (d.stage_docs === 'ok') return 'sumaria'
  return 'docs'
}

const COLUMNS = [
  { key: 'docs',     label: 'Documentación', icon: '📄', headerClass: 'bg-gray-100 text-gray-700 border-gray-300' },
  { key: 'sumaria',  label: 'Sumaria/Gastos', icon: '📋', headerClass: 'bg-amber-100 text-amber-800 border-amber-300' },
  { key: 'dua',      label: 'DUA', icon: '📝', headerClass: 'bg-blue-100 text-blue-800 border-blue-300' },
  { key: 'levante',  label: 'Levante', icon: '✅', headerClass: 'bg-green-100 text-green-800 border-green-300' },
  { key: 'cierre',   label: 'Cierre', icon: '📁', headerClass: 'bg-emerald-100 text-emerald-900 border-emerald-400' }
]

const opIcon = (type) =>
  type?.startsWith('import') ? '🚢' :
  type?.startsWith('export') ? '📤' : '🔄'

export default function KanbanView({ dispatches, getAlerts, onNavigate }) {
  const grouped = COLUMNS.reduce((acc, col) => ({ ...acc, [col.key]: [] }), {})
  dispatches.forEach(d => {
    const col = getKanbanColumn(d)
    if (grouped[col]) grouped[col].push(d)
  })

  const now = new Date()

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {COLUMNS.map(col => (
        <div key={col.key} className="bg-gray-50 rounded-lg flex flex-col min-h-[300px]">
          <div className={`px-3 py-2 border-b ${col.headerClass} rounded-t-lg flex items-center justify-between`}>
            <h3 className="text-xs font-bold flex items-center gap-1">
              <span>{col.icon}</span>
              <span>{col.label}</span>
            </h3>
            <span className="text-xs font-bold bg-white/60 px-2 py-0.5 rounded">{grouped[col.key].length}</span>
          </div>
          <div className="p-2 space-y-2 flex-1">
            {grouped[col.key].length === 0 ? (
              <p className="text-xs text-gray-400 italic text-center py-4">Vacío</p>
            ) : (
              grouped[col.key].map(d => {
                const alerts = getAlerts ? getAlerts(d) : []
                const significant = alerts.filter(a => a.type !== 'info')
                const hasCritical = significant.some(a => a.type === 'critical')
                const eta = d.eta ? new Date(d.eta) : null
                const etaDays = eta ? Math.ceil((eta - now) / (1000 * 60 * 60 * 24)) : null
                return (
                  <button
                    key={d.id}
                    onClick={() => onNavigate?.(d.id)}
                    className={`w-full text-left bg-white rounded-md shadow-sm border p-2 hover:shadow-md transition ${
                      hasCritical ? 'border-red-400 border-l-4' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-xs font-bold text-[#0A3D5C] truncate">
                        <span className="mr-1">{opIcon(d.operation_type)}</span>
                        {d.expediente_number}
                      </p>
                    </div>
                    <p className="text-xs text-gray-600 truncate mb-1">{d.client_name || '—'}</p>
                    {eta && (
                      <p className={`text-[11px] ${
                        etaDays !== null && etaDays <= 0 ? 'text-red-600 font-bold' :
                        etaDays !== null && etaDays <= 1 ? 'text-orange-600 font-semibold' :
                        'text-gray-500'
                      }`}>
                        {eta.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}
                        {etaDays !== null && (
                          <span className="ml-1">
                            {etaDays === 0 ? '(HOY)' :
                             etaDays > 0 ? `(+${etaDays}d)` :
                             `(${etaDays}d)`}
                          </span>
                        )}
                      </p>
                    )}
                    {significant.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {significant.slice(0, 2).map((a, i) => (
                          <span
                            key={i}
                            title={a.detail || a.text}
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              a.type === 'critical' ? 'bg-red-100 text-red-700' :
                              'bg-orange-100 text-orange-700'
                            }`}
                          >
                            {a.text}
                          </span>
                        ))}
                        {significant.length > 2 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-200 text-gray-700">
                            +{significant.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
