'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import Link from 'next/link'

export default function ClasificadorPage() {
  const [user, setUser] = useState(null)
  const [description, setDescription] = useState('')
  const [countryCode, setCountryCode] = useState('CN')
  const [cifValue, setCifValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [countries, setCountries] = useState([])
  
  const router = useRouter()
  const supabase = createClient()

  // Verificar usuario
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
      } else {
        setUser(user)
      }
    }
    checkUser()
  }, [router, supabase])

  // Cargar países
  useEffect(() => {
    const loadCountries = async () => {
      const { data } = await supabase
        .from('countries')
        .select('code, name_es')
        .order('name_es')
      if (data) setCountries(data)
    }
    loadCountries()
  }, [supabase])

  const handleClassify = async (e) => {
    e.preventDefault()
    
    if (!description || description.length < 10) {
      setError('La descripción debe tener al menos 10 caracteres')
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
          cifValue: cifValue ? parseFloat(cifValue) : undefined
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al clasificar')
      }

      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCalculate = (hsCode) => {
    // Redirigir a calculadora con el código prellenado
    const params = new URLSearchParams({
      hsCode,
      countryCode,
      cifValue: cifValue || '1000'
    })
    router.push(`/calculadora?${params.toString()}`)
  }

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return 'text-emerald-600 bg-emerald-50'
    if (confidence >= 60) return 'text-amber-600 bg-amber-50'
    return 'text-red-600 bg-red-50'
  }

  const getConfidenceLabel = (confidence) => {
    if (confidence >= 80) return 'Alta confianza'
    if (confidence >= 60) return 'Confianza media'
    return 'Baja confianza'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition">
              <img src="/logo.png" alt="LexAduana" className="h-10 w-10" />
              <div>
                <h1 className="text-xl font-bold text-[#0A3D5C]">Clasificador IA</h1>
                <p className="text-xs text-gray-500">Powered by Claude Sonnet 4.5</p>
              </div>
            </Link>

            <Link
              href="/dashboard"
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-[#0A3D5C] hover:bg-gray-50 rounded-lg transition flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Dashboard</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Hero */}
        <div className="mb-8 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
          <div className="flex items-start justify-between">
            <div>
              <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full mb-3">
                <span className="text-xs font-bold">BETA</span>
                <span className="text-xs">•</span>
                <span className="text-xs">Powered by Claude 4.5</span>
              </div>
              <h2 className="text-3xl font-bold mb-3">🤖 Clasificador Inteligente</h2>
              <p className="text-purple-100 text-lg mb-2">
                Describe tu producto en lenguaje natural y obtén la clasificación TARIC
              </p>
              <p className="text-purple-200 text-sm">
                De descripción a código HS en segundos • Validado contra base EUR-Lex
              </p>
            </div>
            <div className="hidden md:block">
              <svg className="w-24 h-24 text-white/20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Disclaimer Legal */}
        <div className="mb-8 bg-amber-50 border border-amber-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <svg className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h4 className="font-bold text-amber-900 mb-2">⚠️ Aviso Legal</h4>
              <p className="text-sm text-amber-800">
                Esta herramienta proporciona <strong>información orientativa</strong> basada en datos públicos de EUR-Lex. 
                No constituye asesoramiento legal ni aduanero vinculante. Para clasificaciones definitivas, 
                consulte con un agente de aduanas colegiado o la AEAT.
              </p>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-8 py-6 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900">Describe tu producto</h3>
            <p className="text-sm text-gray-600 mt-1">Sé lo más específico posible: material, función, uso...</p>
          </div>

          <form onSubmit={handleClassify} className="p-8 space-y-6">
            {/* Descripción */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Descripción del producto *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej: Tablets con teclado integrado QWERTY desmontable, pantalla táctil de 10 pulgadas, procesador Intel, para uso industrial en almacenes"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all resize-none"
                rows={5}
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-2">
                {description.length} caracteres (mínimo 10)
              </p>
            </div>

            {/* País y Valor (Opcional) */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  País de origen (opcional)
                </label>
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all"
                  disabled={loading}
                >
                  <option value="">Seleccionar país...</option>
                  {countries.map(c => (
                    <option key={c.code} value={c.code}>{c.name_es}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Ayuda a determinar aranceles aplicables
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Valor CIF en € (opcional)
                </label>
                <input
                  type="number"
                  value={cifValue}
                  onChange={(e) => setCifValue(e.target.value)}
                  placeholder="10000"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all"
                  disabled={loading}
                  min="0"
                  step="0.01"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Para cálculo directo posterior
                </p>
              </div>
            </div>

            {/* Botón */}
            <button
              type="submit"
              disabled={loading || description.length < 10}
              className="w-full px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Clasificando con IA...</span>
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <span>🤖 Clasificar con IA</span>
                </>
              )}
            </button>
          </form>

          {/* Error */}
          {error && (
            <div className="px-8 pb-8">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-sm text-red-700 flex items-start">
                  <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Resultados */}
        {result && (
          <div className="space-y-6">
            {/* Código Principal */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-8 py-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-white">Clasificación Sugerida</h3>
                  </div>
                  <span className={`px-4 py-2 rounded-full text-sm font-bold ${getConfidenceColor(result.classification.confidence)}`}>
                    {result.classification.confidence}% - {getConfidenceLabel(result.classification.confidence)}
                  </span>
                </div>
              </div>

              <div className="p-8 space-y-6">
                {/* Código HS */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border-2 border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">Código TARIC sugerido:</p>
                  <div className="flex items-center justify-between">
                    <p className="text-4xl font-bold text-gray-900 font-mono tracking-wider">
                      {result.classification.primaryCode}
                    </p>
                    {result.classification.primaryCodeExists ? (
                      <span className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-bold flex items-center space-x-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Verificado en TARIC</span>
                      </span>
                    ) : (
                      <span className="px-4 py-2 bg-amber-100 text-amber-700 rounded-lg text-sm font-bold flex items-center space-x-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span>Verificar manualmente</span>
                      </span>
                    )}
                  </div>
                  {result.classification.primaryCodeDutyRate !== undefined && (
                    <p className="text-sm text-gray-600 mt-3">
                      Arancel ERGA OMNES: <strong>{result.classification.primaryCodeDutyRate}%</strong>
                    </p>
                  )}
                </div>

                {/* Razonamiento */}
                <div>
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Razonamiento de la IA
                  </h4>
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                    <p className="text-sm text-gray-700 whitespace-pre-line">
                      {result.classification.reasoning}
                    </p>
                  </div>
                </div>

                {/* Factores Clave */}
                {result.classification.keyFactors && result.classification.keyFactors.length > 0 && (
                  <div>
                    <h4 className="font-bold text-gray-900 mb-3">Factores clave de clasificación:</h4>
                    <div className="grid md:grid-cols-2 gap-3">
                      {result.classification.keyFactors.map((factor, idx) => (
                        <div key={idx} className="flex items-start space-x-2 bg-blue-50 rounded-lg p-3">
                          <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-sm text-gray-700">{factor}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Advertencias */}
                {result.classification.warnings && result.classification.warnings.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <h4 className="font-bold text-amber-900 mb-2 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Advertencias
                    </h4>
                    <ul className="space-y-1">
                      {result.classification.warnings.map((warning, idx) => (
                        <li key={idx} className="text-sm text-amber-800">• {warning}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Botón Calcular */}
                <button
                  onClick={() => handleCalculate(result.classification.primaryCode)}
                  className="w-full px-8 py-4 bg-gradient-to-r from-[#0A3D5C] to-[#0d5078] hover:from-[#083049] hover:to-[#0A3D5C] text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-3"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span>💰 Calcular aranceles con este código</span>
                </button>
              </div>
            </div>

            {/* Códigos Alternativos */}
            {result.classification.alternativeCodes && result.classification.alternativeCodes.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-8 py-6 border-b border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900">Códigos Alternativos</h3>
                  <p className="text-sm text-gray-600 mt-1">Otras clasificaciones posibles según contexto</p>
                </div>

                <div className="p-8 space-y-4">
                  {result.classification.alternativeCodes.map((alt, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:border-indigo-300 transition">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-2xl font-bold text-gray-900 font-mono">{alt.code}</p>
                          {alt.dutyRate !== undefined && (
                            <p className="text-sm text-gray-600 mt-1">Arancel: {alt.dutyRate}%</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${getConfidenceColor(alt.confidence)}`}>
                            {alt.confidence}%
                          </span>
                          {alt.validated && (
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                              En TARIC
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-700">{alt.reason}</p>
                      <button
                        onClick={() => handleCalculate(alt.code)}
                        className="mt-4 px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-medium rounded-lg transition text-sm"
                      >
                        Calcular con este código →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-500 text-center">
              Clasificación realizada por {result.metadata.model} • {new Date(result.metadata.timestamp).toLocaleString('es-ES')} • 
              Datos basados en EUR-Lex actualizado Oct 2025
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
