'use client'

import { useState, useEffect } from 'react'
import { exportToPDF } from '../../components/ExportPDF'
import HSCodeAutocomplete from '../../components/HSCodeAutocomplete'
import QuickAccessButton from '../../components/QuickAccessButton'
import UserMenu from '../../components/UserMenu'
import { createClient } from '@/lib/supabase-browser'
// import ExchangeRateWidget from '../../components/ExchangeRateWidget'
import FavoriteButton from '../../components/FavoriteButton'
import Link from 'next/link'
import ExchangeRateBanner from '../../components/ExchangeRateBanner'

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

  const groupedCountries = countries.reduce((acc, country) => {
    const group = country.agreement_type || 'Otros'
    if (!acc[group]) acc[group] = []
    acc[group].push(country)
    return acc
  }, {})
  
  const calculate = async (e, specificCode = null) => {
    if (e) e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)
    setSuggestions(null)

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
        setSuggestions(data)
        setLoading(false)
        return
      }

      if (!response.ok) {
        throw new Error(data.error || 'Error en el cálculo')
      }

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
              originalCurrency: selectedCurrency,
              originalValue: convertedValue ? convertedValue.original : finalCifValue
            })
          })
        }
      } catch (saveError) {
        console.log('No se pudo guardar el cálculo:', saveError)
      }

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

  const handleCurrencyChange = (e) => {
    const newCurrency = e.target.value
    setSelectedCurrency(newCurrency)
    
    if (cifValue && newCurrency !== 'EUR') {
      const rate = exchangeRates.find(r => r.currency === newCurrency)
      if (rate) {
        const eurValue = parseFloat(cifValue) / rate.rate
        setConvertedValue({
          original: parseFloat(cifValue),
          currency: newCurrency,
          rate: rate.rate,
          eurValue: eurValue
        })
      }
    } else {
      setConvertedValue(null)
    }
  }

  const handleCifValueChange = (e) => {
    const value = e.target.value
    setCifValue(value)
    
    if (value && selectedCurrency !== 'EUR') {
      const rate = exchangeRates.find(r => r.currency === selectedCurrency)
      if (rate) {
        const eurValue = parseFloat(value) / rate.rate
        setConvertedValue({
          original: parseFloat(value),
          currency: selectedCurrency,
          rate: rate.rate,
          eurValue: eurValue
        })
      }
    } else {
      setConvertedValue(null)
    }
  }

  const clearAll = () => {
    setHsCode('')
    setCifValue('')
    setCountryCode('ERGA OMNES')
    setResult(null)
    setError('')
    setSuggestions(null)
    setSelectedCurrency('EUR')
    setConvertedValue(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header mejorado - Sin solapamiento */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition">
              <img src="/logo.png" alt="LexAduana" className="h-10 w-10" />
              <div>
                <h1 className="text-xl font-bold text-[#0A3D5C]">LexAduana</h1>
                <p className="text-xs text-gray-500">Calculadora TARIC</p>
              </div>
            </Link>
            
            <nav className="hidden md:flex items-center space-x-1">
              <Link href="/calculadora" className="px-4 py-2 text-sm font-medium text-[#0A3D5C] bg-blue-50 rounded-lg transition">
                Calculadora
              </Link>
              <Link href="/tipos-cambio" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-[#0A3D5C] hover:bg-gray-50 rounded-lg transition">
                Tipos de Cambio
              </Link>
            </nav>

            <UserMenu />
          </div>
        </div>
      </header>
      <ExchangeRateBanner />

      {/* Contenido principal - Calculadora */}
      <div className="pt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          
          {/* Quick Access Buttons - SOLO para logueados */}
          {user && (
            <div className="mb-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {/* Dashboard */}
              <Link
                href="/dashboard"
                className="group relative bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 shadow-lg hover:shadow-2xl transition-all hover:scale-105"
              >
                <div className="flex flex-col items-center text-white">
                  <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <h3 className="font-bold text-sm">Dashboard</h3>
                  <p className="text-xs text-blue-100">Historial y stats</p>
                </div>
              </Link>

              {/* Comparador */}
              <Link
                href="/comparador"
                className="group relative bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl p-4 shadow-lg hover:shadow-2xl transition-all hover:scale-105"
              >
                <div className="flex flex-col items-center text-white">
                  <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="font-bold text-sm">Comparador</h3>
                  <p className="text-xs text-emerald-100">5 países</p>
                </div>
              </Link>

              {/* Favoritos */}
              <Link
                href="/favoritos"
                className="group relative bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-4 shadow-lg hover:shadow-2xl transition-all hover:scale-105"
              >
                <div className="flex flex-col items-center text-white">
                  <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  <h3 className="font-bold text-sm">Favoritos</h3>
                  <p className="text-xs text-amber-100">Guardados</p>
                </div>
              </Link>

              {/* Tipos de Cambio */}
              <Link
                href="/tipos-cambio"
                className="group relative bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-4 shadow-lg hover:shadow-2xl transition-all hover:scale-105"
              >
                <div className="flex flex-col items-center text-white">
                  <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="font-bold text-sm">Tipos Cambio</h3>
                  <p className="text-xs text-indigo-100">30 monedas</p>
                </div>
              </Link>

              {/* Calculadora Masiva */}
              <Link
                href="/bulk"
                className="group relative bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-4 shadow-lg hover:shadow-2xl transition-all hover:scale-105"
              >
                <div className="flex flex-col items-center text-white">
                  <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="font-bold text-sm">Calc. Masiva</h3>
                  <p className="text-xs text-purple-100">100 productos</p>
                </div>
              </Link>
            </div>
          )}

          {/* Grid principal: Calculadora + Sidebar */}
          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Calculadora principal */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Card del formulario */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
                {/* Header con gradiente */}
                <div className="bg-gradient-to-r from-[#0A3D5C] to-[#0d5078] px-8 py-6">
                  <h2 className="text-2xl font-bold text-white mb-2">Calculadora de Aranceles</h2>
                  <p className="text-blue-100 text-sm">Calcula aranceles e IVA para tus importaciones a España</p>
                </div>

                {/* Formulario */}
                <form onSubmit={calculate} className="p-8 space-y-6">
                  
                  {/* Código HS */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Código TARIC (HS)
                      <span className="ml-2 text-xs font-normal text-gray-500">10 dígitos</span>
                    </label>
                    <HSCodeAutocomplete
                      value={hsCode}
                      onChange={setHsCode}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#0A3D5C] focus:ring-4 focus:ring-[#0A3D5C]/10 outline-none transition-all"
                    />
                  </div>

                  {/* Valor CIF con selector de moneda */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Valor CIF
                      <span className="ml-2 text-xs font-normal text-gray-500">Coste + Seguro + Flete</span>
                    </label>
                    <div className="flex gap-3">
                      <input
                        type="number"
                        value={cifValue}
                        onChange={handleCifValueChange}
                        placeholder="Ej: 10000"
                        min="0"
                        step="0.01"
                        required
                        className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#0A3D5C] focus:ring-4 focus:ring-[#0A3D5C]/10 outline-none transition-all"
                      />
                      <select
                        value={selectedCurrency}
                        onChange={handleCurrencyChange}
                        className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#0A3D5C] focus:ring-4 focus:ring-[#0A3D5C]/10 outline-none transition-all bg-white font-medium"
                      >
                        <option value="EUR">EUR €</option>
                        {exchangeRates && exchangeRates
                          .filter(rate => rate && rate.currency)
                          .map((rate, index) => (
                            <option key={`currency-${rate.currency}-${index}`} value={rate.currency}>
                              {rate.currency} {rate.symbol}
                            </option>
                          ))}
                      </select>
                    </div>
                    
                    {/* Info de conversión */}
                    {convertedValue && (
                      <div className="mt-2 p-3 bg-gradient-to-r from-amber-50 to-yellow-50 border border-[#F4C542]/30 rounded-lg">
                        <p className="text-sm text-gray-700">
                          <span className="font-semibold text-[#0A3D5C]">
                            {convertedValue.original.toLocaleString('es-ES', { minimumFractionDigits: 2 })} {convertedValue.currency}
                          </span>
                          <span className="mx-2 text-gray-400">→</span>
                          <span className="font-bold text-[#0A3D5C]">
                            {formatCurrency(convertedValue.eurValue)}
                          </span>
                          <span className="ml-2 text-xs text-gray-500">
                            (Tipo: {convertedValue.rate.toFixed(6)})
                          </span>
                        </p>
                      </div>
                    )}
                  </div>

                  {/* País de origen */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      País de Origen
                      <span className="ml-2 text-xs font-normal text-gray-500">Selecciona el origen de la mercancía</span>
                    </label>
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#0A3D5C] focus:ring-4 focus:ring-[#0A3D5C]/10 outline-none transition-all bg-white font-medium"
                    >
                      <option value="ERGA OMNES">Terceros países (ERGA OMNES)</option>
                      {Object.entries(groupedCountries).map(([group, countriesInGroup]) => (
                        <optgroup key={group} label={group}>
                          {countriesInGroup.map(country => (
                            <option key={country.country_code} value={country.country_code}>
                              {country.country_name}
                              {country.has_agreement && ' ⭐'}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  {/* Botón calcular */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-[#0A3D5C] to-[#0d5078] hover:from-[#083049] hover:to-[#0A3D5C] text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Calculando...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <span>Calcular Aranceles</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Errores */}
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 rounded-xl p-5 shadow-md animate-fadeIn">
                  <div className="flex items-start">
                    <svg className="w-6 h-6 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="ml-3">
                      <h3 className="font-semibold text-red-800">Error en el cálculo</h3>
                      <p className="text-sm text-red-700 mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Sugerencias de códigos */}
              {suggestions && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 animate-fadeIn">
                  <div className="flex items-start space-x-3 mb-4">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">Código incompleto</h3>
                      <p className="text-sm text-gray-600 mt-1">Selecciona una clasificación más específica:</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {suggestions.suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => calculate(null, suggestion.hsCode)}
                        className="w-full text-left p-4 border-2 border-gray-200 rounded-xl hover:border-[#0A3D5C] hover:bg-blue-50 transition-all group"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <span className="font-mono font-bold text-[#0A3D5C] group-hover:text-[#083049]">
                              {suggestion.hsCode}
                            </span>
                            <p className="text-sm text-gray-600 mt-1">{suggestion.description}</p>
                          </div>
                          <svg className="w-5 h-5 text-gray-400 group-hover:text-[#0A3D5C] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Resultados */}
              {result && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden animate-fadeIn">
                  {/* Header de resultados */}
                  <div className="bg-gradient-to-r from-emerald-500 to-green-500 px-8 py-6">
                    <h3 className="text-2xl font-bold text-white mb-1">Resultado del Cálculo</h3>
                    <p className="text-emerald-50 text-sm">Desglose completo de costes de importación</p>
                  </div>

                  <div className="p-8 space-y-6">
                    
                    {/* Info del producto */}
                    <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-6 border border-gray-100">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Código TARIC</p>
                          <p className="font-mono text-lg font-bold text-[#0A3D5C]">{result.hsCode}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">País de Origen</p>
                          <p className="text-lg font-bold text-[#0A3D5C]">{result.country.name}</p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Descripción</p>
                        <p className="text-sm text-gray-700 leading-relaxed">{result.description}</p>
                      </div>
                    </div>

                    {/* Info de conversión si existe */}
                    {result.conversionInfo && (
                      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-5 border border-[#F4C542]/30">
                        <div className="flex items-center space-x-2 mb-2">
                          <svg className="w-5 h-5 text-[#F4C542]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <h4 className="font-bold text-gray-900">Conversión de Moneda</h4>
                        </div>
                        <p className="text-sm text-gray-700">
                          <span className="font-semibold">{result.conversionInfo.original.toLocaleString('es-ES', {minimumFractionDigits: 2})} {result.conversionInfo.currency}</span>
                          <span className="mx-2 text-gray-400">×</span>
                          <span className="text-gray-600">{result.conversionInfo.rate.toFixed(6)}</span>
                          <span className="mx-2 text-gray-400">=</span>
                          <span className="font-bold text-[#0A3D5C]">{formatCurrency(result.conversionInfo.eurValue)}</span>
                        </p>
                      </div>
                    )}

                    {/* Arancel preferencial */}
                    {result.duty.preferentialApplied && (
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border-2 border-[#0A3D5C]/20">
                        <div className="flex items-start space-x-3">
                          <div className="p-2 bg-[#0A3D5C] rounded-lg">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-[#0A3D5C] mb-1">Arancel Preferencial Aplicado</h4>
                            <p className="text-sm text-gray-700 mb-3">
                              Se aplica arancel reducido por acuerdo comercial con {result.country.name}
                            </p>
                            {result.duty.certificationRequired && (
                              <div className="bg-white rounded-lg p-3 border border-gray-200">
                                <p className="text-xs font-semibold text-gray-700 mb-1">📋 Documentación requerida:</p>
                                <p className="text-xs text-gray-600">{result.duty.certificationMessage}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Alertas TARIC */}
                    {result.alerts && result.alerts.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-bold text-gray-900 flex items-center space-x-2">
                          <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <span>Alertas y Requisitos TARIC</span>
                        </h4>
                        
                        {result.alerts.map((alert, index) => (
                          <div
                            key={index}
                            className={`rounded-xl p-4 border-l-4 ${
                              alert.priority === 1 ? 'bg-red-50 border-red-500' :
                              alert.priority === 2 ? 'bg-amber-50 border-amber-500' :
                              'bg-blue-50 border-blue-500'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className={`text-2xl ${
                                    alert.priority === 1 ? '🚨' :
                                    alert.priority === 2 ? '⚠️' :
                                    'ℹ️'
                                  }`}></span>
                                  <h5 className="font-bold text-gray-900">{alert.code}</h5>
                                </div>
                                <p className="text-sm text-gray-700">{alert.description}</p>
                                
                                {alert.full_text && (
                                  <details className="mt-2">
                                    <summary className="cursor-pointer text-xs font-medium text-[#0A3D5C] hover:text-[#083049]">
                                      Ver texto completo ↓
                                    </summary>
                                    <div className="mt-2 p-3 bg-white rounded-lg text-xs text-gray-700 whitespace-pre-line border border-gray-200">
                                      {alert.full_text}
                                    </div>
                                  </details>
                                )}
                              </div>
                              <span className={`ml-3 px-3 py-1 rounded-full text-xs font-bold ${
                                alert.priority === 1 ? 'bg-red-200 text-red-800' :
                                alert.priority === 2 ? 'bg-amber-200 text-amber-800' :
                                'bg-blue-200 text-blue-800'
                              }`}>
                                {alert.priority === 1 ? 'CRÍTICO' : alert.priority === 2 ? 'IMPORTANTE' : 'INFO'}
                              </span>
                            </div>
                          </div>
                        ))}

                        <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 border border-gray-200">
                          <p className="text-xs text-gray-700">
                            <strong>⚠️ Importante:</strong> Las alertas mostradas pueden no aplicar todas al país seleccionado ({result.country.name}).
                            Algunos requisitos son específicos de ciertos acuerdos comerciales o grupos de países.
                            <strong className="text-[#0A3D5C]"> Verifique siempre con las autoridades aduaneras</strong> qué documentación es obligatoria para su importación específica.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Desglose de costes */}
                    <div className="space-y-4 pt-4">
                      <div className="flex justify-between items-center py-3 border-b-2 border-gray-100">
                        <span className="text-gray-600 font-medium">Valor CIF:</span>
                        <span className="font-bold text-xl text-gray-900">{formatCurrency(result.cifValue)}</span>
                      </div>
                      
                      <div className="flex justify-between items-center py-3 border-b-2 border-gray-100">
                        <div>
                          <span className="text-gray-600 font-medium">Arancel </span>
                          {result.duty.standardRate !== result.duty.appliedRate && (
                            <span className="text-xs text-gray-400 line-through ml-1">
                              ({result.duty.standardRate}%)
                            </span>
                          )}
                          <span className="text-gray-600 font-medium"> → {result.duty.appliedRate}%:</span>
                        </div>
                        <span className="font-bold text-xl text-gray-900">
                          {formatCurrency(result.duty.amount)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center py-3 border-b-2 border-gray-100">
                        <span className="text-gray-600 font-medium">Base imponible IVA:</span>
                        <span className="font-semibold text-lg text-gray-900">{formatCurrency(result.customsBase)}</span>
                      </div>
                      
                      <div className="py-3 border-b-2 border-gray-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600 font-medium">IVA ({result.vat.rate}%):</span>
                            {result.vat.type && result.vat.type !== 'general' && (
                              <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                result.vat.type === 'superreducido'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                {result.vat.type === 'superreducido' ? '4% Superreducido' : '10% Reducido'}
                              </span>
                            )}
                          </div>
                          <span className="font-bold text-xl text-gray-900">
                            {formatCurrency(result.vat.amount)}
                          </span>
                        </div>
                        {result.vat.type && result.vat.type !== 'general' && (
                          <p className="text-xs text-gray-500 mt-2">
                            {result.vat.type === 'superreducido'
                              ? '📦 Productos básicos de primera necesidad'
                              : '🍽️ Alimentos y servicios esenciales'}
                          </p>
                        )}
                      </div>
                      
                      {/* Total destacado */}
                      <div className="mt-6 bg-gradient-to-br from-emerald-500 to-green-500 rounded-2xl p-6 shadow-xl">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-lg font-bold text-white">
                              TOTAL A PAGAR
                            </span>
                            {result.duty.savings > 0 && (
                              <p className="text-xs text-emerald-100 mt-1">
                                💰 Ahorro de {formatCurrency(result.duty.savings)} por acuerdo comercial
                              </p>
                            )}
                          </div>
                          <span className="text-3xl font-bold text-white">
                            {formatCurrency(result.total)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Botón Favoritos */}
                    <div className="pt-4">
                      <FavoriteButton
                        hsCode={result.hsCode}
                        countryCode={result.country.code}
                        cifValue={result.cifValue}
                        calculationData={result}
                      />
                    </div>

                    {/* Botones de acción */}
                    <div className="grid md:grid-cols-3 gap-3 pt-4">
                      <button 
                        onClick={() => exportToPDF(result, formatCurrency)}
                        className="px-6 py-3 bg-[#0A3D5C] hover:bg-[#083049] text-white rounded-xl transition-all flex items-center justify-center font-semibold shadow-lg hover:shadow-xl"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Exportar PDF
                      </button>
                      <button 
                        onClick={() => window.print()}
                        className="px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 rounded-xl transition-all flex items-center justify-center font-semibold border-2 border-gray-200 hover:border-gray-300"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Imprimir
                      </button>
                      <button 
                        onClick={clearAll}
                        className="px-6 py-3 bg-gradient-to-r from-[#F4C542] to-[#f5d05e] hover:from-[#f0b922] hover:to-[#F4C542] text-[#0A3D5C] rounded-xl transition-all flex items-center justify-center font-bold shadow-lg hover:shadow-xl"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Nuevo Cálculo
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar derecho */}
            <div className="space-y-6">
              
              {/* Widget de tipos de cambio */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow">
                <div className="bg-gradient-to-r from-[#F4C542] to-[#f5d05e] px-6 py-4">
                  <h3 className="font-bold text-[#0A3D5C] flex items-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Tipos de Cambio BCE</span>
                  </h3>
                </div>
                <div className="p-4">
                  {exchangeRates && exchangeRates.length > 0 ? (
                    <div className="space-y-2">
                      {exchangeRates.slice(0, 5).map((rate, index) => (
                        <div key={`rate-${index}`} className="flex justify-between items-center text-sm">
                          <span className="font-medium text-gray-700">{rate.currency_code || rate.currency}</span>
                          <span className="font-bold text-[#0A3D5C]">{rate.rate?.toFixed(4)}</span>
                        </div>
                      ))}
                      <a href="/tipos-cambio" className="text-xs text-[#0A3D5C] hover:underline block mt-2">
                        Ver todos →
                      </a>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Cargando...</p>
                  )}
                </div>
              </div>

              {/* Búsquedas recientes */}
              {recentSearches.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow">
                  <div className="bg-gradient-to-r from-slate-100 to-gray-100 px-6 py-4">
                    <h3 className="font-bold text-[#0A3D5C] flex items-center space-x-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Búsquedas Recientes</span>
                    </h3>
                  </div>
                  <div className="p-4 space-y-2">
                    {recentSearches.map((search, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setHsCode(search.code)
                          setError('')
                          setResult(null)
                        }}
                        className="w-full text-left p-3 bg-gray-50 hover:bg-blue-50 rounded-xl transition-all group border border-gray-100 hover:border-[#0A3D5C]"
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <span className="font-mono text-sm font-bold text-[#0A3D5C] group-hover:text-[#083049]">
                              {search.code}
                            </span>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                              {search.description}
                            </p>
                          </div>
                          <svg className="w-4 h-4 text-gray-400 group-hover:text-[#0A3D5C] transition-colors flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Info cards */}
              <div className="space-y-4">
                <div className="bg-white rounded-xl shadow-md border border-gray-100 p-5 hover:shadow-lg transition-shadow">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <svg className="w-5 h-5 text-[#0A3D5C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 text-sm mb-1">Documentación de origen</h4>
                      <p className="text-xs text-gray-600">EUR.1, REX o Declaración en factura según acuerdo</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-md border border-gray-100 p-5 hover:shadow-lg transition-shadow">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 text-sm mb-1">Importante</h4>
                      <p className="text-xs text-gray-600">Las preferencias dependen del producto específico</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-md border border-gray-100 p-5 hover:shadow-lg transition-shadow">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 text-sm mb-1">Siempre verificar</h4>
                      <p className="text-xs text-gray-600">Consultar acuerdo específico y reglas de origen</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Estilos para animaciones */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
