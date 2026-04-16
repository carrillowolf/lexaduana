'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'
import { exportCBAMToExcel } from '@/lib/cbamExcelExporter'
import { useTranslation, useLocale } from '@/lib/i18n'
import { cbamDict } from '@/lib/i18n/cbam'
import CbamBreadcrumb from '@/components/cbam/CbamBreadcrumb'

export default function CBAMHistorialPage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [calculations, setCalculations] = useState([])
  const [selectedIds, setSelectedIds] = useState(new Set())
  const t = useTranslation(cbamDict)
  const locale = useLocale()
  const numLocale = locale === 'en' ? 'en-GB' : 'es-ES'

  useEffect(() => {
    async function init() {
      const supabase = createClient()
      const { data: { user: u } } = await supabase.auth.getUser()

      if (!u) {
        setLoading(false)
        return
      }

      setUser(u)
      await loadCalculations()
    }
    init()
  }, [])

  const loadCalculations = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/cbam/calculations?limit=100')
      if (res.ok) {
        const json = await res.json()
        if (json.success) {
          setCalculations(json.data)
        }
      }
    } catch (err) {
      console.error('Error loading calculations:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm(t('history.confirmDelete'))) return

    const supabase = createClient()
    const { error } = await supabase
      .from('cbam_user_calculations')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (!error) {
      setCalculations(prev => prev.filter(c => c.id !== id))
      setSelectedIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === calculations.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(calculations.map(c => c.id)))
    }
  }

  const handleExport = () => {
    const toExport = selectedIds.size > 0
      ? calculations.filter(c => selectedIds.has(c.id))
      : calculations
    if (toExport.length === 0) return
    exportCBAMToExcel(toExport)
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat(numLocale, { style: 'currency', currency: 'EUR' }).format(value)
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString(numLocale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getSectorName = (sectorId) => {
    const key = `history.sector${sectorId.charAt(0).toUpperCase() + sectorId.slice(1)}`
    const names = {
      cement: t('history.sectorCement'),
      ironSteel: t('history.sectorSteel'),
      aluminium: t('history.sectorAluminium'),
      fertilizers: t('history.sectorFertilizers'),
      hydrogen: t('history.sectorHydrogen'),
      electricity: t('history.sectorElectricity'),
    }
    return names[sectorId] || sectorId
  }

  const getSectorIcon = (sectorId) => {
    const icons = {
      cement: '🏗️', ironSteel: '🔩', aluminium: '🥫',
      fertilizers: '🌱', hydrogen: '💨', electricity: '⚡'
    }
    return icons[sectorId] || '📦'
  }

  // Totals
  const totals = calculations.reduce((acc, c) => ({
    tonnes: acc.tonnes + parseFloat(c.tonnes || 0),
    cost: acc.cost + parseFloat(c.total_cost || 0),
    emissions: acc.emissions + parseFloat(c.total_emissions || 0),
  }), { tonnes: 0, cost: 0, emissions: 0 })

  if (!loading && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-gray-100 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/cbam" className="flex items-center space-x-3">
                <img src="/logo.png" alt="LexAduana" className="h-10 w-10" />
                <div>
                  <h1 className="text-xl font-bold text-[#0A3D5C]">{t('history.title')}</h1>
                </div>
              </Link>
            </div>
          </div>
        </header>
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <span className="text-6xl mb-6 block">🔐</span>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('history.loginTitle')}</h2>
          <p className="text-gray-600 mb-6">{t('history.loginDesc')}</p>
          <div className="flex gap-4 justify-center">
            <Link href="/auth/login" className="px-6 py-3 bg-[#0A3D5C] text-white font-medium rounded-xl hover:bg-[#083049] transition">
              {t('history.login')}
            </Link>
            <Link href="/auth/register" className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition">
              {t('history.createAccount')}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      <CbamBreadcrumb />
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/cbam" className="flex items-center space-x-3">
              <img src="/logo.png" alt="LexAduana" className="h-10 w-10" />
              <div>
                <h1 className="text-xl font-bold text-[#0A3D5C]">{t('history.title')}</h1>
                <p className="text-xs text-gray-500">{t('history.subtitle')}</p>
              </div>
            </Link>

            <div className="flex items-center space-x-3">
              <Link href="/cbam" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-[#0A3D5C] hover:bg-gray-50 rounded-lg transition">
                {t('history.backCbam')}
              </Link>
              <Link href="/dashboard" className="px-4 py-2 bg-[#0A3D5C] hover:bg-[#083049] text-white text-sm font-medium rounded-lg transition-colors">
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Stats */}
        <div className="grid sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <p className="text-sm text-gray-500">{t('history.statCalcs')}</p>
            <p className="text-3xl font-bold text-gray-800">{calculations.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <p className="text-sm text-gray-500">{t('history.statTonnes')}</p>
            <p className="text-3xl font-bold text-gray-800">{totals.tonnes.toLocaleString(numLocale, { maximumFractionDigits: 0 })}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <p className="text-sm text-gray-500">{t('history.statEmissions')}</p>
            <p className="text-3xl font-bold text-emerald-600">{totals.emissions.toLocaleString(numLocale, { maximumFractionDigits: 1 })} <span className="text-sm font-normal">tCO₂</span></p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-sm p-5 text-white">
            <p className="text-sm text-purple-100">{t('history.statCost')}</p>
            <p className="text-3xl font-bold">{formatCurrency(totals.cost)}</p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              disabled={calculations.length === 0}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <span>📥</span>
              {t('history.exportExcel')} {selectedIds.size > 0 ? `(${selectedIds.size})` : `(${calculations.length})`}
            </button>
            {calculations.length > 0 && (
              <button
                onClick={toggleSelectAll}
                className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                {selectedIds.size === calculations.length ? t('history.deselectAll') : t('history.selectAll')}
              </button>
            )}
          </div>
          <Link
            href="/cbam#simulador"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {t('history.newCalc')}
          </Link>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">{t('history.loadingHistory')}</p>
          </div>
        ) : calculations.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
            <span className="text-6xl mb-4 block">📊</span>
            <h3 className="text-xl font-bold text-gray-800 mb-2">{t('history.emptyTitle')}</h3>
            <p className="text-gray-600 mb-6">{t('history.emptyDesc')}</p>
            <Link
              href="/cbam"
              className="inline-flex items-center px-6 py-3 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition"
            >
              {t('history.goToCalc')}
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-100 bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === calculations.length}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">{t('history.colDate')}</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">{t('history.colSector')}</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">{t('history.colTonnes')}</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">{t('history.colEmissions')}</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">{t('history.colSource')}</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">{t('history.colCo2Price')}</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">{t('history.colCost')}</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">{t('history.colNotes')}</th>
                    <th className="px-4 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {calculations.map((calc) => (
                    <tr key={calc.id} className={`hover:bg-gray-50 transition ${selectedIds.has(calc.id) ? 'bg-indigo-50' : ''}`}>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(calc.id)}
                          onChange={() => toggleSelect(calc.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {formatDate(calc.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span>{getSectorIcon(calc.sector_id)}</span>
                          <span className="text-sm font-medium text-gray-800">{getSectorName(calc.sector_id)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-mono text-gray-700">
                        {parseFloat(calc.tonnes).toLocaleString(numLocale)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-mono text-gray-700">
                        {parseFloat(calc.emission_factor).toFixed(3)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          calc.emission_source === 'real'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {calc.emission_source === 'real' ? t('history.sourceReal') : t('history.sourceDefault')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-mono text-gray-700">
                        €{parseFloat(calc.co2_price).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-bold text-purple-700">{formatCurrency(parseFloat(calc.total_cost))}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 max-w-[150px] truncate" title={calc.notes}>
                        {calc.notes || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDelete(calc.id)}
                          className="text-gray-400 hover:text-red-500 transition"
                          title={t('history.deleteTip')}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
