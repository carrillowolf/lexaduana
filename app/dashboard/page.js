'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import Link from 'next/link'
import { exportBulkToExcel } from '@/lib/excelExporter'
import { useTranslation } from '@/lib/i18n'
import { dashboardDict } from '@/lib/i18n/dashboard'
import { safeLogger } from '@/lib/safe-logger'
import DeleteAccountButton from '@/components/account/DeleteAccountButton'

// Admin email
const ADMIN_EMAIL = 'ccarrillodelolmo@gmail.com'

export default function DashboardPage() {
  const [user, setUser] = useState(null)
  const [calculations, setCalculations] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const router = useRouter()
  const supabase = createClient()
  const t = useTranslation(dashboardDict)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      setUser(user)
      setLoading(false)

      loadHistory()
    }

    getUser()
  }, [router, supabase])

  const loadHistory = async () => {
    setLoadingHistory(true)
    try {
      const response = await fetch('/api/calculations/history?limit=10')
      const data = await response.json()

      if (data.success) {
        setCalculations(data.data)
      }
    } catch (error) {
      safeLogger.error('Error cargando historial:', error)
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(value)
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#0A3D5C] border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">{t('loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Welcome Card */}
        <div className="bg-[#0A3D5C] rounded-2xl shadow-lg p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHptMCAyYzguODM3IDAgMTYgNy4xNjMgMTYgMTZzLTcuMTYzIDE2LTE2IDE2LTE2LTcuMTYzLTE2LTE2IDcuMTYzLTE2IDE2LTE2eiIgZmlsbD0iI2ZmZiIgZmlsbC1vcGFjaXR5PSIuMDIiLz48L2c+PC9zdmc+')] opacity-30"></div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <h2 className="text-2xl font-bold mb-1">{t('welcome.title')}</h2>
              <p className="text-white/60 text-sm">{t('welcome.subtitle')}</p>
            </div>
            <div className="hidden md:block text-4xl">📊</div>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <svg className="w-8 h-8 text-[#0A3D5C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-500 mb-1">{t('stats.totalCalcs')}</p>
                <p className="text-4xl font-bold text-[#0A3D5C]">{calculations.length}</p>
              </div>
            </div>
            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500">{t('stats.sinceAccount')}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-emerald-100 rounded-xl">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-500 mb-1">{t('stats.last7days')}</p>
                <p className="text-4xl font-bold text-emerald-600">
                  {calculations.filter(c => {
                    const date = new Date(c.created_at)
                    const now = new Date()
                    const diff = now - date
                    return diff < 7 * 24 * 60 * 60 * 1000
                  }).length}
                </p>
              </div>
            </div>
            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500">{t('stats.recentActivity')}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-amber-100 rounded-xl">
                <svg className="w-8 h-8 text-[#F4C542]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-500 mb-1">{t('stats.countriesConsulted')}</p>
                <p className="text-4xl font-bold text-[#F4C542]">
                  {new Set(calculations.map(c => c.country_code)).size}
                </p>
              </div>
            </div>
            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500">{t('stats.differentOrigins')}</p>
            </div>
          </div>
        </div>

        {/* Historial */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Header del historial */}
          <div className="px-8 py-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">{t('history.title')}</h2>
                <p className="text-sm text-gray-600">{t('history.subtitle')}</p>
              </div>
              <button
                onClick={loadHistory}
                className="px-4 py-2 bg-[#0A3D5C] hover:bg-[#083049] text-white text-sm font-medium rounded-lg transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>{t('history.refresh')}</span>
              </button>
            </div>
          </div>

          {/* Contenido del historial */}
          <div className="p-8">
            {loadingHistory ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#0A3D5C] border-t-transparent mx-auto"></div>
                <p className="mt-4 text-gray-600">{t('history.loading')}</p>
              </div>
            ) : calculations.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('history.emptyTitle')}</h3>
                <p className="text-gray-600 mb-6">{t('history.emptyDesc')}</p>
                <Link
                  href="/calculadora"
                  className="inline-flex items-center px-6 py-3 bg-[#0A3D5C] text-white font-semibold rounded-xl hover:bg-[#083049] transition-all shadow-lg hover:shadow-xl"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  {t('history.firstCalc')}
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">{t('history.colDate')}</th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">{t('history.colHsCode')}</th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">{t('history.colDescription')}</th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">{t('history.colCountry')}</th>
                      <th className="px-4 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">{t('history.colCifValue')}</th>
                      <th className="px-4 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">{t('history.colTotal')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {calculations.map((calc) => (
                      <tr key={calc.id} className="hover:bg-blue-50 transition-colors group">
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(calc.created_at)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="font-mono text-sm font-bold text-[#0A3D5C] group-hover:text-[#083049]">
                            {calc.hs_code}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700 max-w-xs truncate">
                          {calc.description?.split('→')[0] || t('history.noDescription')}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                          {calc.country_name}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                          {formatCurrency(calc.cif_value)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-emerald-600 text-right">
                          {formatCurrency(calc.total_amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Accesos rápidos */}
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-4">{t('quickAccess.title')}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              href="/calculadora"
              className="flex items-center gap-4 p-5 bg-white rounded-xl border border-gray-200 hover:border-[#0A3D5C]/30 hover:shadow-lg transition-all group"
            >
              <div className="p-3 bg-[#0A3D5C]/10 rounded-xl group-hover:bg-[#0A3D5C]/15 transition">
                <span className="text-2xl">🧮</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">{t('quickAccess.calculator')}</h3>
                <p className="text-sm text-gray-500">{t('quickAccess.calculatorDesc')}</p>
              </div>
            </Link>

            <Link
              href="/comparador"
              className="flex items-center gap-4 p-5 bg-white rounded-xl border border-gray-200 hover:border-[#0A3D5C]/30 hover:shadow-lg transition-all group"
            >
              <div className="p-3 bg-[#0A3D5C]/10 rounded-xl group-hover:bg-[#0A3D5C]/15 transition">
                <span className="text-2xl">⚖️</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">{t('quickAccess.comparator')}</h3>
                <p className="text-sm text-gray-500">{t('quickAccess.comparatorDesc')}</p>
              </div>
            </Link>

            <Link
              href="/cbam"
              className="flex items-center gap-4 p-5 bg-white rounded-xl border border-gray-200 hover:border-[#F4C542]/40 hover:shadow-lg transition-all group"
            >
              <div className="p-3 bg-[#F4C542]/15 rounded-xl group-hover:bg-[#F4C542]/25 transition">
                <span className="text-2xl">🏭</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">{t('quickAccess.cbam')}</h3>
                <p className="text-sm text-gray-500">{t('quickAccess.cbamDesc')}</p>
              </div>
            </Link>

            <Link
              href="/clasificador"
              className="flex items-center gap-4 p-5 bg-white rounded-xl border border-gray-200 hover:border-[#0A3D5C]/30 hover:shadow-lg transition-all group"
            >
              <div className="p-3 bg-[#0A3D5C]/10 rounded-xl group-hover:bg-[#0A3D5C]/15 transition">
                <span className="text-2xl">🤖</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">{t('quickAccess.classifier')}</h3>
                <p className="text-sm text-gray-500">{t('quickAccess.classifierDesc')}</p>
              </div>
            </Link>

            <Link
              href="/factura-ocr"
              className="relative flex items-center gap-4 p-5 bg-white rounded-xl border border-gray-200 hover:border-[#F4C542]/40 hover:shadow-lg transition-all group"
            >
              <span className="absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 bg-[#F4C542] text-[#0A3D5C] rounded">NUEVO</span>
              <div className="p-3 bg-[#F4C542]/15 rounded-xl group-hover:bg-[#F4C542]/25 transition">
                <span className="text-2xl">📄</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">{t('quickAccess.invoiceExtractor')}</h3>
                <p className="text-sm text-gray-500">{t('quickAccess.invoiceExtractorDesc')}</p>
              </div>
            </Link>

            <Link
              href="/bulk"
              className="flex items-center gap-4 p-5 bg-white rounded-xl border border-gray-200 hover:border-[#0A3D5C]/30 hover:shadow-lg transition-all group"
            >
              <div className="p-3 bg-[#0A3D5C]/10 rounded-xl group-hover:bg-[#0A3D5C]/15 transition">
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">{t('quickAccess.bulkCalc')}</h3>
                <p className="text-sm text-gray-500">{t('quickAccess.bulkCalcDesc')}</p>
              </div>
            </Link>

            {calculations.length > 0 && (
              <button
                onClick={() => exportBulkToExcel(calculations, user.email)}
                className="flex items-center gap-4 p-5 bg-white rounded-xl border border-gray-200 hover:border-emerald-300 hover:shadow-lg transition-all group text-left"
              >
                <div className="p-3 bg-emerald-100 rounded-xl group-hover:bg-emerald-200 transition">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{t('quickAccess.exportExcel')}</h3>
                  <p className="text-sm text-gray-500">{t('quickAccess.exportExcelDesc')}</p>
                </div>
              </button>
            )}

            {/* Panel Admin - Solo visible para admin */}
            {user?.email === ADMIN_EMAIL && (
              <Link
                href="/admin/clasificaciones"
                className="flex items-center gap-4 p-5 bg-white rounded-xl border border-gray-200 hover:border-gray-400 hover:shadow-lg transition-all group"
              >
                <div className="p-3 bg-gray-200 rounded-xl group-hover:bg-gray-300 transition">
                  <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{t('quickAccess.adminPanel')}</h3>
                  <p className="text-sm text-gray-500">{t('quickAccess.adminPanelDesc')}</p>
                </div>
              </Link>
            )}
          </div>
        </div>

        {/* Cuenta — incluye derecho de supresión RGPD (Phase 8) */}
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-4">Cuenta</h2>
          <DeleteAccountButton />
        </div>
      </div>
    </div>
  )
}