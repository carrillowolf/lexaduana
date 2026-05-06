'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { CBAMAlert } from '@/components/CBAMAlert'
import AIProcessingConsent from '@/components/consent/AIProcessingConsent'
import { trackEvent } from '@/lib/analytics'
import { useTranslation, useLocale } from '@/lib/i18n'
import { clasificadorDict } from '@/lib/i18n/clasificador'

export default function ClasificadorPage() {
  const [authChecked, setAuthChecked] = useState(false)
  const [authed, setAuthed] = useState(false)
  const [description, setDescription] = useState('')
  const [countryCode, setCountryCode] = useState('CN')
  const [cifValue, setCifValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [countries, setCountries] = useState([])
  const [aiConsent, setAiConsent] = useState(false)

  const router = useRouter()
  const supabase = createClient()
  const t = useTranslation(clasificadorDict)
  const { locale } = useLocale()

  // Verificar sesión
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setAuthed(!!data?.user)
      setAuthChecked(true)
    })
  }, [supabase])

  // Cargar países
  useEffect(() => {
    const loadCountries = async () => {
      const { data } = await supabase
        .from('countries')
        .select('country_code, country_name')
        .order('country_name', { ascending: true })
      if (data) setCountries(data)
    }
    loadCountries()
  }, [supabase])

  const handleClassify = async (e) => {
    e.preventDefault()

    if (!description || description.length < 10) {
      setError(t('errors.minLength'))
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('/api/classify-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          countryCode: countryCode || undefined,
          cifValue: cifValue ? parseFloat(cifValue) : undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || t('errors.apiError'))
      }

      setResult(data)
      trackEvent('classify_product', { confidence: data.classification?.confidence })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCalculate = (hsCode) => {
    const params = new URLSearchParams({
      hsCode,
      countryCode,
      cifValue: cifValue || '1000',
    })
    router.push(`/calculadora?${params.toString()}`)
  }

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return 'text-emerald-700 bg-emerald-50 border-emerald-200'
    if (confidence >= 60) return 'text-amber-700 bg-amber-50 border-amber-200'
    return 'text-red-700 bg-red-50 border-red-200'
  }

  const getConfidenceLabel = (confidence) => {
    if (confidence >= 80) return t('confidence.high')
    if (confidence >= 60) return t('confidence.medium')
    return t('confidence.low')
  }

  // ============================================
  // ESTADOS DE RENDER
  // ============================================
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500 text-sm">{t('loading') || 'Cargando…'}</div>
      </div>
    )
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-slate-50">
        <section className="bg-[#0A3D5C] py-16">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
              {t('auth.title') || 'Clasificador'}{' '}
              <span className="text-[#F4C542]">{t('auth.titleHighlight') || 'con IA'}</span>
            </h1>
            <p className="text-white/70 mb-8">
              {t('auth.subtitle') || 'Obtén el código TARIC de tu producto en segundos.'}
            </p>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
              <p className="text-white/80 mb-4">
                {t('auth.loginRequired') || 'Inicia sesión para usar el clasificador.'}
              </p>
              <button
                onClick={() => router.push('/auth/login?redirect=/clasificador')}
                className="px-7 py-3 bg-[#F4C542] text-[#0A3D5C] font-bold rounded-xl hover:bg-[#F4C542]/90 transition"
              >
                {t('auth.login') || 'Iniciar sesión'}
              </button>
            </div>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* HERO */}
      <section className="relative overflow-hidden bg-[#0A3D5C] py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block px-4 py-1.5 bg-white/10 border border-white/10 text-white/70 rounded-full text-sm font-medium mb-5">
            {t('hero.badge')} · {t('hero.powered')}
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
            {t('hero.title')}
          </h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto leading-relaxed">
            {t('hero.subtitle')}
          </p>
          <p className="text-sm text-white/50 max-w-2xl mx-auto mt-3">
            {t('hero.desc')}
          </p>
        </div>
      </section>

      {/* DISCLAIMER LEGAL */}
      <div className="max-w-4xl mx-auto px-4 pt-8">
        <div className="bg-amber-50 border-l-4 border-amber-400 rounded-r-lg p-5">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div className="text-sm text-slate-700 leading-relaxed">
              <p className="font-semibold text-slate-900 mb-1">{t('disclaimer.title')}</p>
              <p className="text-slate-600" dangerouslySetInnerHTML={{ __html: t('disclaimer.text') }} />
            </div>
          </div>
        </div>
      </div>

      {/* CONTENIDO */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* FORMULARIO */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-slate-900">{t('form.title')}</h2>
            <p className="text-sm text-slate-500 mt-1">{t('form.subtitle')}</p>
          </div>

          <form onSubmit={handleClassify} className="space-y-5">
            {/* Descripción */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                {t('form.descriptionLabel')}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('form.descriptionPlaceholder')}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-[#0A3D5C] focus:ring-2 focus:ring-[#0A3D5C]/20 outline-none transition resize-none text-slate-900"
                rows={5}
                disabled={loading}
              />
              <p className="text-xs text-slate-500 mt-1.5">
                {description.length} {t('form.charCount')}
              </p>
            </div>

            {/* País y Valor */}
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  {t('form.countryLabel')}
                </label>
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-[#0A3D5C] focus:ring-2 focus:ring-[#0A3D5C]/20 outline-none transition bg-white text-slate-900"
                  disabled={loading}
                >
                  <option value="">{t('form.countryPlaceholder')}</option>
                  {countries.map((c) => (
                    <option key={c.country_code} value={c.country_code}>
                      {c.country_name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1.5">{t('form.countryHelp')}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  {t('form.cifLabel')}
                </label>
                <input
                  type="number"
                  value={cifValue}
                  onChange={(e) => setCifValue(e.target.value)}
                  placeholder="10000"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-[#0A3D5C] focus:ring-2 focus:ring-[#0A3D5C]/20 outline-none transition text-slate-900"
                  disabled={loading}
                  min="0"
                  step="0.01"
                />
                <p className="text-xs text-slate-500 mt-1.5">{t('form.cifHelp')}</p>
              </div>
            </div>

            {/* Phase 4: consentimiento RGPD persistido en user_consents */}
            <AIProcessingConsent consentType="ai_processing_classifier" onConsentChange={setAiConsent} />

            {/* Botón principal */}
            <button
              type="submit"
              disabled={loading || description.length < 10 || !aiConsent}
              className="w-full px-6 py-3 bg-[#0A3D5C] text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0A3D5C]/90 transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>{t('form.classifying')}</span>
                </>
              ) : (
                <>
                  <span>🤖</span>
                  <span>{t('form.classify')}</span>
                </>
              )}
            </button>
          </form>

          {/* Error */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}
        </section>

        {/* RESULTADOS */}
        {result && (
          <section className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
            {/* Cabecera resultado */}
            <div className="flex items-center justify-between flex-wrap gap-3 pb-5 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#0A3D5C]/10 text-[#0A3D5C] flex items-center justify-center font-bold">
                  ✓
                </div>
                <h2 className="text-xl font-bold text-slate-900">{t('results.title')}</h2>
              </div>
              <span
                className={`px-3 py-1 border rounded-full text-xs font-semibold ${getConfidenceColor(
                  result.classification.confidence,
                )}`}
              >
                {result.classification.confidence}% · {getConfidenceLabel(result.classification.confidence)}
              </span>
            </div>

            {/* Código HS principal */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
              <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-3">
                {t('results.codeLabel')}
              </p>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <p className="text-4xl font-bold text-[#0A3D5C] font-mono tabular-nums tracking-wider">
                  {result.classification.primaryCode}
                </p>
                {result.classification.primaryCodeExists ? (
                  <span className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-semibold">
                    ✓ {t('results.verified')}
                  </span>
                ) : (
                  <span className="px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-xs font-semibold">
                    ⚠ {t('results.verifyManually')}
                  </span>
                )}
              </div>
              {result.classification.primaryCodeDutyRate !== undefined && (
                <p className="text-sm text-slate-600 mt-3">
                  {t('results.dutyRate')}{' '}
                  <strong className="text-slate-900">
                    {result.classification.primaryCodeDutyRate}%
                  </strong>
                </p>
              )}

              {/* Alerta CBAM si aplica */}
              <div className="mt-3">
                <CBAMAlert hsCode={result.classification.primaryCode} />
              </div>
            </div>

            {/* Razonamiento */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <span>🧠</span>
                {t('results.reasoning')}
              </h3>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                  {result.classification.reasoning}
                </p>
              </div>
            </div>

            {/* Factores clave */}
            {result.classification.keyFactors && result.classification.keyFactors.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-2">
                  {t('results.keyFactors')}
                </h3>
                <div className="grid md:grid-cols-2 gap-2">
                  {result.classification.keyFactors.map((factor, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                    >
                      <span className="text-emerald-600 mt-0.5">✓</span>
                      <span className="text-sm text-slate-700">{factor}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Advertencias */}
            {result.classification.warnings && result.classification.warnings.length > 0 && (
              <div className="bg-amber-50 border-l-4 border-amber-400 rounded-r-lg p-4">
                <h3 className="text-sm font-semibold text-amber-900 mb-2 flex items-center gap-2">
                  <span>⚠️</span>
                  {t('results.warnings')}
                </h3>
                <ul className="space-y-1">
                  {result.classification.warnings.map((warning, idx) => (
                    <li key={idx} className="text-sm text-amber-800">
                      · {warning}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Países recomendados */}
            {result.classification.recommendedOrigins &&
              result.classification.recommendedOrigins.length > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <span>🌍</span>
                    {t('results.recommendedOrigins')}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {result.classification.recommendedOrigins.map((cc, idx) => {
                      const country = countries.find((c) => c.country_code === cc)
                      return (
                        <span
                          key={idx}
                          className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700"
                        >
                          {country?.country_name || cc}
                        </span>
                      )
                    })}
                  </div>
                  <p className="text-xs text-slate-500 mt-3">
                    {t('results.recommendedOriginsHelp')}
                  </p>
                </div>
              )}

            {/* Información adicional */}
            {result.classification.additionalInfo && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <span>ℹ️</span>
                  {t('results.additionalInfo')}
                </h3>
                <p className="text-sm text-slate-700">{result.classification.additionalInfo}</p>
              </div>
            )}

            {/* Botón calcular */}
            <button
              onClick={() => handleCalculate(result.classification.primaryCode)}
              className="w-full px-6 py-3 bg-[#F4C542] text-[#0A3D5C] font-bold rounded-xl hover:bg-[#F4C542]/90 transition flex items-center justify-center gap-2"
            >
              <span>💰</span>
              <span>{t('results.calculate')}</span>
            </button>
          </section>
        )}

        {/* CÓDIGOS ALTERNATIVOS */}
        {result?.classification?.alternativeCodes &&
          result.classification.alternativeCodes.length > 0 && (
            <section className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
              <div className="mb-5">
                <h2 className="text-xl font-bold text-slate-900">{t('alternatives.title')}</h2>
                <p className="text-sm text-slate-500 mt-1">{t('alternatives.subtitle')}</p>
              </div>

              <div className="space-y-3">
                {result.classification.alternativeCodes.map((alt, idx) => (
                  <div
                    key={idx}
                    className="border border-slate-200 rounded-xl p-5 hover:border-[#0A3D5C]/30 transition"
                  >
                    <div className="flex items-start justify-between flex-wrap gap-3 mb-2">
                      <div>
                        <p className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                          {alt.code}
                        </p>
                        {alt.dutyRate !== undefined && (
                          <p className="text-sm text-slate-600 mt-1">
                            {t('alternatives.dutyRate')}{' '}
                            <strong>{alt.dutyRate}%</strong>
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getConfidenceColor(alt.confidence)}`}
                        >
                          {alt.confidence}%
                        </span>
                        {alt.validated && (
                          <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-xs font-semibold">
                            ✓ {t('alternatives.inTaric')}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-slate-600">{alt.reason}</p>
                    <button
                      onClick={() => handleCalculate(alt.code)}
                      className="mt-3 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition text-sm"
                    >
                      {t('alternatives.calculateWith')}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

        {/* METADATA */}
        {result && (
          <div className="text-xs text-slate-500 text-center pb-4">
            {t('metadata.classifiedBy')} {result.metadata.model} ·{' '}
            {new Date(result.metadata.timestamp).toLocaleString(locale === 'en' ? 'en-GB' : 'es-ES')} ·{' '}
            {t('metadata.dataSource')}
          </div>
        )}
      </div>
    </div>
  )
}
