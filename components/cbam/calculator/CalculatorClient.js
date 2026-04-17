'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { useTranslation, useLocale } from '@/lib/i18n'
import { calculadoraCbamDict } from '@/lib/i18n/calculadora-cbam'
import { isCnSupportedByAdvisory } from '@/lib/cbamData'
import CalculatorProductLine from './CalculatorProductLine'
import CbamRestoreBanner from './CbamRestoreBanner'

const MAX_PRODUCTS = 5
const MAX_SAVES = 10
const STORAGE_KEY = 'cbam_calculator_pending'

function emptyProduct() {
  return {
    productDescription: '',
    cnCode: '',
    countryCode: '',
    countryName: '',
    annualTonnes: '',
    hasRealEmissions: false,
    emissionFactorReal: null,
    productionRoute: null,
  }
}

function formatTemplate(tpl, vars) {
  if (!tpl) return ''
  return Object.entries(vars).reduce((acc, [k, v]) => acc.replaceAll(`{${k}}`, v), tpl)
}

export default function CalculatorClient({ countries }) {
  const t = useTranslation(calculadoraCbamDict)
  const { locale } = useLocale()
  const router = useRouter()
  const supabase = createClient()
  const numLocale = locale === 'en' ? 'en-GB' : 'es-ES'

  const [user, setUser] = useState(null)
  const [userLoaded, setUserLoaded] = useState(false)
  const [year, setYear] = useState(2026)
  const [products, setProducts] = useState([emptyProduct()])
  const [result, setResult] = useState(null)
  const [calculating, setCalculating] = useState(false)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null) // 'saved' | 'error' | null
  const [saveCount, setSaveCount] = useState(0)
  const [fifoNotice, setFifoNotice] = useState(false)
  const [restoredFromStorage, setRestoredFromStorage] = useState(false)

  // ── Auth + load saves count ───────────────────────
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setUserLoaded(true)
      if (user) {
        try {
          const res = await fetch('/api/cbam/calculator/saves')
          if (res.ok) {
            const json = await res.json()
            setSaveCount(Array.isArray(json.data) ? json.data.length : 0)
          }
        } catch { /* noop */ }
      }
    }
    init()
  }, [supabase])

  // ── Restore from localStorage post-login ──────────
  useEffect(() => {
    if (!userLoaded) return
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const payload = JSON.parse(raw)
      if (!payload?.products?.length) return
      setProducts(payload.products)
      setYear(payload.year || 2026)
      setRestoredFromStorage(true)
      // Si el usuario está ahora logueado, auto-save
      if (user) {
        localStorage.removeItem(STORAGE_KEY)
        // Recalcular + guardar automáticamente
        autoSaveAfterRestore(payload.products, payload.year || 2026)
      }
    } catch { /* noop */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLoaded, user])

  async function autoSaveAfterRestore(prods, yr) {
    setCalculating(true)
    try {
      const calcRes = await fetch('/api/cbam/calculator/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year: yr, products: prods }),
      })
      const calcJson = await calcRes.json()
      if (!calcRes.ok) throw new Error(calcJson.error)
      setResult(calcJson.data)

      const saveRes = await fetch('/api/cbam/calculator/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year: yr, products: prods }),
      })
      const saveJson = await saveRes.json()
      if (saveRes.ok) {
        setSaveStatus('saved')
        setSaveCount(saveJson.data?.totalCount || saveCount + 1)
      }
    } catch (err) {
      console.error('Auto-save after restore failed', err)
    } finally {
      setCalculating(false)
    }
  }

  // ── Product editor actions ────────────────────────
  function handleProductChange(index, updated) {
    const next = [...products]
    next[index] = updated
    setProducts(next)
  }

  function handleAddProduct() {
    if (products.length >= MAX_PRODUCTS) return
    setProducts([...products, emptyProduct()])
  }

  function handleRemoveProduct(index) {
    setProducts(products.filter((_, i) => i !== index))
  }

  function handleReset() {
    setProducts([emptyProduct()])
    setResult(null)
    setError(null)
    setSaveStatus(null)
    setFifoNotice(false)
  }

  // ── Calculate ─────────────────────────────────────
  const handleCalculate = useCallback(async () => {
    setError(null)
    setSaveStatus(null)
    setFifoNotice(false)

    if (!products.length) {
      setError(t('errors.noProducts'))
      return
    }
    for (const p of products) {
      if (!p.cnCode || !p.countryCode || !p.annualTonnes) {
        setError(t('errors.productInvalid'))
        return
      }
      if (!isCnSupportedByAdvisory(p.cnCode).supported) {
        setError(t('errors.sectorNotSupported'))
        return
      }
      if (p.hasRealEmissions && (!p.emissionFactorReal || p.emissionFactorReal <= 0)) {
        setError(t('errors.realWithoutFE'))
        return
      }
    }

    setCalculating(true)
    try {
      const res = await fetch('/api/cbam/calculator/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year, products }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error')
      setResult(json.data)
    } catch (err) {
      setError(err.message || t('errors.generic'))
    } finally {
      setCalculating(false)
    }
  }, [products, year, t])

  // ── Save (authenticated) ──────────────────────────
  async function handleSaveLoggedIn() {
    if (!result) return
    setSaving(true)
    setSaveStatus(null)
    try {
      const res = await fetch('/api/cbam/calculator/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year, products }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error')
      setSaveStatus('saved')
      const newCount = json.data?.totalCount ?? Math.min(saveCount + 1, MAX_SAVES)
      if (saveCount >= MAX_SAVES) setFifoNotice(true)
      setSaveCount(newCount)
    } catch (err) {
      setError(err.message || t('errors.generic'))
      setSaveStatus('error')
    } finally {
      setSaving(false)
    }
  }

  // ── Anonymous save: stash + redirect ──────────────
  function handleSaveAnonymous(target) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ year, products }))
    } catch { /* noop */ }
    router.push(target === 'login' ? '/auth/login?next=/cbam/calculadora' : '/auth/register?next=/cbam/calculadora')
  }

  // ── Computed ──────────────────────────────────────
  const totalProducts = products.length
  const canCalculate = products.every(p => p.cnCode && p.countryCode && p.annualTonnes) && !calculating
  const price = result?.regParams?.certificatePrice ?? 0
  const totals = result?.totals
  const lines = result?.lines ?? []

  return (
    <div>
      {/* ═══ RESTORE BANNER (post anónimo → login) ═════ */}
      <CbamRestoreBanner
        variant="cbam"
        show={restoredFromStorage && !!user && saveStatus === 'saved'}
        onReset={handleReset}
      />

      {/* ═══ HERO ══════════════════════════════════════ */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-10">
        <div className="flex items-center gap-3 mb-4">
          <span className="inline-flex items-center px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[10px] font-semibold uppercase tracking-wide">
            {t('hero.badge')}
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#0A3D5C] mb-4 tracking-tight">
          {t('hero.title')}
        </h1>
        <p className="text-lg text-gray-600 leading-relaxed mb-3 max-w-3xl">
          {t('hero.subtitle')}
        </p>
        <p className="text-xs text-gray-500 mb-4">{t('hero.metaInfo')}</p>
        <Link
          href="/cbam/asesoria"
          className="inline-flex items-center gap-2 text-sm text-[#0A3D5C] hover:underline"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.5M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
          </svg>
          <span className="font-medium">{t('hero.advisoryLink')}</span>
          <span className="text-[#F4C542]">{t('hero.advisoryLinkCta')}</span>
        </Link>
      </section>

      {/* ═══ EDITOR ════════════════════════════════════ */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm">
          {/* Year selector */}
          <div className="flex items-center gap-4 mb-6 pb-5 border-b border-gray-100">
            <label className="text-sm font-medium text-gray-700">
              {t('editor.yearLabel')}
            </label>
            <div className="flex gap-2">
              {[2026, 2027, 2028].map(y => (
                <button
                  key={y}
                  type="button"
                  onClick={() => setYear(y)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                    year === y
                      ? 'bg-[#0A3D5C] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>

          {/* Product lines */}
          <div className="space-y-4">
            {products.map((p, i) => (
              <CalculatorProductLine
                key={i}
                product={p}
                index={i}
                countries={countries}
                onChange={handleProductChange}
                onRemove={handleRemoveProduct}
              />
            ))}

            {products.length < MAX_PRODUCTS && (
              <button
                type="button"
                onClick={handleAddProduct}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-600 hover:border-[#0A3D5C] hover:text-[#0A3D5C] transition-colors font-medium"
              >
                {products.length === 0 ? t('editor.addProduct') : t('editor.addAnother')}
              </button>
            )}

            {products.length >= MAX_PRODUCTS && (
              <p className="text-xs text-gray-500 text-center py-2">
                {t('editor.maxReached')}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="mt-6 pt-5 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              disabled={!canCalculate}
              onClick={handleCalculate}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#F4C542] hover:bg-[#f0b922] text-[#0A3D5C] rounded-xl font-bold text-sm transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#F4C542]"
            >
              {calculating ? t('editor.calculating') : t('editor.calculateCta')}
              {!calculating && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              )}
            </button>
            {(result || error) && (
              <button
                type="button"
                onClick={handleReset}
                className="px-6 py-3.5 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl font-medium text-sm transition-colors"
              >
                {t('editor.reset')}
              </button>
            )}
          </div>

          {/* Error inline */}
          {error && (
            <div className="mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

        </div>
      </section>

      {/* ═══ RESULTADO ═════════════════════════════════ */}
      {result && totals && (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 space-y-8">
          {/* Year badge */}
          <div className="flex items-center gap-3">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0A3D5C]">{t('result.title')}</h2>
            <span className="inline-flex items-center px-2.5 py-0.5 bg-[#0A3D5C]/10 text-[#0A3D5C] rounded-full text-xs font-semibold">
              {formatTemplate(t('result.yearBadge'), { year })}
            </span>
          </div>

          {/* Bloque A — KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-[#0A3D5C] to-[#0d5078] rounded-2xl p-6 text-white">
              <p className="text-xs uppercase tracking-wide text-white/60 font-semibold mb-2">
                {t('result.kpiCostLabel')}
              </p>
              <p className="text-3xl md:text-4xl font-bold tabular-nums">
                {new Intl.NumberFormat(numLocale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(totals.totalCost)}
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-2">
                {t('result.kpiCertificatesLabel')}
              </p>
              <p className="text-3xl md:text-4xl font-bold text-[#0A3D5C] tabular-nums">
                {totals.totalCertificates.toLocaleString(numLocale, { maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-2">
                {t('result.kpiEmissionsLabel')}
              </p>
              <p className="text-3xl md:text-4xl font-bold text-[#0A3D5C] tabular-nums">
                {totals.totalEmissions.toLocaleString(numLocale, { maximumFractionDigits: 2 })}
                <span className="text-base ml-2 text-gray-500">{t('result.kpiEmissionsUnit')}</span>
              </p>
            </div>
          </div>

          {/* Context paragraph */}
          <p className="text-sm text-gray-600 leading-relaxed">
            {formatTemplate(t('result.contextTemplate'), {
              tonnes: totals.totalTonnes.toLocaleString(numLocale),
              products: totalProducts,
              year,
              price: price.toLocaleString(numLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            })}
            {totals.missingDataCount > 0 && (
              <> <span className="text-amber-700 font-medium">
                {formatTemplate(t('result.missingDataNote'), { count: totals.missingDataCount })}
              </span></>
            )}
            {!totals.exceedsDeMinisMis && (
              <> <span className="text-amber-700 font-medium">{t('result.deMinimisNote')}</span></>
            )}
          </p>

          {/* Bloque B — tabla desglose */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">{t('table.title')}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-500 w-10">{t('table.colN')}</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-500">{t('table.colProduct')}</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-500">{t('table.colCountry')}</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase text-gray-500">{t('table.colTonnes')}</th>
                    <th className="px-4 py-3 text-center text-xs font-bold uppercase text-gray-500">{t('table.colSource')}</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase text-gray-500">{t('table.colEmissions')}</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase text-gray-500">{t('table.colAgie')}</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase text-gray-500">{t('table.colCertificates')}</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase text-gray-500">{t('table.colCost')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {lines.map((l, i) => {
                    const noData = !l.hasOfficialData
                    const rowClass = (l.hasError || noData) ? 'bg-amber-50/50' : ''
                    return (
                      <tr key={i} className={rowClass}>
                        <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900 truncate max-w-[200px]">{l.productDescription || '—'}</div>
                          <div className="text-xs text-gray-500 font-mono">{l.cnCode}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{l.countryCode}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-gray-700">{l.annualTonnes.toLocaleString(numLocale)}</td>
                        <td className="px-4 py-3 text-center">
                          {l.hasError ? (
                            <span className="text-xs text-amber-700">⚠</span>
                          ) : (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              l.emissionSource === 'real' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {l.emissionSource === 'real' ? t('table.sourceReal') : t('table.sourceDefault')}
                            </span>
                          )}
                        </td>
                        {l.hasError ? (
                          <td colSpan={4} className="px-4 py-3 text-xs text-amber-700 italic">
                            {t('table.lineError')} — {t('table.errorHint')}
                          </td>
                        ) : noData ? (
                          // Línea CBAM válida pero sin DV oficial publicado para CN×país.
                          // Emisiones pueden ser 0 (FE=0 porque no hay dato) o valor si hay FE real.
                          // Certs y Coste se sustituyen por badge "Sin datos oficiales".
                          <>
                            <td className="px-4 py-3 text-right tabular-nums text-gray-400">—</td>
                            <td className="px-4 py-3 text-right tabular-nums text-gray-400">—</td>
                            <td colSpan={2} className="px-4 py-3 text-right">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-800 rounded-md text-xs font-semibold">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                                {t('table.noOfficialData')}
                              </span>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-3 text-right tabular-nums text-gray-700">{l.totalEmissions.toLocaleString(numLocale, { maximumFractionDigits: 2 })}</td>
                            <td className="px-4 py-3 text-right tabular-nums text-gray-700">{l.agie.toLocaleString(numLocale, { maximumFractionDigits: 2 })}</td>
                            <td className="px-4 py-3 text-right tabular-nums text-gray-700">{l.certificates.toLocaleString(numLocale, { maximumFractionDigits: 2 })}</td>
                            <td className="px-4 py-3 text-right font-semibold text-[#0A3D5C] tabular-nums">
                              {new Intl.NumberFormat(numLocale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(l.totalCost)}
                            </td>
                          </>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {totals.missingDataCount > 0 && (
              <div className="px-5 py-3 border-t border-gray-100 bg-amber-50/40">
                <p className="text-xs text-gray-600 leading-relaxed">
                  {t('table.noOfficialDataFooter')}{' '}
                  <Link href="/cbam/asesoria" className="text-[#0A3D5C] font-semibold hover:underline">
                    {t('table.noOfficialDataFooterCta')}
                  </Link>
                </p>
              </div>
            )}
          </div>

          {/* Bloque C — campos premium bloqueados */}
          <div className="bg-gradient-to-br from-amber-50/50 to-white border border-amber-200/60 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <h3 className="font-semibold text-gray-900">{t('blocked.title')}</h3>
            </div>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-y-2.5 gap-x-6">
              {Array.isArray(t('blocked.items')) && t('blocked.items').map((item, i) => (
                <li key={i} className="flex items-center justify-between gap-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-700 min-w-0">
                    <svg className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="truncate">{item}</span>
                  </div>
                  <span className="text-gray-300 font-mono text-xs tracking-widest flex-shrink-0">●●●●●</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Bloque D — upsell triple */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Banner */}
            <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 mb-2">{t('upsell.bannerTitle')}</h3>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">{t('upsell.bannerDesc')}</p>
              <Link href="/cbam/asesoria" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0A3D5C] hover:underline">
                {t('upsell.bannerCta')}
              </Link>
            </div>

            {/* Botón PDF bloqueado */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
              <button
                type="button"
                disabled
                title={t('upsell.pdfButtonTooltip')}
                className="inline-flex items-center gap-2 px-5 py-3 bg-gray-200 text-gray-500 rounded-xl font-semibold text-sm cursor-not-allowed opacity-60"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                {t('upsell.pdfButtonLabel')}
              </button>
              <p className="mt-2 text-xs text-gray-500">{t('upsell.pdfButtonTooltip')}</p>
            </div>
          </div>

          {/* Comparativa */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">{t('upsell.compareTitle')}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-500">&nbsp;</th>
                    <th className="px-4 py-3 text-center text-xs font-bold uppercase text-gray-500">{t('upsell.compareColCalc')}</th>
                    <th className="px-4 py-3 text-center text-xs font-bold uppercase text-[#0A3D5C]">{t('upsell.compareColAdv')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {Array.isArray(t('upsell.compareRows')) && t('upsell.compareRows').map((row, i) => (
                    <tr key={i}>
                      <td className="px-4 py-2.5 text-gray-700">{row.label}</td>
                      <td className="px-4 py-2.5 text-center text-gray-500">{row.calc}</td>
                      <td className="px-4 py-2.5 text-center text-[#0A3D5C] font-semibold">{row.adv}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bloque E — acciones de guardado */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            {!userLoaded ? (
              <p className="text-sm text-gray-500">…</p>
            ) : user ? (
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    {t('save.counterLabel')}:{' '}
                    <span className="font-semibold text-gray-900">
                      {formatTemplate(t('save.counterFormat'), { count: saveCount, max: MAX_SAVES })}
                    </span>
                  </p>
                  {fifoNotice && (
                    <p className="text-xs text-amber-700 mt-1">
                      {formatTemplate(t('save.fifoNotice'), { max: MAX_SAVES })}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleSaveLoggedIn}
                  disabled={saving || saveStatus === 'saved'}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#0A3D5C] text-white rounded-xl font-semibold text-sm hover:bg-[#0d5078] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {saving ? t('save.loggedInSaving') : saveStatus === 'saved' ? t('save.loggedInSaved') : t('save.loggedInCta')}
                </button>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-700 font-medium mb-1">{t('save.anonymousCta')}</p>
                <p className="text-sm text-gray-500 mb-4">{t('save.anonymousHint')}</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => handleSaveAnonymous('register')}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#0A3D5C] text-white rounded-xl font-semibold text-sm hover:bg-[#0d5078] transition-colors"
                  >
                    {t('save.anonymousRegister')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveAnonymous('login')}
                    className="inline-flex items-center justify-center px-5 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors"
                  >
                    {t('save.anonymousLogin')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
