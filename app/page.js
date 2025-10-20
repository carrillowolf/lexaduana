'use client'

import { useState, useEffect } from 'react'
import { exportToPDF } from '../components/ExportPDF'
import HSCodeAutocomplete from '../components/HSCodeAutocomplete'
import HeroLanding from '../components/HeroLanding'
import QuickAccessButton from '../components/QuickAccessButton'
import UserMenu from '../components/UserMenu'
import { createClient } from '@/lib/supabase-browser'
import ExchangeRateWidget from '../components/ExchangeRateWidget'
import FeaturesLanding from '../components/FeaturesLanding'
import TargetAudience from '../components/TargetAudience'
import FooterLanding from '../components/FooterLanding'
import FavoriteButton from '../components/FavoriteButton'

export default function Home() {
  const [user, setUser] = useState(null)
  const supabase = createClient()
  const [hsCode, setHsCode] = useState('')
  const [cifValue, setCifValue] = useState('')
  const [countryCode, setCountryCode] = useState('ERGA OMNES')
  const [countries, setCountries] = useState([])
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [suggestions, setSuggestions] = useState(null)
  const [recentSearches, setRecentSearches] = useState([])
  const [selectedCurrency, setSelectedCurrency] = useState('EUR')
  const [exchangeRates, setExchangeRates] = useState([])
  const [convertedValue, setConvertedValue] = useState(null)

  // Verificar usuario
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [supabase])

  // Cargar tipos de cambio
  useEffect(() => {
    const fetchExchangeRates = async () => {
      try {
        const response = await fetch('/api/exchange-rates')
        const data = await response.json()
        if (data.success) {
          setExchangeRates(data.data)
        }
      } catch (error) {
        console.error('Error cargando tipos de cambio:', error)
      }
    }
    fetchExchangeRates()
  }, [])

  // Cargar lista de países y búsquedas recientes al iniciar
  useEffect(() => {
    fetchCountries()
    loadRecentSearches()
  }, [])

  const loadRecentSearches = () => {
    if (typeof window !== 'undefined') {
      const recent = JSON.parse(localStorage.getItem('recentHSCodes') || '[]')
      // Convertir formato antiguo si es necesario
      const formatted = recent.map(item => {
        if (typeof item === 'string') {
          return {
            code: item,
            description: 'Búsqueda anterior',
            timestamp: new Date().toISOString()
          }
        }
        return item
      })
      setRecentSearches(formatted.slice(0, 5))
    }
  }

  const fetchCountries = async () => {
    try {
      const response = await fetch('/api/calculate')
      const data = await response.json()
      if (data.success) {
        setCountries(data.countries)
      }
    } catch (err) {
      console.error('Error cargando países:', err)
    }
  }

  const calculate = async (e, specificCode = null) => {
    if (e) e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)
    setSuggestions(null)

    // Usar valor convertido si existe, si no el original
    const finalCifValue = convertedValue ? convertedValue.eurValue : parseFloat(cifValue)

    try {
      const response = await fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hsCode: specificCode || hsCode,
          cifValue: finalCifValue,
          countryCode
        })
      })

      const data = await response.json()

      if (data.incomplete && data.suggestions) {
        // Mostrar sugerencias de códigos hijos
        setSuggestions(data)
        setLoading(false)
        return
      }

      if (!response.ok) {
        throw new Error(data.error || 'Error en el cálculo')
      }

      // Añadir información de conversión al resultado
      if (convertedValue) {
        data.data.conversionInfo = convertedValue
      }

      setResult(data.data)

      // Guardar cálculo si el usuario está logueado
      try {
        const supabase = (await import('@/lib/supabase-browser')).createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          await fetch('/api/calculations/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              hsCode: data.data.hsCode,
              cifValue: data.data.cifValue,
              countryCode: data.data.country.code,
              countryName: data.data.country.name,
              dutyRate: data.data.duty.appliedRate,
              dutyAmount: data.data.duty.amount,
              vatRate: data.data.vat.rate,
              vatType: data.data.vat.type,
              vatAmount: data.data.vat.amount,
              totalAmount: data.data.total,
              description: data.data.description,
              // Guardar info de conversión
              originalCurrency: selectedCurrency,
              originalValue: convertedValue ? convertedValue.original : finalCifValue
            })
          })
        }
      } catch (saveError) {
        // No mostrar error al usuario, solo loguear
        console.log('No se pudo guardar el cálculo:', saveError)
      }

      // Actualizar búsquedas recientes después de un cálculo exitoso
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          const recent = JSON.parse(localStorage.getItem('recentHSCodes') || '[]')
          setRecentSearches(recent.slice(0, 5))
        }, 100)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(value)
  }

  const clearAll = () => {
    setResult(null)
    setSuggestions(null)
    setHsCode('')
    setCifValue('')
    setCountryCode('ERGA OMNES')
    setError('')
  }

  const quickSearch = (code) => {
    setHsCode(code)
    if (cifValue) {
      // Si ya hay un valor CIF, calcular directamente
      calculate(null, code)
    }
  }

  // Convertir moneda cuando cambia el valor o la moneda
  useEffect(() => {
    if (cifValue && selectedCurrency !== 'EUR') {
      const rate = exchangeRates.find(r => r.currency_code === selectedCurrency)
      if (rate) {
        const eurValue = parseFloat(cifValue) / parseFloat(rate.rate)
        setConvertedValue({
          original: parseFloat(cifValue),
          currency: selectedCurrency,
          rate: parseFloat(rate.rate),
          eurValue: eurValue
        })
      }
    } else {
      setConvertedValue(null)
    }
  }, [cifValue, selectedCurrency, exchangeRates])

  // Agrupar países por tipo de acuerdo
  const groupedCountries = countries.reduce((acc, country) => {
    const group = country.agreement_type || 'Otros'
    if (!acc[group]) acc[group] = []
    acc[group].push(country)
    return acc
  }, {})

  const scrollToCalculator = () => {
    document.getElementById('calculator').scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    })
  }

  return (
    <div className="min-h-screen">
      {/* Quick Access Button */}
      <QuickAccessButton />
      
      {/* Hero Section - Solo para no logueados */}
      {!user && <HeroLanding />}

      {/* Secciones del landing solo para no logueados */}
      {!user && (
        <>
          <FeaturesLanding />
          <TargetAudience />
        </>
      )}
      
      {/* Calculator Section */}
      <div id="calculator" className="min-h-screen bg-gray-50 py-20">
      <div className="container mx-auto px-4 py-12">
          <header className="mb-12">
            <div className="flex justify-end mb-4">
              <UserMenu />
            </div>
            <div className="text-center">
              <h2 className="text-4xl font-bold text-[#0A3D5C] mb-3">
                Calculadora TARIC Profesional
              </h2>
              <p className="text-lg text-gray-600">
                Calcula aranceles e IVA para importaciones en la UE
              </p>
              <div className="mt-4 flex justify-center gap-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#F4C542]/20 text-[#0A3D5C] border border-[#F4C542]">
                  ✓ {countries.length} países con acuerdos
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#0A3D5C]/10 text-[#0A3D5C] border border-[#0A3D5C]">
                  ✓ Base de datos actualizada 2025
                </span>
              </div>
            </div>
          </header>

          {/* Widget tipos de cambio */}
          <ExchangeRateWidget />

        <div className="max-w-4xl mx-auto">
          {/* Búsquedas recientes */}
          {recentSearches.length > 0 && !result && (
            <div className="mb-6 bg-white rounded-lg shadow-md p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Búsquedas recientes:</h3>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => quickSearch(item.code)}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-700 transition-colors"
                  >
                    <span className="font-mono mr-2">{item.code}</span>
                    <span className="text-xs text-gray-500 truncate max-w-[150px]">
                      {typeof item.description === 'string' 
                        ? item.description?.split('→')[0]?.trim()
                        : 'Búsqueda anterior'
                      }
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-xl p-8">
            <form onSubmit={calculate} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código HS / TARIC
                  </label>
                  <HSCodeAutocomplete
                    value={hsCode}
                    onChange={setHsCode}
                    onSelect={(suggestion) => {
                      console.log('Código seleccionado:', suggestion)
                    }}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Escriba al menos 2 dígitos para ver sugerencias
                  </p>
                </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Valor CIF
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={cifValue}
                        onChange={(e) => setCifValue(e.target.value)}
                        placeholder="1000"
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                      <select
                        value={selectedCurrency}
                        onChange={(e) => setSelectedCurrency(e.target.value)}
                        className="w-24 px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="EUR">EUR</option>
                        {exchangeRates.map(rate => (
                          <option key={rate.currency_code} value={rate.currency_code}>
                            {rate.currency_code}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Mostrar conversión */}
                    {convertedValue && (
                      <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-800">
                          💱 {convertedValue.original.toLocaleString('es-ES')} {convertedValue.currency} = <strong>{convertedValue.eurValue.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR</strong>
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          Tipo oficial: 1 EUR = {convertedValue.rate.toLocaleString('es-ES', { minimumFractionDigits: 4 })} {convertedValue.currency}
                        </p>
                      </div>
                    )}
                  </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  País de origen 🌍
                </label>
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                >
                  <option value="ERGA OMNES">📍 Seleccionar país...</option>
                  
                  {Object.entries(groupedCountries).map(([groupName, groupCountries]) => (
                    <optgroup key={groupName} label={`━━ ${groupName} ━━`}>
                      {groupCountries.map(country => (
                        <option key={country.country_code} value={country.country_code}>
                          {country.country_name}
                          {country.agreement_type === 'Sanciones' && ' ⚠️'}
                          {country.agreement_type === 'EBA' && ' ★'}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                
                {countryCode !== 'ERGA OMNES' && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-700">
                      {countries.find(c => c.country_code === countryCode)?.notes}
                    </p>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                  className="w-full bg-[#F4C542] text-[#0A3D5C] py-4 px-6 rounded-lg font-bold text-lg hover:bg-[#E5B63A] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Calculando...
                  </span>
                ) : 'Calcular aranceles e impuestos'}
              </button>
              
              {/* Botón limpiar - Solo visible si hay datos */}
              {(hsCode || cifValue || countryCode !== 'ERGA OMNES') && (
                <button
                  type="button"
                  onClick={clearAll}
                    className="w-full border-2 border-[#0A3D5C] text-[#0A3D5C] py-4 px-6 rounded-lg font-semibold text-lg hover:bg-[#0A3D5C] hover:text-white transition-all duration-200"
                >
                  Limpiar todo
                </button>
              )}
            </form>

            {error && (
              <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {suggestions && (
              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-amber-900 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {suggestions.message}
                  </h3>
                  <p className="text-sm text-amber-700 mt-1">
                    Se encontraron {suggestions.suggestions.length} códigos que empiezan con {suggestions.originalCode}
                  </p>
                </div>
                
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {suggestions.suggestions.map((item) => (
                    <button
                      key={item.goods_code}
                      onClick={() => {
                        setHsCode(item.goods_code)
                        calculate(null, item.goods_code)
                      }}
                      className="w-full text-left p-3 bg-white hover:bg-amber-100 rounded-lg border border-amber-300 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <span className="font-semibold text-gray-900">
                            📦 {item.goods_code}
                          </span>
                          <p className="text-sm text-gray-600 mt-1">
                            {item.description}
                          </p>
                        </div>
                        <span className="ml-4 px-2 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded">
                          {item.duty}%
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
                
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-700">
                    💡 <strong>Consejo:</strong> Seleccione el código que mejor describa su producto. 
                    Para mayor precisión, utilice siempre el código completo de 10 dígitos.
                  </p>
                </div>
              </div>
            )}

              {result && (
                <div className="mt-8 space-y-6">
                  <div className="border-t-2 border-gray-100 pt-6">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                      <svg className="w-6 h-6 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Resultado del cálculo
                    </h2>

                    {/* Info de conversión */}
                    {result.conversionInfo && (
                      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                        <h3 className="font-semibold text-gray-800 mb-2">💱 Conversión de Moneda</h3>
                        <div className="grid md:grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-gray-600">Valor original:</span>
                            <p className="font-semibold text-gray-900">
                              {result.conversionInfo.original.toLocaleString('es-ES')} {result.conversionInfo.currency}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-600">Valor en EUR:</span>
                            <p className="font-semibold text-gray-900">
                              {result.conversionInfo.eurValue.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 mt-2">
                          Tipo oficial: 1 EUR = {result.conversionInfo.rate.toLocaleString('es-ES', { minimumFractionDigits: 4 })} {result.conversionInfo.currency}
                        </p>
                      </div>
                    )}

                    {result.description && (
                      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-gray-700">
                          <span className="font-semibold text-gray-900">📦 Producto:</span> {result.description}
                        </p>
                      </div>
                    )}

                  {result.country.agreement && (
                    <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg border border-amber-200">
                      <div className="flex items-start">
                        <span className="text-2xl mr-3">⚠️</span>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 mb-1">
                            Atención: {result.country.name} - {result.country.agreement}
                          </p>
                          <p className="text-sm text-gray-700">{result.country.notes}</p>
                          <p className="text-xs text-gray-600 mt-2">
                            <strong>Importante:</strong> Los aranceles preferenciales varían según el producto específico y requieren documentación de origen. 
                            Este cálculo muestra el arancel general. Consulte el acuerdo específico para confirmar las preferencias aplicables.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                    {/* Alertas de medidas */}
                    {result.alerts && result.alerts.length > 0 && (
                      <div className="mb-6 space-y-3">
                        <h3 className="font-semibold text-gray-900 flex items-center">
                          <svg className="w-5 h-5 mr-2 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          Requisitos y condiciones especiales
                        </h3>

                        {result.alerts.map((alert, index) => {
                          // Determinar color y emoji según tipo y prioridad
                          let bgColor, borderColor, textColor, icon

                          if (alert.priority === 1) {
                            bgColor = 'bg-red-50'
                            borderColor = 'border-red-300'
                            textColor = 'text-red-800'
                            icon = '🚨'
                          } else if (alert.priority === 2) {
                            bgColor = 'bg-amber-50'
                            borderColor = 'border-amber-300'
                            textColor = 'text-amber-800'
                            icon = '⚠️'
                          } else {
                            bgColor = 'bg-blue-50'
                            borderColor = 'border-blue-300'
                            textColor = 'text-blue-800'
                            icon = 'ℹ️'
                          }

                          // Icono específico según tipo
                          if (alert.alert_type === 'certificate') icon = '📋'
                          else if (alert.alert_type === 'quota') icon = '📊'
                          else if (alert.alert_type === 'sanction') icon = '🚫'

                          // Determinar si es una alerta condicional (por grupo de países)
                          const isConditional = alert.origin_code && /^\d+$/.test(alert.origin_code)

                          return (
                            <div key={index} className={`p-4 ${bgColor} ${borderColor} border-l-4 rounded-r-lg`}>
                              <div className="flex items-start">
                                <span className="text-2xl mr-3 flex-shrink-0">{icon}</span>
                                <div className="flex-1">
                                  <p className={`font-medium ${textColor} mb-1`}>
                                    {alert.short_text}
                                  </p>

                                  {isConditional && (
                                    <div className="mt-2 p-2 bg-white bg-opacity-60 rounded text-xs">
                                      <p className="text-gray-700">
                                        ℹ️ Esta medida aplica solo a ciertos orígenes específicos (grupo {alert.origin_code}).
                                        {alert.origin_code === '1006' && ' Puede estar relacionado con sanciones a Rusia/Bielorrusia.'}
                                        {' '}Verifique si aplica a {result.country.name}.
                                      </p>
                                    </div>
                                  )}

                                  {alert.certificate && (
                                    <p className="text-xs text-gray-600 mt-2">
                                      Certificado requerido: <span className="font-mono font-semibold bg-white px-2 py-0.5 rounded">{alert.certificate}</span>
                                    </p>
                                  )}

                                  {alert.full_text && (
                                    <details className="mt-2">
                                      <summary className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer font-medium">
                                        Ver información completa
                                      </summary>
                                      <div className="mt-2 p-3 bg-white rounded text-xs text-gray-700 whitespace-pre-line border border-gray-200">
                                        {alert.full_text}
                                      </div>
                                    </details>
                                  )}
                                </div>
                                <span className={`ml-3 px-2 py-1 rounded text-xs font-medium ${alert.priority === 1 ? 'bg-red-200 text-red-800' :
                                    alert.priority === 2 ? 'bg-amber-200 text-amber-800' :
                                      'bg-blue-200 text-blue-800'
                                  }`}>
                                  {alert.priority === 1 ? 'CRÍTICO' : alert.priority === 2 ? 'IMPORTANTE' : 'INFO'}
                                </span>
                              </div>
                            </div>
                          )
                        })}

                        <div className="mt-3 p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200">
                          <p className="text-xs text-gray-700">
                            <strong>⚠️ Importante:</strong> Las alertas mostradas pueden no aplicar todas al país seleccionado ({result.country.name}).
                            Algunos requisitos son específicos de ciertos acuerdos comerciales o grupos de países.
                            <strong className="text-blue-700"> Verifique siempre con las autoridades aduaneras</strong> qué documentación es obligatoria para su importación específica.
                          </p>
                        </div>
                      </div>
                    )}

                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-600">Valor CIF:</span>
                      <span className="font-semibold text-lg">{formatCurrency(result.cifValue)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <div>
                        <span className="text-gray-600">Arancel </span>
                        {result.duty.standardRate !== result.duty.appliedRate && (
                          <span className="text-xs text-gray-500 line-through">
                            ({result.duty.standardRate}%)
                          </span>
                        )}
                        <span className="text-gray-600"> → {result.duty.appliedRate}%:</span>
                      </div>
                      <span className="font-semibold text-lg">
                        {formatCurrency(result.duty.amount)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-600">Base imponible IVA:</span>
                      <span className="font-medium">{formatCurrency(result.customsBase)}</span>
                    </div>
                    
                    <div className="text-gray-600">
                      <div className="flex items-center gap-2">
                        <span>IVA ({result.vat.rate}%):</span>
                        {result.vat.type && result.vat.type !== 'general' && (
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${result.vat.type === 'superreducido'
                               ? 'bg-green-100 text-green-700'
                               : 'bg-blue-100 text-blue-700'
                            }`}>
                            {result.vat.type === 'superreducido' ? '4% Superreducido' : '10% Reducido'}
                          </span>
                        )}
                      </div>
                      {result.vat.type && result.vat.type !== 'general' && (
                        <p className="text-xs text-gray-500 mt-1">
                          {result.vat.type === 'superreducido'
                            ? 'Productos básicos de primera necesidad'
                            : 'Alimentos y servicios esenciales'}
                        </p>
                      )}
                    </div>
                    
                    <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-lg font-bold text-gray-800">
                            TOTAL A PAGAR:
                          </span>
                          {result.duty.savings > 0 && (
                            <p className="text-xs text-green-600 mt-1">
                              Incluye ahorro de {formatCurrency(result.duty.savings)} por acuerdo
                            </p>
                          )}
                        </div>
                        <span className="text-2xl font-bold text-green-600">
                          {formatCurrency(result.total)}
                        </span>
                      </div>
                    </div>

                    {/* Botón Favoritos */}
                    <div className="mt-4">
                      <FavoriteButton
                        hsCode={result.hsCode}
                        countryCode={result.country.code}
                        cifValue={result.cifValue}
                        calculationData={result}
                      />
                    </div>

                    <div className="mt-4 flex gap-3">
                      <button 
                        onClick={() => exportToPDF(result, formatCurrency)}
                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center justify-center font-medium"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Exportar PDF
                      </button>
                      <button 
                        onClick={() => window.print()}
                        className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition flex items-center justify-center"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Imprimir
                      </button>
                      <button 
                        onClick={clearAll}
                        className="flex-1 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition flex items-center justify-center"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Nuevo cálculo
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 grid md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-semibold text-gray-700 mb-2 flex items-center">
                <span className="text-blue-500 mr-2">📋</span>
                Documentación origen
              </h3>
              <p className="text-sm text-gray-600">
                EUR.1, REX, Declaración en factura según acuerdo
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-semibold text-gray-700 mb-2 flex items-center">
                <span className="text-amber-500 mr-2">⚠️</span>
                Importante
              </h3>
              <p className="text-sm text-gray-600">
                Las preferencias dependen del producto específico
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-semibold text-gray-700 mb-2 flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Siempre verificar
              </h3>
              <p className="text-sm text-gray-600">
                Consultar acuerdo específico y reglas de origen
              </p>
            </div>
          </div>
        </div>

        <footer className="text-center mt-12 text-gray-600 text-sm">
          <p>© 2025 Lexaduana - Calculadora TARIC profesional</p>
          <p className="mt-2">
            <a href="https://lexaduana.es" className="text-blue-600 hover:underline">lexaduana.es</a>
            {' | '}
            <a href="https://lexaduana.eu" className="text-blue-600 hover:underline">lexaduana.eu</a>
          </p>
        </footer>
      </div>
      </div>
      {/* Footer solo para no logueados */}
      {!user && <FooterLanding />}
    </div> 
  )
}