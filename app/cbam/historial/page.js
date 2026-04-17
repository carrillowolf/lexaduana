'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { useTranslation, useLocale } from '@/lib/i18n'
import { calculadoraCbamDict } from '@/lib/i18n/calculadora-cbam'
import CbamBreadcrumb from '@/components/cbam/CbamBreadcrumb'

const MAX_SAVES = 10
const STORAGE_KEY = 'cbam_calculator_pending'

export default function CbamHistorialPage() {
  const t = useTranslation(calculadoraCbamDict)
  const { locale } = useLocale()
  const router = useRouter()
  const supabase = createClient()
  const numLocale = locale === 'en' ? 'en-GB' : 'es-ES'

  const [user, setUser] = useState(null)
  const [userLoaded, setUserLoaded] = useState(false)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewingId, setViewingId] = useState(null)
  const [viewingDetail, setViewingDetail] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setUserLoaded(true)
      if (!user) { setLoading(false); return }
      try {
        const res = await fetch('/api/cbam/calculator/saves')
        if (!res.ok) throw new Error('fetch failed')
        const json = await res.json()
        setItems(Array.isArray(json.data) ? json.data : [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [supabase])

  async function openDetail(id) {
    setViewingId(id)
    setViewingDetail(null)
    try {
      const res = await fetch(`/api/cbam/calculator/saves/${id}`)
      if (!res.ok) throw new Error('not found')
      const json = await res.json()
      setViewingDetail(json.data)
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDelete(id) {
    if (!confirm(t('history.confirmDelete'))) return
    try {
      const res = await fetch(`/api/cbam/calculator/saves/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('delete failed')
      setItems(items.filter(i => i.id !== id))
      if (viewingId === id) { setViewingId(null); setViewingDetail(null) }
    } catch (err) {
      setError(err.message)
    }
  }

  function handleDuplicate(item) {
    // Necesitamos los productos completos; el listado solo trae preview.
    // Si estamos viendo el detalle, usamos ese; si no, abrimos el detalle primero.
    const load = viewingDetail && viewingId === item.id
      ? Promise.resolve(viewingDetail)
      : fetch(`/api/cbam/calculator/saves/${item.id}`).then(r => r.json()).then(j => j.data)

    load.then(detail => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          year: detail.year,
          products: detail.products,
        }))
      } catch { /* noop */ }
      router.push('/cbam/calculadora')
    }).catch(err => setError(err.message))
  }

  function formatDate(iso) {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString(numLocale, {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  }

  function formatCurrency(v) {
    return new Intl.NumberFormat(numLocale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v || 0)
  }

  // ── Not logged in ──────────────────────────────────
  if (userLoaded && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
        <CbamBreadcrumb />
        <main className="max-w-2xl mx-auto px-4 py-20 text-center">
          <span className="text-5xl mb-4 block">🔐</span>
          <h1 className="text-2xl font-bold text-gray-800 mb-3">{t('history.title')}</h1>
          <p className="text-gray-600 mb-8">{t('history.loginRequired')}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth/login?next=/cbam/historial" className="px-6 py-3 bg-[#0A3D5C] text-white font-medium rounded-xl hover:bg-[#0d5078] transition">
              {t('history.login')}
            </Link>
            <Link href="/auth/register?next=/cbam/historial" className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition">
              {t('history.createAccount')}
            </Link>
          </div>
        </main>
      </div>
    )
  }

  // ── Logged in ──────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      <CbamBreadcrumb />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0A3D5C] mb-2">
            {t('history.title')}
          </h1>
          <p className="text-sm text-gray-600">
            {t('history.subtitle').replaceAll('{max}', MAX_SAVES)}
          </p>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block w-6 h-6 border-2 border-[#0A3D5C] border-t-transparent rounded-full animate-spin" />
            <p className="mt-3 text-sm text-gray-500">{t('history.loading')}</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
            <span className="text-5xl mb-3 block">📊</span>
            <p className="text-gray-600 mb-5">{t('history.empty')}</p>
            <Link
              href="/cbam/calculadora"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#0A3D5C] text-white rounded-xl font-semibold text-sm hover:bg-[#0d5078] transition"
            >
              {t('history.emptyCta')}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map(item => (
              <div key={item.id} className={`bg-white border rounded-xl transition-colors ${viewingId === item.id ? 'border-[#0A3D5C] shadow-sm' : 'border-gray-200'}`}>
                <div className="p-5 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <span className="font-semibold text-gray-900">
                        {formatDate(item.createdAt)}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-semibold">
                        {t('history.colYear')} {item.year}
                      </span>
                      <span className="text-xs text-gray-500">
                        {item.productCount} {t('history.colProducts').toLowerCase()}
                      </span>
                    </div>
                    {item.cnCodesPreview.length > 0 && (
                      <p className="text-xs text-gray-500 font-mono">
                        {item.cnCodesPreview.join(' · ')}
                        {item.productCount > item.cnCodesPreview.length && ` +${item.productCount - item.cnCodesPreview.length}`}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-lg font-bold text-[#0A3D5C]">
                      {formatCurrency(item.totalCost)}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => (viewingId === item.id ? setViewingId(null) : openDetail(item.id))}
                        className="px-3 py-1.5 text-sm text-[#0A3D5C] hover:bg-[#0A3D5C]/5 rounded-lg transition"
                      >
                        {viewingId === item.id ? '▲' : t('history.view')}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDuplicate(item)}
                        className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
                      >
                        {t('history.duplicate')}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="px-2 py-1.5 text-sm text-red-500 hover:bg-red-50 rounded-lg transition"
                        title={t('history.delete')}
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                </div>

                {/* Detail expanded */}
                {viewingId === item.id && viewingDetail && (
                  <div className="border-t border-gray-100 p-5 bg-gray-50/50">
                    <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide mb-3">
                      {t('history.detailTitle')}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                      <div className="bg-white rounded-lg px-4 py-3 border border-gray-100">
                        <p className="text-[10px] uppercase font-semibold text-gray-500">{t('result.kpiCostLabel')}</p>
                        <p className="text-xl font-bold text-[#0A3D5C]">{formatCurrency(viewingDetail.totals.totalCost)}</p>
                      </div>
                      <div className="bg-white rounded-lg px-4 py-3 border border-gray-100">
                        <p className="text-[10px] uppercase font-semibold text-gray-500">{t('result.kpiCertificatesLabel')}</p>
                        <p className="text-xl font-bold text-gray-800 tabular-nums">{viewingDetail.totals.totalCertificates.toLocaleString(numLocale, { maximumFractionDigits: 2 })}</p>
                      </div>
                      <div className="bg-white rounded-lg px-4 py-3 border border-gray-100">
                        <p className="text-[10px] uppercase font-semibold text-gray-500">{t('result.kpiEmissionsLabel')}</p>
                        <p className="text-xl font-bold text-gray-800 tabular-nums">
                          {viewingDetail.totals.totalEmissions.toLocaleString(numLocale, { maximumFractionDigits: 2 })} tCO₂e
                        </p>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-100 overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-50 border-b border-gray-100">
                          <tr>
                            <th className="px-3 py-2 text-left font-semibold text-gray-500">{t('table.colProduct')}</th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-500">{t('table.colCountry')}</th>
                            <th className="px-3 py-2 text-right font-semibold text-gray-500">{t('table.colTonnes')}</th>
                            <th className="px-3 py-2 text-center font-semibold text-gray-500">{t('table.colSource')}</th>
                            <th className="px-3 py-2 text-right font-semibold text-gray-500">{t('table.colCertificates')}</th>
                            <th className="px-3 py-2 text-right font-semibold text-gray-500">{t('table.colCost')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {(viewingDetail.resultSnapshot?.lines || []).map((l, i) => (
                            <tr key={i}>
                              <td className="px-3 py-2">
                                <div className="font-medium text-gray-800 truncate max-w-[180px]">{l.productDescription || '—'}</div>
                                <div className="text-[10px] text-gray-500 font-mono">{l.cnCode}</div>
                              </td>
                              <td className="px-3 py-2 text-gray-700">{l.countryCode}</td>
                              <td className="px-3 py-2 text-right tabular-nums">{l.annualTonnes.toLocaleString(numLocale)}</td>
                              <td className="px-3 py-2 text-center text-gray-600">
                                {l.emissionSource === 'real' ? t('table.sourceReal') : t('table.sourceDefault')}
                              </td>
                              <td className="px-3 py-2 text-right tabular-nums">{(l.certificates || 0).toLocaleString(numLocale, { maximumFractionDigits: 2 })}</td>
                              <td className="px-3 py-2 text-right font-semibold text-[#0A3D5C]">{formatCurrency(l.totalCost)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
