'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useTranslation } from '@/lib/i18n'
import { tiposCambioDict } from '@/lib/i18n/tipos-cambio'

export default function TiposCambioPage() {
  const [currentRates, setCurrentRates] = useState([])
  const [upcomingRates, setUpcomingRates] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const supabase = createClient()
  const t = useTranslation(tiposCambioDict)

  useEffect(() => {
    const fetchRates = async () => {
      const [{ data: current }, { data: upcoming }] = await Promise.all([
        supabase.from('current_exchange_rates').select('*').order('currency_code'),
        supabase.from('upcoming_exchange_rates').select('*').order('currency_code'),
      ])
      if (current) setCurrentRates(current)
      if (upcoming) setUpcomingRates(upcoming)
      setLoading(false)
    }
    fetchRates()
  }, [supabase])

  // Combinar current + upcoming por moneda para vista comparada
  const combinedRows = useMemo(() => {
    const byCode = new Map()
    currentRates.forEach((r) => {
      byCode.set(r.currency_code, {
        currency_code: r.currency_code,
        currency_name: r.currency_name,
        current_rate: parseFloat(r.rate),
        upcoming_rate: null,
      })
    })
    upcomingRates.forEach((r) => {
      const existing = byCode.get(r.currency_code) || {
        currency_code: r.currency_code,
        currency_name: r.currency_name,
      }
      existing.upcoming_rate = parseFloat(r.rate)
      byCode.set(r.currency_code, existing)
    })

    const rows = Array.from(byCode.values())
    const term = filter.trim().toLowerCase()
    if (!term) return rows
    return rows.filter(
      (r) =>
        r.currency_code.toLowerCase().includes(term) ||
        (r.currency_name || '').toLowerCase().includes(term),
    )
  }, [currentRates, upcomingRates, filter])

  const hasUpcoming = upcomingRates.length > 0
  const currentEffectiveDate = currentRates[0]?.effective_from
  const upcomingEffectiveDate = upcomingRates[0]?.effective_from
  const currentBoeRef = currentRates[0]?.boe_reference
  const upcomingBoeRef = upcomingRates[0]?.boe_reference

  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : '—'

  const formatRate = (n) =>
    n === null || n === undefined
      ? '—'
      : n.toLocaleString('es-ES', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 4,
        })

  // Variación porcentual entre actual y próximo
  const variation = (curr, next) => {
    if (!curr || !next) return null
    return ((next - curr) / curr) * 100
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* HERO */}
      <section className="relative overflow-hidden bg-[#0A3D5C] py-12 md:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block px-4 py-1.5 bg-white/10 border border-white/10 text-white/70 rounded-full text-sm font-medium mb-5">
            {t('hero.badge') || 'Banco Central Europeo · BOE'}
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
            {t('hero.title') || 'Tipos de cambio'}{' '}
            <span className="text-[#F4C542]">{t('hero.titleHighlight') || 'para aduanas'}</span>
          </h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto leading-relaxed">
            {t('hero.subtitle') ||
              'Cotizaciones oficiales del BCE publicadas en el BOE, aplicables al cálculo del valor en aduana durante el mes en vigor.'}
          </p>
        </div>
      </section>

      {/* BANNER PRÓXIMOS TIPOS */}
      {hasUpcoming && (
        <div className="max-w-5xl mx-auto px-4 pt-8">
          <div className="bg-amber-50 border-l-4 border-amber-400 rounded-r-lg p-5">
            <div className="flex items-start gap-3">
              <span className="text-2xl">📅</span>
              <div className="text-sm text-slate-700 leading-relaxed">
                <p className="font-semibold text-slate-900 mb-1">
                  {t('upcoming.title') || 'Nuevos tipos publicados'}
                </p>
                <p className="text-slate-600">
                  {t('upcoming.effectiveFrom') || 'Entran en vigor el'}{' '}
                  <strong className="text-slate-900">{formatDate(upcomingEffectiveDate)}</strong>
                  {upcomingBoeRef && (
                    <span className="text-slate-500 font-mono ml-2">· {upcomingBoeRef}</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONTENIDO */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        {/* TABLA UNIFICADA */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
          {/* Cabecera con metadatos */}
          <div className="flex flex-wrap items-start justify-between gap-4 mb-5 pb-5 border-b border-slate-200">
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">
                {t('current.title') || 'Cotizaciones oficiales'}
              </h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                <span>
                  <span className="font-semibold text-slate-700">Vigente:</span>{' '}
                  {formatDate(currentEffectiveDate)}
                </span>
                {currentBoeRef && (
                  <span className="font-mono text-slate-500">{currentBoeRef}</span>
                )}
                <span className="text-slate-400">·</span>
                <span>
                  {currentRates.length} {t('table.currencies') || 'monedas'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="search"
                placeholder={`🔍 ${t('table.filterPlaceholder') || 'Filtrar por código o nombre'}`}
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-[#0A3D5C]/30"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0A3D5C] mx-auto" />
              <p className="text-sm text-slate-500 mt-3">{t('loading') || 'Cargando…'}</p>
            </div>
          ) : (
            <div className="border border-slate-300 rounded overflow-auto">
              <table className="w-full text-xs border-collapse">
                <thead className="bg-slate-100 text-[10px] uppercase tracking-wider text-slate-600 sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-2 text-left border-r border-b border-slate-300 font-semibold w-20">
                      {t('table.code') || 'Código'}
                    </th>
                    <th className="px-3 py-2 text-left border-r border-b border-slate-300 font-semibold">
                      {t('table.currency') || 'Divisa'}
                    </th>
                    <th
                      className="px-3 py-2 text-right border-r border-b border-slate-300 font-semibold w-32"
                      title={`${t('current.effectiveFrom') || 'Vigente desde'} ${formatDate(currentEffectiveDate)}`}
                    >
                      {t('table.currentRate') || 'Actual'}
                      <div className="text-[9px] text-slate-400 font-normal normal-case tracking-normal">
                        1€ =
                      </div>
                    </th>
                    {hasUpcoming && (
                      <>
                        <th
                          className="px-3 py-2 text-right border-r border-b border-slate-300 font-semibold w-32"
                          title={`${t('upcoming.effectiveFrom') || 'Desde'} ${formatDate(upcomingEffectiveDate)}`}
                        >
                          {t('table.upcomingRate') || 'Próximo'}
                          <div className="text-[9px] text-slate-400 font-normal normal-case tracking-normal">
                            {formatDate(upcomingEffectiveDate)}
                          </div>
                        </th>
                        <th className="px-3 py-2 text-right border-b border-slate-300 font-semibold w-24">
                          {t('table.variation') || 'Var.'}
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="font-mono tabular-nums">
                  {combinedRows.map((row) => {
                    const varPct = variation(row.current_rate, row.upcoming_rate)
                    return (
                      <tr key={row.currency_code} className="hover:bg-blue-50/40">
                        <td className="border-b border-r border-slate-200 px-3 py-1.5">
                          <span className="font-semibold text-[#0A3D5C]">
                            {row.currency_code}
                          </span>
                        </td>
                        <td className="border-b border-r border-slate-200 px-3 py-1.5 font-sans text-slate-800">
                          {row.currency_name}
                        </td>
                        <td className="border-b border-r border-slate-200 px-3 py-1.5 text-right font-semibold text-slate-900">
                          {formatRate(row.current_rate)}
                        </td>
                        {hasUpcoming && (
                          <>
                            <td className="border-b border-r border-slate-200 px-3 py-1.5 text-right font-semibold text-slate-900">
                              {formatRate(row.upcoming_rate)}
                            </td>
                            <td className="border-b border-slate-200 px-3 py-1.5 text-right">
                              {varPct === null ? (
                                <span className="text-slate-300">—</span>
                              ) : (
                                <span
                                  className={
                                    Math.abs(varPct) < 0.01
                                      ? 'text-slate-400'
                                      : varPct > 0
                                        ? 'text-emerald-600'
                                        : 'text-red-600'
                                  }
                                  title={`${varPct > 0 ? '+' : ''}${varPct.toFixed(3)}%`}
                                >
                                  {varPct > 0 ? '▲' : varPct < 0 ? '▼' : ''}{' '}
                                  {Math.abs(varPct).toFixed(2)}%
                                </span>
                              )}
                            </td>
                          </>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {combinedRows.length === 0 && !loading && (
                <div className="px-4 py-8 text-center text-xs text-slate-500">
                  {filter ? (
                    <>
                      {t('table.noMatch') || 'Sin coincidencias para'} &quot;{filter}&quot;.
                    </>
                  ) : (
                    t('table.empty') || 'No hay tipos de cambio cargados.'
                  )}
                </div>
              )}
            </div>
          )}

          {/* Leyenda variación */}
          {hasUpcoming && !loading && combinedRows.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-slate-500">
              <span>
                <span className="text-emerald-600">▲</span>{' '}
                {t('table.legendUp') || 'El euro se aprecia frente a esa moneda'}
              </span>
              <span>
                <span className="text-red-600">▼</span>{' '}
                {t('table.legendDown') || 'El euro se deprecia'}
              </span>
            </div>
          )}
        </section>

        {/* INFO LEGAL */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-3">
            ℹ️ {t('legal.title') || 'Marco normativo'}
          </h3>
          <div className="space-y-2 text-sm text-slate-600 leading-relaxed">
            <p dangerouslySetInnerHTML={{ __html: t('legal.publication') || 'El Banco de España publica mensualmente en el BOE los tipos de cambio fijados por el <strong>Banco Central Europeo</strong>, con la consideración de cambios oficiales según el artículo 36 de la Ley 46/1998.' }} />
            <p dangerouslySetInnerHTML={{ __html: t('legal.application') || 'Estos tipos se aplican al <strong>cálculo del valor en aduana</strong> conforme a los artículos 53-54 del CAU y 146 del Reglamento de Ejecución (UE) 2447/2015. Vigencia: desde el día 1 del mes natural siguiente a su publicación.' }} />
          </div>
        </section>

        {/* DISCLAIMER */}
        <div className="text-xs text-slate-500 text-center pb-4">
          Datos publicados por el Banco de España en el BOE. LexAduana no realiza conversiones
          automáticas; verifique siempre la fecha de admisión de la declaración.
        </div>
      </div>
    </div>
  )
}
