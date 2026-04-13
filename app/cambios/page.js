'use client'

import { useState, useEffect } from 'react'
import MonthSelector from './components/MonthSelector'
import ChangesSummary from './components/ChangesSummary'
import ChapterTable from './components/ChapterTable'
import HighlightsSection from './components/HighlightsSection'
import ChangesSearch from './components/ChangesSearch'
import ChangesTable from './components/ChangesTable'
import TopChanges from './components/TopChanges'
import SubscriptionCTA from './components/SubscriptionCTA'

export default function CambiosPage() {
  const [months, setMonths] = useState([])
  const [selectedMonth, setSelectedMonth] = useState(null)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedChapter, setSelectedChapter] = useState(null)
  const [searchCode, setSearchCode] = useState(null)
  const [showDetail, setShowDetail] = useState(false)

  // Cargar lista de meses disponibles
  useEffect(() => {
    fetch('/api/changes?months=all')
      .then(res => res.json())
      .then(json => {
        if (json.months && json.months.length > 0) {
          setMonths(json.months)
          setSelectedMonth(json.months[0].month)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Cargar datos del mes seleccionado
  useEffect(() => {
    if (!selectedMonth) return
    setLoading(true)
    setError(null)
    fetch(`/api/changes?month=${selectedMonth}`)
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setData(json)
        } else {
          setError(json.error || 'Error cargando datos')
        }
        setLoading(false)
      })
      .catch(() => {
        setError('Error de conexión')
        setLoading(false)
      })
  }, [selectedMonth])

  function handleSelectChapter(chapter) {
    setSelectedChapter(chapter)
    setSearchCode(null)
    setShowDetail(true)
  }

  function handleSearch(code) {
    setSearchCode(code)
    setSelectedChapter(null)
    setShowDetail(!!code)
  }

  function handleClearFilters() {
    setSelectedChapter(null)
    setSearchCode(null)
    setShowDetail(false)
  }

  // Estado vacío — no hay datos de cambios todavía
  if (!loading && months.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-[#141B2D] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#1E2A3A]">
            <svg className="w-8 h-8 text-[#C49B38]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#E8E8E8] mb-2">Sin datos de cambios</h2>
          <p className="text-sm text-[#8B95A5]">
            El sistema de detección de cambios TARIC se ejecuta con cada actualización mensual de datos.
            Los cambios aparecerán aquí tras la próxima actualización.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* ═══ HERO ═══ */}
      <div className="bg-[#0A3D5C] relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHptMCAyYzguODM3IDAgMTYgNy4xNjMgMTYgMTZzLTcuMTYzIDE2LTE2IDE2LTE2LTcuMTYzLTE2LTE2IDcuMTYzLTE2IDE2LTE2eiIgZmlsbD0iI2ZmZiIgZmlsbC1vcGFjaXR5PSIuMDIiLz48L2c+PC9zdmc+')] opacity-30" />
        <div className="relative z-10 px-6 py-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
          <div className="flex-1">
            <span className="inline-block px-3 py-1 bg-white/10 border border-white/10 rounded-full text-xs font-medium text-white/80 mb-3">
              Arancel Integrado de la UE — Actualización mensual
            </span>
            <h1 className="text-2xl lg:text-3xl font-bold text-white mb-3 tracking-tight">
              Monitor de Cambios TARIC
            </h1>
            <p className="text-white/60 text-sm leading-relaxed max-w-lg">
              Cada mes, la Comisión Europea actualiza el arancel integrado TARIC.
              Aquí detectamos y analizamos qué ha cambiado: nuevos aranceles,
              medidas anti-dumping, contingentes modificados y más.
              <span className="text-white/90 font-medium"> Solo cambios con impacto real.</span>
            </p>
          </div>
          <MonthSelector
            months={months}
            selected={selectedMonth}
            onChange={(m) => {
              setSelectedMonth(m)
              handleClearFilters()
            }}
          />
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#C49B38] border-t-transparent" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Contenido */}
      {!loading && data && (
        <>
          {/* Resumen con desglose */}
          <ChangesSummary summary={data.summary} />

          {/* Buscador */}
          <ChangesSearch onSearch={handleSearch} />

          {/* Filtro activo */}
          {(selectedChapter || searchCode) && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Filtro activo:</span>
              <span className="text-xs bg-[#0A3D5C]/10 text-[#0A3D5C] px-2 py-0.5 rounded border border-[#0A3D5C]/20 font-medium">
                {selectedChapter ? `Capítulo ${selectedChapter}` : `Código ${searchCode}`}
              </span>
              <button
                onClick={handleClearFilters}
                className="text-xs text-gray-400 hover:text-gray-700 transition-colors underline"
              >
                Limpiar
              </button>
            </div>
          )}

          {/* Vista principal */}
          {!showDetail && (
            <>
              {/* Top mayores cambios */}
              <TopChanges changes={data.top_changes} />

              {/* Capítulos */}
              <ChapterTable
                chapters={data.by_chapter}
                onSelectChapter={handleSelectChapter}
              />

              {/* Conclusiones */}
              <HighlightsSection
                chapters={data.by_chapter}
              />
            </>
          )}

          {/* Tabla detallada (se muestra al hacer clic en un capítulo o buscar) */}
          {showDetail && (
            <ChangesTable
              month={selectedMonth}
              chapter={selectedChapter}
              searchCode={searchCode}
            />
          )}

          {/* CTA suscripción */}
          <SubscriptionCTA />
        </>
      )}
    </div>
  )
}
