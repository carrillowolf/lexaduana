'use client'

import { useState, useEffect } from 'react'
import ChangeTypeBadge from './ChangeTypeBadge'
import SeverityBadge from './SeverityBadge'

export default function ChangesTable({ month, chapter, searchCode }) {
  const [data, setData] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [filterSeverity, setFilterSeverity] = useState('')
  const [filterType, setFilterType] = useState('')

  useEffect(() => { setPage(1) }, [month, chapter, searchCode, filterSeverity, filterType])

  useEffect(() => {
    if (!month) return
    fetchData()
  }, [month, chapter, searchCode, page, filterSeverity, filterType])

  async function fetchData() {
    setLoading(true)
    try {
      if (searchCode) {
        const padded = searchCode.padEnd(10, '0').substring(0, 10)
        const res = await fetch(`/api/changes?goods_code=${padded}`)
        const json = await res.json()
        setData(json.changes || [])
        setPagination(null)
        setLoading(false)
        return
      }

      const params = new URLSearchParams({ month, detail: 'true', page: String(page), per_page: '30' })
      if (chapter) params.set('chapter', chapter)
      if (filterSeverity) params.set('severity', filterSeverity)

      const res = await fetch(`/api/changes?${params}`)
      const json = await res.json()

      let changes = json.changes || []
      if (filterType) changes = changes.filter(c => c.change_type === filterType)

      setData(changes)
      setPagination(json.pagination || null)
    } catch (err) {
      console.error('Error cargando cambios:', err)
    }
    setLoading(false)
  }

  return (
    <div className="rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
        <h3 className="text-sm font-semibold text-gray-800">
          Detalle de cambios
          {chapter && <span className="text-[#0A3D5C] ml-1">· Capítulo {chapter}</span>}
          {searchCode && <span className="text-[#0A3D5C] ml-1">· Código {searchCode}</span>}
        </h3>
        <div className="flex gap-2">
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
            className="bg-white text-gray-700 border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-[#0A3D5C]">
            <option value="">Todos los tipos</option>
            <option value="added">Añadidos</option>
            <option value="removed">Eliminados</option>
            <option value="modified">Modificados</option>
          </select>
          <select value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)}
            className="bg-white text-gray-700 border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-[#0A3D5C]">
            <option value="">Toda severidad</option>
            <option value="critical">Crítico</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#0A3D5C] border-t-transparent" />
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          No se encontraron cambios con estos filtros.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-2">Código</th>
                  <th className="text-left px-4 py-2">Tipo</th>
                  <th className="text-left px-4 py-2">Severidad</th>
                  <th className="text-left px-4 py-2 hidden md:table-cell">Campo</th>
                  <th className="text-left px-4 py-2 hidden lg:table-cell">Anterior</th>
                  <th className="text-left px-4 py-2 hidden lg:table-cell">Nuevo</th>
                  <th className="text-left px-4 py-2 hidden sm:table-cell">Medida</th>
                  <th className="text-left px-4 py-2 hidden sm:table-cell">Origen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.map((row, i) => (
                  <tr key={row.id} className={`hover:bg-blue-50/40 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                    <td className="px-4 py-2 font-mono text-[#0A3D5C] text-xs font-bold">{row.goods_code}</td>
                    <td className="px-4 py-2"><ChangeTypeBadge type={row.change_type} /></td>
                    <td className="px-4 py-2"><SeverityBadge severity={row.severity} /></td>
                    <td className="px-4 py-2 text-gray-700 hidden md:table-cell">{row.field_changed || '—'}</td>
                    <td className="px-4 py-2 text-red-500 text-xs hidden lg:table-cell max-w-[150px] truncate">{row.old_value || '—'}</td>
                    <td className="px-4 py-2 text-green-600 text-xs hidden lg:table-cell max-w-[150px] truncate">{row.new_value || '—'}</td>
                    <td className="px-4 py-2 text-gray-500 hidden sm:table-cell">{row.measure_type_code || '—'}</td>
                    <td className="px-4 py-2 text-gray-500 hidden sm:table-cell">{row.origin_code || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination && pagination.total_pages > 1 && (
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {pagination.total.toLocaleString('es-ES')} resultados · Página {pagination.page} de {pagination.total_pages}
              </span>
              <div className="flex gap-1">
                <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}
                  className="px-3 py-1 text-xs rounded bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  Anterior
                </button>
                <button onClick={() => setPage(Math.min(pagination.total_pages, page + 1))} disabled={page >= pagination.total_pages}
                  className="px-3 py-1 text-xs rounded bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
