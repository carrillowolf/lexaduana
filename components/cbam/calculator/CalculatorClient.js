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
// Pre-relleno del wizard Advisory desde el diagnóstico. TTL 2h — se descarta
// silenciosamente si el usuario tarda más en abrir el wizard (datos frescos
// vs ruido localStorage).
const ADVISORY_PREFILL_KEY = 'cbam_advisory_prefill_from_diagnostic'
const ADVISORY_PREFILL_TTL_MS = 2 * 60 * 60 * 1000

function stashAdvisoryPrefill({ year, products, recommendedPackage }) {
  try {
    localStorage.setItem(ADVISORY_PREFILL_KEY, JSON.stringify({
      year,
      products,
      recommendedPackage,
      expiresAt: Date.now() + ADVISORY_PREFILL_TTL_MS,
    }))
  } catch { /* noop */ }
}

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
  const canCalculate = products.every(p => p.cnCode && p.countryCode && p.annualTonnes) && !calculating
  const totals = result?.totals
  const lines = result?.lines ?? []
  const diagnostic = result?.diagnostic
  const showCost = Boolean(result?.showCost)

  function handleAdvisoryCta() {
    if (!diagnostic) return
    stashAdvisoryPrefill({
      year,
      products,
      recommendedPackage: diagnostic.recommendedPackage,
    })
    const target = diagnostic.ctaUrl || '/cbam/asesoria/solicitud?from=diagnostic'
    router.push(target)
  }

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

      {/* ═══ RESULTADO — DIAGNÓSTICO CBAM ══════════════ */}
      {result && diagnostic && (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 space-y-8" data-testid="cbam-diagnostic-result">
          {/* Year badge */}
          <div className="flex items-center gap-3">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0A3D5C]">{t('diagnostic.title')}</h2>
            <span className="inline-flex items-center px-2.5 py-0.5 bg-[#0A3D5C]/10 text-[#0A3D5C] rounded-full text-xs font-semibold">
              {formatTemplate(t('result.yearBadge'), { year })}
            </span>
          </div>

          {/* ──  Bloque 1 — Semáforo principal + 4 métricas neutras ── */}
          <DiagnosticTrafficLightBlock
            diagnostic={diagnostic}
            t={t}
            numLocale={numLocale}
          />

          {/* Bloque 2 — Rango de exposición */}
          <DiagnosticExposureCard
            diagnostic={diagnostic}
            t={t}
          />

          {/* Bloque 3 — Recomendación + CTA Advisory */}
          <DiagnosticRecommendationCard
            diagnostic={diagnostic}
            t={t}
            onCta={handleAdvisoryCta}
          />

          {/* Bloque 4 — tabla desglose (sin cert/coste €) */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden" data-testid="cbam-diagnostic-table">
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
                    <th className="px-4 py-3 text-center text-xs font-bold uppercase text-gray-500">{t('diagnostic.lineColumn')}</th>
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
                          <td colSpan={2} className="px-4 py-3 text-xs text-amber-700 italic">
                            {t('table.lineError')} — {t('table.errorHint')}
                          </td>
                        ) : noData ? (
                          <>
                            <td className="px-4 py-3 text-right tabular-nums text-gray-400">—</td>
                            <td className="px-4 py-3 text-center">
                              <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-amber-100 text-amber-800 rounded-md text-[10px] font-semibold">
                                {t('table.noOfficialData')}
                              </span>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-3 text-right tabular-nums text-gray-700">{l.totalEmissions.toLocaleString(numLocale, { maximumFractionDigits: 2 })}</td>
                            <td className="px-4 py-3 text-center">
                              <LineTrafficLightBadge light={l.lineTrafficLight} t={t} />
                            </td>
                          </>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {totals?.missingDataCount > 0 && (
              <div className="px-5 py-3 border-t border-gray-100 bg-amber-50/40">
                <p className="text-xs text-gray-600 leading-relaxed">
                  {t('table.noOfficialDataFooter')}{' '}
                  <button
                    type="button"
                    onClick={handleAdvisoryCta}
                    className="text-[#0A3D5C] font-semibold hover:underline"
                  >
                    {t('table.noOfficialDataFooterCta')}
                  </button>
                </p>
              </div>
            )}
          </div>

          {/* Comparativa Calculadora vs Advisory (valor didáctico) */}
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

          {/* Disclaimer al pie */}
          <p className="text-xs text-gray-500 leading-relaxed pt-2" data-testid="cbam-diagnostic-disclaimer">
            {t('diagnostic.disclaimerNote')}
            {showCost && (
              <> · <span className="text-amber-700 font-medium">{t('diagnostic.costShownNote')}</span></>
            )}
          </p>

          {/* Bloque save (intacto) */}
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

// ============================================================
// Subcomponentes del diagnóstico
// ============================================================

const TRAFFIC_LIGHT_STYLES = {
  green: {
    ring: 'ring-emerald-200',
    bg: 'bg-emerald-500',
    text: 'text-emerald-700',
    badgeBg: 'bg-emerald-100',
  },
  yellow: {
    ring: 'ring-amber-200',
    bg: 'bg-amber-500',
    text: 'text-amber-700',
    badgeBg: 'bg-amber-100',
  },
  red: {
    ring: 'ring-red-200',
    bg: 'bg-red-500',
    text: 'text-red-700',
    badgeBg: 'bg-red-100',
  },
}

function DiagnosticTrafficLightBlock({ diagnostic, t, numLocale }) {
  const style = TRAFFIC_LIGHT_STYLES[diagnostic.trafficLight] || TRAFFIC_LIGHT_STYLES.green
  const trafficLight = diagnostic.trafficLight
  return (
    <div
      className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8"
      data-testid="cbam-diagnostic-traffic-light"
      data-traffic-light={trafficLight}
    >
      <div className="flex flex-col sm:flex-row items-start gap-5">
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center ${style.bg} ring-8 ${style.ring} flex-shrink-0`}
          aria-hidden="true"
        >
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d={trafficLight === 'green'
                ? 'M5 13l4 4L19 7'
                : trafficLight === 'yellow'
                  ? 'M12 9v2m0 4h.01M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07'
                  : 'M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'}
            />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`text-lg sm:text-xl font-bold mb-1 ${style.text}`}>
            {t(`diagnostic.trafficLight.${trafficLight}.title`)}
          </h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            {t(`diagnostic.trafficLight.${trafficLight}.message`)}
          </p>
        </div>
      </div>

      {/* 4 métricas neutras */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 pt-5 border-t border-gray-100">
        <MetricTile
          label={t('diagnostic.metrics.totalTonnage')}
          value={`${Number(diagnostic.totalTonnage || 0).toLocaleString(numLocale, { maximumFractionDigits: 2 })} ${t('diagnostic.metrics.totalTonnageUnit')}`}
        />
        <MetricTile
          label={t('diagnostic.metrics.productsCount')}
          value={diagnostic.productCount}
        />
        <MetricTile
          label={t('diagnostic.metrics.installations')}
          value={diagnostic.installationsEstimate}
        />
        <MetricTile
          label={t('diagnostic.metrics.year')}
          value={diagnostic.year}
        />
      </div>
    </div>
  )
}

function MetricTile({ label, value }) {
  return (
    <div className="bg-gray-50 rounded-lg px-3 py-3">
      <p className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold">{label}</p>
      <p className="text-lg font-bold text-[#0A3D5C] tabular-nums">{value ?? '—'}</p>
    </div>
  )
}

const EXPOSURE_LABEL_KEY = {
  low: 'low',
  moderate: 'moderate',
  high: 'high',
  very_high: 'very_high',
}
const EXPOSURE_STYLE = {
  low: 'bg-emerald-100 text-emerald-700',
  moderate: 'bg-amber-100 text-amber-700',
  high: 'bg-orange-100 text-orange-700',
  very_high: 'bg-red-100 text-red-700',
}
const SAVING_LABEL_KEY = {
  negligible: 'negligible',
  moderate: 'moderateSaving',
  significant: 'significant',
}

function DiagnosticExposureCard({ diagnostic, t }) {
  const exposureKey = EXPOSURE_LABEL_KEY[diagnostic.economicExposure] || 'low'
  const exposureStyle = EXPOSURE_STYLE[diagnostic.economicExposure] || EXPOSURE_STYLE.low
  const savingKey = SAVING_LABEL_KEY[diagnostic.potentialSaving] || 'negligible'
  return (
    <div
      className="bg-white border border-gray-200 rounded-2xl p-6"
      data-testid="cbam-diagnostic-exposure"
    >
      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">
        {t('diagnostic.exposure.cardTitle')}
      </h3>
      <dl className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <dt className="text-xs text-gray-500 mb-1">{t('diagnostic.exposure.certificatesLabel')}</dt>
          <dd
            className="text-base font-semibold text-[#0A3D5C]"
            data-testid="cbam-diagnostic-certificates-range"
          >
            {t('diagnostic.exposure.certificatesPrefix')}{' '}
            <span className="font-mono">{diagnostic.certificatesRange?.label || '—'}</span>
          </dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500 mb-1">{t('diagnostic.exposure.exposureLabel')}</dt>
          <dd>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${exposureStyle}`}
              data-testid="cbam-diagnostic-exposure-badge"
            >
              {t(`diagnostic.exposure.${exposureKey}`)}
            </span>
          </dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500 mb-1">{t('diagnostic.exposure.savingsLabel')}</dt>
          <dd className="text-base font-semibold text-gray-900">
            {t(`diagnostic.exposure.${savingKey}`)}
          </dd>
        </div>
      </dl>
    </div>
  )
}

function DiagnosticRecommendationCard({ diagnostic, t, onCta }) {
  const pkg = diagnostic.recommendedPackage || 'basico'
  const titleKey = pkg === 'basico'
    ? 'diagnostic.recommendation.title_basico'
    : pkg === 'completo'
      ? 'diagnostic.recommendation.title_completo'
      : 'diagnostic.recommendation.title_monit'
  const reasonKey = `diagnostic.recommendation.reason_${pkg === 'monitorizacion' ? 'monitorizacion' : pkg}`
  const ctaKey = `diagnostic.recommendation.cta_${pkg === 'monitorizacion' ? 'monitorizacion' : pkg}`

  return (
    <div
      className="bg-gradient-to-br from-[#0A3D5C] to-[#0d5078] rounded-2xl p-6 sm:p-8 text-white"
      data-testid="cbam-diagnostic-recommendation"
      data-recommended-package={pkg}
    >
      <p className="text-xs uppercase tracking-wide text-white/60 font-semibold mb-2">
        {t('diagnostic.recommendation.cardEyebrow')}
      </p>
      <h3 className="text-2xl sm:text-3xl font-bold mb-3">
        {t(titleKey)}
      </h3>
      <p className="text-sm text-white/85 leading-relaxed mb-5 max-w-2xl">
        {t(reasonKey)}
      </p>
      <button
        type="button"
        onClick={onCta}
        className="inline-flex items-center gap-2 px-6 py-3 bg-[#F4C542] text-[#0A3D5C] rounded-xl font-bold text-sm hover:bg-[#f0b922] transition-colors"
        data-testid="cbam-diagnostic-cta"
      >
        {t(ctaKey)}
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </button>
    </div>
  )
}

function LineTrafficLightBadge({ light, t }) {
  const key = light || 'green'
  const styles = {
    green: 'bg-emerald-100 text-emerald-700',
    yellow: 'bg-amber-100 text-amber-700',
    red: 'bg-red-100 text-red-700',
  }
  return (
    <span
      className={`inline-flex items-center justify-center w-4 h-4 rounded-full ${styles[key] || styles.green}`}
      data-testid="cbam-diagnostic-line-light"
      data-line-light={key}
      title={t(`diagnostic.trafficLight.${key}.title`)}
    >
      <span className="sr-only">{t(`diagnostic.trafficLight.${key}.title`)}</span>
    </span>
  )
}
