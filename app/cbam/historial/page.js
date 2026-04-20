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

  function trafficLightLabel(light) {
    return t(`diagnostic.trafficLight.${light || 'green'}.title`)
  }

  function trafficLightBadgeStyles(light) {
    return {
      green: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
      yellow: 'bg-amber-100 text-amber-700 ring-amber-200',
      red: 'bg-red-100 text-red-700 ring-red-200',
    }[light || 'green']
  }

  function packageLabel(pkg) {
    if (pkg === 'completo') return t('diagnostic.recommendation.title_completo')
    if (pkg === 'monitorizacion') return t('diagnostic.recommendation.title_monit')
    return t('diagnostic.recommendation.title_basico')
  }

  function exposureLabel(key) {
    if (!key) return '—'
    return t(`diagnostic.exposure.${key}`)
  }

  function savingLabel(key) {
    const labelKey = key === 'moderate' ? 'moderateSaving' : key || 'negligible'
    return t(`diagnostic.exposure.${labelKey}`)
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
          <div className="space-y-3" data-testid="cbam-history-list">
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
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ring-1 ${trafficLightBadgeStyles(item.trafficLight)}`}
                        data-traffic-light={item.trafficLight}
                      >
                        <span className={`w-2 h-2 rounded-full ${
                          item.trafficLight === 'green' ? 'bg-emerald-500'
                            : item.trafficLight === 'yellow' ? 'bg-amber-500'
                              : 'bg-red-500'
                        }`} />
                        {trafficLightLabel(item.trafficLight)}
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
                    <span className="text-sm font-semibold text-gray-700 tabular-nums">
                      {Number(item.totalTonnes || 0).toLocaleString(numLocale, { maximumFractionDigits: 2 })} t
                    </span>
                    {typeof item.totalCost === 'number' && (
                      <span className="text-sm text-gray-500 tabular-nums">
                        {formatCurrency(item.totalCost)}
                      </span>
                    )}
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

                {/* Detail expanded — Diagnóstico completo */}
                {viewingId === item.id && viewingDetail && (
                  <HistoryDetail
                    detail={viewingDetail}
                    t={t}
                    numLocale={numLocale}
                    trafficLightBadgeStyles={trafficLightBadgeStyles}
                    trafficLightLabel={trafficLightLabel}
                    packageLabel={packageLabel}
                    exposureLabel={exposureLabel}
                    savingLabel={savingLabel}
                    formatCurrency={formatCurrency}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function HistoryDetail({
  detail,
  t,
  numLocale,
  trafficLightBadgeStyles,
  trafficLightLabel,
  packageLabel,
  exposureLabel,
  savingLabel,
  formatCurrency,
}) {
  const diag = detail.diagnostic || {}
  const lines = Array.isArray(detail.lines) ? detail.lines : []
  const totals = detail.totals || {}
  const showCost = Boolean(detail.showCost)

  return (
    <div className="border-t border-gray-100 p-5 bg-gray-50/50" data-testid="cbam-history-detail">
      <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide mb-3">
        {t('history.detailTitle')}
      </p>

      {/* Semáforo + métricas */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 mb-4">
        <div className="flex items-start gap-3 mb-4">
          <span
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ring-1 ${trafficLightBadgeStyles(diag.trafficLight)}`}
          >
            <span className={`w-2 h-2 rounded-full ${
              diag.trafficLight === 'green' ? 'bg-emerald-500'
                : diag.trafficLight === 'yellow' ? 'bg-amber-500' : 'bg-red-500'
            }`} />
            {trafficLightLabel(diag.trafficLight)}
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricSmall label={t('diagnostic.metrics.totalTonnage')} value={`${Number(diag.totalTonnage || 0).toLocaleString(numLocale, { maximumFractionDigits: 2 })} t`} />
          <MetricSmall label={t('diagnostic.metrics.productsCount')} value={diag.productCount} />
          <MetricSmall label={t('diagnostic.metrics.installations')} value={diag.installationsEstimate} />
          <MetricSmall label={t('diagnostic.metrics.year')} value={diag.year} />
        </div>
      </div>

      {/* Exposición cualitativa */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 mb-4">
        <p className="text-[10px] uppercase font-semibold text-gray-500 mb-2">
          {t('diagnostic.exposure.cardTitle')}
        </p>
        <dl className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div>
            <dt className="text-xs text-gray-500">{t('diagnostic.exposure.certificatesLabel')}</dt>
            <dd className="font-semibold text-[#0A3D5C]">
              {t('diagnostic.exposure.certificatesPrefix')}{' '}
              <span className="font-mono">{diag.certificatesRange?.label || '—'}</span>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">{t('diagnostic.exposure.exposureLabel')}</dt>
            <dd className="font-semibold text-gray-900">{exposureLabel(diag.economicExposure)}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">{t('diagnostic.exposure.savingsLabel')}</dt>
            <dd className="font-semibold text-gray-900">{savingLabel(diag.potentialSaving)}</dd>
          </div>
        </dl>
      </div>

      {/* Paquete recomendado */}
      <div className="bg-[#0A3D5C] rounded-xl p-4 text-white mb-4">
        <p className="text-[10px] uppercase font-semibold text-white/60 tracking-wide">
          {t('diagnostic.recommendation.cardEyebrow')}
        </p>
        <p className="text-lg font-bold mt-1">{packageLabel(diag.recommendedPackage)}</p>
      </div>

      {/* Desglose por línea (sin cert/coste, con exposición línea) */}
      <div className="bg-white rounded-lg border border-gray-100 overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-gray-500">{t('table.colProduct')}</th>
              <th className="px-3 py-2 text-left font-semibold text-gray-500">{t('table.colCountry')}</th>
              <th className="px-3 py-2 text-right font-semibold text-gray-500">{t('table.colTonnes')}</th>
              <th className="px-3 py-2 text-center font-semibold text-gray-500">{t('table.colSource')}</th>
              <th className="px-3 py-2 text-center font-semibold text-gray-500">{t('diagnostic.lineColumn')}</th>
              {showCost && (
                <th className="px-3 py-2 text-right font-semibold text-gray-500">{t('table.colCost')}</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {lines.map((l, i) => (
              <tr key={i}>
                <td className="px-3 py-2">
                  <div className="font-medium text-gray-800 truncate max-w-[180px]">{l.productDescription || '—'}</div>
                  <div className="text-[10px] text-gray-500 font-mono">{l.cnCode}</div>
                </td>
                <td className="px-3 py-2 text-gray-700">{l.countryCode}</td>
                <td className="px-3 py-2 text-right tabular-nums">{Number(l.annualTonnes || 0).toLocaleString(numLocale)}</td>
                <td className="px-3 py-2 text-center text-gray-600">
                  {l.emissionSource === 'real' ? t('table.sourceReal') : t('table.sourceDefault')}
                </td>
                <td className="px-3 py-2 text-center">
                  <span
                    className={`inline-block w-3 h-3 rounded-full ${
                      l.lineTrafficLight === 'green' ? 'bg-emerald-500'
                        : l.lineTrafficLight === 'yellow' ? 'bg-amber-500'
                          : 'bg-red-500'
                    }`}
                    title={trafficLightLabel(l.lineTrafficLight)}
                    data-line-light={l.lineTrafficLight}
                  />
                </td>
                {showCost && (
                  <td className="px-3 py-2 text-right font-semibold text-[#0A3D5C]">
                    {formatCurrency(l.totalCost)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totals.missingDataCount > 0 && (
        <p className="mt-3 text-[11px] text-amber-700">
          {t('table.noOfficialDataFooter')}
        </p>
      )}
    </div>
  )
}

function MetricSmall({ label, value }) {
  return (
    <div className="bg-gray-50 rounded-md px-2.5 py-2">
      <p className="text-[9px] uppercase tracking-wide text-gray-500 font-semibold">{label}</p>
      <p className="text-sm font-bold text-[#0A3D5C] tabular-nums">{value ?? '—'}</p>
    </div>
  )
}
