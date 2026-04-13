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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#E8E8E8]">Cambios Arancelarios del Mes</h1>
          <p className="text-sm text-[#8B95A5] mt-0.5">
            Análisis inteligente de cambios en el arancel integrado TARIC de la UE
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
              <span className="text-xs text-[#8B95A5]">Filtro activo:</span>
              <span className="text-xs bg-[#C49B38]/20 text-[#C49B38] px-2 py-0.5 rounded border border-[#C49B38]/30">
                {selectedChapter ? `Capítulo ${selectedChapter}` : `Código ${searchCode}`}
              </span>
              <button
                onClick={handleClearFilters}
                className="text-xs text-[#8B95A5] hover:text-[#E8E8E8] transition-colors underline"
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

              {/* Conclusiones + Críticos */}
              <HighlightsSection
                highlights={data.highlights}
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
