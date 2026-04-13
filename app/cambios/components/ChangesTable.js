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

  useEffect(() => {
    setPage(1)
  }, [month, chapter, searchCode, filterSeverity, filterType])

  useEffect(() => {
    if (!month) return
    fetchData()
  }, [month, chapter, searchCode, page, filterSeverity, filterType])

  async function fetchData() {
    setLoading(true)
    try {
      // Si hay búsqueda por código, usar el endpoint de goods_code
      if (searchCode) {
        const padded = searchCode.padEnd(10, '0').substring(0, 10)
        const res = await fetch(`/api/changes?goods_code=${padded}`)
        const json = await res.json()
        setData(json.changes || [])
        setPagination(null)
        setLoading(false)
        return
      }

      const params = new URLSearchParams({
        month,
        detail: 'true',
        page: String(page),
        per_page: '30',
      })
      if (chapter) params.set('chapter', chapter)
      if (filterSeverity) params.set('severity', filterSeverity)

      const res = await fetch(`/api/changes?${params}`)
      const json = await res.json()

      let changes = json.changes || []

      // Filtro client-side por tipo de cambio (la API no tiene este filtro)
      if (filterType) {
        changes = changes.filter(c => c.change_type === filterType)
      }

      setData(changes)
      setPagination(json.pagination || null)
    } catch (err) {
      console.error('Error cargando cambios:', err)
    }
    setLoading(false)
  }

  return (
    <div className="bg-[#141B2D] border border-[#1E2A3A] rounded-xl overflow-hidden">
      {/* Header con filtros */}
      <div className="px-4 py-3 border-b border-[#1E2A3A] flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
        <h3 className="text-sm font-semibold text-[#E8E8E8]">
          Detalle de cambios
          {chapter && <span className="text-[#C49B38] ml-1">· Capítulo {chapter}</span>}
          {searchCode && <span className="text-[#C49B38] ml-1">· Código {searchCode}</span>}
        </h3>
        <div className="flex gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-[#1E2A3A] text-[#E8E8E8] border border-[#2D3B4E] rounded px-2 py-1 text-xs focus:outline-none focus:border-[#C49B38]"
          >
            <option value="">Todos los tipos</option>
            <option value="added">Añadidos</option>
            <option value="removed">Eliminados</option>
            <option value="modified">Modificados</option>
          </select>
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="bg-[#1E2A3A] text-[#E8E8E8] border border-[#2D3B4E] rounded px-2 py-1 text-xs focus:outline-none focus:border-[#C49B38]"
          >
            <option value="">Toda severidad</option>
            <option value="critical">Crítico</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>
        </div>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#C49B38] border-t-transparent" />
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-12 text-[#8B95A5] text-sm">
          No se encontraron cambios con estos filtros.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[#8B95A5] text-xs uppercase tracking-wider border-b border-[#1E2A3A]">
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
              <tbody className="divide-y divide-[#1E2A3A]/50">
                {data.map((row) => (
                  <tr key={row.id} className="hover:bg-[#1E2A3A]/30 transition-colors">
                    <td className="px-4 py-2 font-mono text-[#C49B38] text-xs">{row.goods_code}</td>
                    <td className="px-4 py-2"><ChangeTypeBadge type={row.change_type} /></td>
                    <td className="px-4 py-2"><SeverityBadge severity={row.severity} /></td>
                    <td className="px-4 py-2 text-[#E8E8E8] hidden md:table-cell">{row.field_changed || '—'}</td>
                    <td className="px-4 py-2 text-red-400 text-xs hidden lg:table-cell max-w-[150px] truncate">
                      {row.old_value || '—'}
                    </td>
                    <td className="px-4 py-2 text-green-400 text-xs hidden lg:table-cell max-w-[150px] truncate">
                      {row.new_value || '—'}
                    </td>
                    <td className="px-4 py-2 text-[#8B95A5] hidden sm:table-cell">{row.measure_type_code || '—'}</td>
                    <td className="px-4 py-2 text-[#8B95A5] hidden sm:table-cell">{row.origin_code || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {pagination && pagination.total_pages > 1 && (
            <div className="px-4 py-3 border-t border-[#1E2A3A] flex items-center justify-between">
              <span className="text-xs text-[#8B95A5]">
                {pagination.total.toLocaleString('es-ES')} resultados · Página {pagination.page} de {pagination.total_pages}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1 text-xs rounded bg-[#1E2A3A] text-[#E8E8E8] hover:bg-[#2D3B4E] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setPage(Math.min(pagination.total_pages, page + 1))}
                  disabled={page >= pagination.total_pages}
                  className="px-3 py-1 text-xs rounded bg-[#1E2A3A] text-[#E8E8E8] hover:bg-[#2D3B4E] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
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
