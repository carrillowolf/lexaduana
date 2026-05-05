'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { exportToPDF } from '../../components/ExportPDF'
import HSCodeAutocomplete from '../../components/HSCodeAutocomplete'
import QuickAccessButton from '../../components/QuickAccessButton'
// UserMenu ahora en AppTopbar
import { createClient } from '@/lib/supabase-browser'
// import ExchangeRateWidget from '../../components/ExchangeRateWidget'
import FavoriteButton from '../../components/FavoriteButton'
import Link from 'next/link'
import { CBAMAlert } from '../../components/CBAMAlert'
import ExchangeRateBanner from '../../components/ExchangeRateBanner'
import CbamRestoreBanner from '@/components/cbam/calculator/CbamRestoreBanner'
import { trackEvent } from '@/lib/analytics'
import { useTranslation } from '@/lib/i18n'
import { calculadoraDict } from '@/lib/i18n/calculadora'
import DocumentRequirements from '../../components/DocumentRequirements'
import { safeLogger } from '@/lib/safe-logger'

export default function Home() {
  const searchParams = useSearchParams()
  const t = useTranslation(calculadoraDict)
  const [user, setUser] = useState(null)
  const supabase = createClient()
  const [hsCode, setHsCode] = useState(() => searchParams.get('hsCode') || '')
  const [cifValue, setCifValue] = useState(() => searchParams.get('cifValue') || '')
  const [countryCode, setCountryCode] = useState(() => searchParams.get('countryCode') || 'ERGA OMNES')
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
        safeLogger.error('Error cargando tipos de cambio:', error)
      }
    }
    fetchExchangeRates()
  }, [])

  // Cargar lista de países y búsquedas recientes al iniciar
  useEffect(() => {
    fetchCountries()
    loadRecentSearches()
  }, [])

  // Auto-calcular si llegamos desde el Clasificador con parámetros en la URL
  useEffect(() => {
    const urlHsCode = searchParams.get('hsCode')
    if (urlHsCode && urlHsCode.length >= 8) {
      // Pequeño delay para asegurar que el estado ya se inicializó
      const timer = setTimeout(() => {
        calculate(null)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
      safeLogger.error('Error cargando países:', err)
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
      trackEvent('calculate_tariff', { hs_code: specificCode || hsCode, origin: countryCode })

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
        safeLogger.log('No se pudo guardar el cálculo:', saveError)
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
      <CbamRestoreBanner variant="taric" />
      <ExchangeRateBanner />

      {/* Contenido principal - Calculadora */}
      <div className="pt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          
          {/* Quick Access - SOLO para logueados */}
          {user && (
            <div className="mb-8">
              {/* Atajos discretos a la derecha */}
              <div className="flex flex-wrap items-center justify-end gap-x-1 gap-y-2 mb-4 text-sm">
                <Link
                  href="/dashboard"
                  className="text-slate-600 hover:text-[#0A3D5C] underline-offset-2 hover:underline"
                >
                  {t('quickAccess.dashboard')}
                </Link>
                <span className="text-slate-300" aria-hidden="true">·</span>
                <Link
                  href="/favoritos"
                  className="text-slate-600 hover:text-[#0A3D5C] underline-offset-2 hover:underline"
                >
                  {t('quickAccess.favorites')}
                </Link>
                <span className="text-slate-300" aria-hidden="true">·</span>
                <Link
                  href="/bulk"
                  className="text-slate-600 hover:text-[#0A3D5C] underline-offset-2 hover:underline"
                >
                  {t('quickAccess.bulkCalc')} <span className="text-slate-400">({t('quickAccess.bulkCalcDesc')})</span>
                </Link>
              </div>

              {/* 3 cards destacadas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Comparador */}
                <Link
                  href="/comparador"
                  className="group bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition p-5 flex flex-col"
                >
                  <svg className="w-6 h-6 text-[#0A3D5C] mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-slate-900 font-semibold">{t('quickAccess.comparator')}</h3>
                  <p className="text-slate-500 text-sm mt-1">{t('quickAccess.comparatorDesc')}</p>
                </Link>

                {/* Clasificador IA */}
                <Link
                  href="/clasificador"
                  className="group bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition p-5 flex flex-col"
                >
                  <svg className="w-6 h-6 text-[#0A3D5C] mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <h3 className="text-slate-900 font-semibold">{t('quickAccess.classifier')}</h3>
                  <p className="text-slate-500 text-sm mt-1">{t('quickAccess.classifierDesc')}</p>
                </Link>

                {/* CBAM */}
                <Link
                  href="/cbam"
                  className="group bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition p-5 flex flex-col"
                >
                  <svg className="w-6 h-6 text-[#0A3D5C] mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <h3 className="text-slate-900 font-semibold">{t('quickAccess.cbam')}</h3>
                  <p className="text-slate-500 text-sm mt-1">{t('quickAccess.cbamDesc')}</p>
                </Link>
              </div>
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
                  <h2 className="text-2xl font-bold text-white mb-2">{t('header.title')}</h2>
                  <p className="text-blue-100 text-sm">{t('header.subtitle')}</p>
                </div>

                {/* Formulario */}
                <form onSubmit={calculate} className="p-8 space-y-6">
                  
                  {/* Código HS */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      {t('form.hsCodeLabel')}
                      <span className="ml-2 text-xs font-normal text-gray-500">{t('form.hsCodeDigits')}</span>
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
                      {t('form.cifLabel')}
                      <span className="ml-2 text-xs font-normal text-gray-500">{t('form.cifHint')}</span>
                    </label>
                    <div className="flex gap-3">
                      <input
                        type="number"
                        value={cifValue}
                        onChange={handleCifValueChange}
                        placeholder={t('form.cifPlaceholder')}
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
                            ({t('form.rateLabel')} {convertedValue.rate.toFixed(6)})
                          </span>
                        </p>
                      </div>
                    )}
                  </div>

                  {/* País de origen */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      {t('form.countryLabel')}
                      <span className="ml-2 text-xs font-normal text-gray-500">{t('form.countryHint')}</span>
                    </label>
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#0A3D5C] focus:ring-4 focus:ring-[#0A3D5C]/10 outline-none transition-all bg-white font-medium"
                    >
                      <option value="ERGA OMNES">{t('form.countryDefault')}</option>
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
                        <span>{t('form.calculating')}</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <span>{t('form.calculate')}</span>
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
                      <h3 className="font-semibold text-red-800">{t('error.title')}</h3>
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
                      <h3 className="font-bold text-lg text-gray-900">{t('suggestions.title')}</h3>
                      <p className="text-sm text-gray-600 mt-1">{t('suggestions.subtitle')}</p>
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
                    <h3 className="text-2xl font-bold text-white mb-1">{t('results.title')}</h3>
                    <p className="text-emerald-50 text-sm">{t('results.subtitle')}</p>
                  </div>

                  <div className="p-8 space-y-6">
                    
                    {/* Info del producto */}
                    <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-6 border border-gray-100">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{t('results.hsCodeLabel')}</p>
                          <p className="font-mono text-lg font-bold text-[#0A3D5C]">{result.hsCode}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{t('results.countryLabel')}</p>
                          <p className="text-lg font-bold text-[#0A3D5C]">{result.country.name}</p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{t('results.descriptionLabel')}</p>
                        <p className="text-sm text-gray-700 leading-relaxed">{result.description}</p>
                      </div>

                    {/* Alerta CBAM si el producto está afectado */}
                    <CBAMAlert hsCode={result.hsCode} />
                    </div>

                    {/* Info de conversión si existe */}
                    {result.conversionInfo && (
                      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-5 border border-[#F4C542]/30">
                        <div className="flex items-center space-x-2 mb-2">
                          <svg className="w-5 h-5 text-[#F4C542]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <h4 className="font-bold text-gray-900">{t('results.currencyConversion')}</h4>
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
                            <h4 className="font-bold text-[#0A3D5C] mb-1">{t('results.preferentialApplied')}</h4>
                            <p className="text-sm text-gray-700 mb-3">
                              {t('results.preferentialDesc')} {result.country.name}
                            </p>
                            {result.duty.certificationRequired && (
                              <div className="bg-white rounded-lg p-3 border border-gray-200">
                                <p className="text-xs font-semibold text-gray-700 mb-1">📋 {t('results.certRequired')}</p>
                                <p className="text-xs text-gray-600">{result.duty.certificationMessage}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Condiciones y certificados requeridos */}
                    {result.duty.conditions && result.duty.conditions.length > 0 && (
                      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-5 border border-indigo-200">
                        <div className="flex items-center space-x-2 mb-3">
                          <span className="text-xl">📋</span>
                          <h4 className="font-bold text-gray-900">{t('results.conditions')}</h4>
                          <span className="text-xs text-gray-500">({result.duty.conditions.length} {t('results.conditionsRequired')})</span>
                        </div>
                        <div className="space-y-2">
                          {result.duty.conditions.map((cond, i) => (
                            <div key={i} className="flex items-start space-x-3 bg-white rounded-lg p-3 border border-gray-200">
                              <span className="text-sm font-mono font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded whitespace-nowrap">
                                {cond.certificate}
                              </span>
                              <p className="text-sm text-gray-700 flex-1">{cond.description}</p>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-3 italic">
                          {t('results.conditionsNote')}
                        </p>
                      </div>
                    )}

                    {/* Alertas TARIC - Versión Mejorada */}
                    {result.alerts && result.alerts.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-bold text-gray-900 flex items-center space-x-2">
                          <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <span>{t('results.alerts')}</span>
                          <span className="text-xs font-normal text-gray-500">({result.alerts.length} {t('results.alertsApplicable')})</span>
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
                                {/* Cabecera con icono y tipo de medida */}
                                <div className="flex items-center space-x-2 mb-2">
                                  <span className="text-2xl">{alert.icon || (
                                    alert.priority === 1 ? '🚨' :
                                    alert.priority === 2 ? '⚠️' : 'ℹ️'
                                  )}</span>
                                  <div>
                                    <h5 className="font-bold text-gray-900">
                                      {alert.translated?.measure?.text || alert.code}
                                    </h5>
                                    {alert.translated?.measure?.code && (
                                      <span className="text-xs text-gray-500">{t('results.alertsMeasure')} {alert.translated.measure.code}</span>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Certificado requerido */}
                                {alert.translated?.certificate && alert.certificate !== 'N990' && (
                                  <div className="flex items-center space-x-2 mb-2 ml-10">
                                    <span className="text-lg">{alert.translated.certificate.icon}</span>
                                    <div>
                                      <p className="text-sm font-medium text-gray-800">
                                        {alert.translated.certificate.text}
                                      </p>
                                      <span className="text-xs text-gray-500">{t('results.alertsCertCode')} {alert.certificate}</span>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Grupo de países aplicable */}
                                {alert.translated?.origin && alert.origin_code && (
                                  <div className="flex items-center space-x-2 mb-2 ml-10">
                                    <span className="text-lg">{alert.translated.origin.icon}</span>
                                    <p className="text-sm text-gray-700">
                                      {t('results.alertsAppliesTo')} <span className="font-medium">{alert.translated.origin.text}</span>
                                    </p>
                                  </div>
                                )}
                                
                                {/* Descripción legible */}
                                {alert.description && (
                                  <p className="text-sm text-gray-600 mt-2 ml-10 italic">
                                    {alert.description}
                                  </p>
                                )}
                                
                                {/* Texto completo expandible */}
                                {alert.full_text && (
                                  <details className="mt-3 ml-10">
                                    <summary className="cursor-pointer text-xs font-medium text-[#0A3D5C] hover:text-[#083049]">
                                      {t('results.alertsViewOriginal')}
                                    </summary>
                                    <div className="mt-2 p-3 bg-white rounded-lg text-xs text-gray-700 whitespace-pre-line border border-gray-200">
                                      {alert.full_text}
                                    </div>
                                  </details>
                                )}
                              </div>
                              
                              {/* Badge de prioridad */}
                              <span className={`ml-3 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                                alert.priority === 1 ? 'bg-red-200 text-red-800' :
                                alert.priority === 2 ? 'bg-amber-200 text-amber-800' :
                                'bg-blue-200 text-blue-800'
                              }`}>
                                {alert.translated?.priorityLabel || (
                                  alert.priority === 1 ? t('results.alertsCritical') :
                                  alert.priority === 2 ? t('results.alertsImportant') : t('results.alertsInfo')
                                )}
                              </span>
                            </div>
                          </div>
                        ))}

                        {/* Nota informativa */}
                        <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 border border-gray-200">
                          <p className="text-xs text-gray-700" dangerouslySetInnerHTML={{ __html: '💡 ' + t('results.alertsCertLegend') }} />
                        </div>
                      </div>
                    )}

                    {/* ═══ REQUISITOS DOCUMENTALES ═══ */}
                    {result.documentRequirements && result.documentRequirements.length > 0 && (
                      <DocumentRequirements requirements={result.documentRequirements} />
                    )}

                    {/* ═══ BLOQUE 1: Liquidación aduanera (tributos) ═══ */}
                    <div className="pt-4">
                      <h3 className="text-sm font-bold text-[#0A3D5C] uppercase tracking-wider mb-3">{t('settlement.title')}</h3>
                      <div className="bg-white border-2 border-[#0A3D5C]/10 rounded-2xl p-5 space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <div>
                            <span className="text-gray-600 font-medium">{t('settlement.dutyRights')} </span>
                            {result.duty.standardRate !== result.duty.appliedRate && (
                              <span className="text-xs text-gray-400 line-through ml-1">
                                ({result.duty.standardRate}%)
                              </span>
                            )}
                            <span className="text-gray-600 font-medium"> {result.duty.appliedRate}%</span>
                          </div>
                          <span className="font-bold text-lg text-gray-900">
                            {formatCurrency(result.duty.amount)}
                          </span>
                        </div>

                        <div className="py-2 border-b border-gray-100">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600 font-medium">{t('settlement.importVat')} ({result.vat.rate}%)</span>
                              {result.vat.type && result.vat.type !== 'general' && (
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                  result.vat.type === 'superreducido'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {result.vat.type === 'superreducido' ? t('settlement.superReduced') : t('settlement.reduced')}
                                </span>
                              )}
                            </div>
                            <span className="font-bold text-lg text-gray-900">
                              {formatCurrency(result.vat.amount)}
                            </span>
                          </div>
                          {result.vat.type && result.vat.type !== 'general' && (
                            <p className="text-xs text-gray-500 mt-1">
                              {result.vat.type === 'superreducido'
                                ? `📦 ${t('settlement.superReducedDesc')}`
                                : `🍽️ ${t('settlement.reducedDesc')}`}
                            </p>
                          )}
                        </div>

                        {/* Total suplidos */}
                        <div className="flex justify-between items-center pt-2">
                          <span className="text-lg font-bold text-[#0A3D5C]">{t('settlement.totalDisbursements')}</span>
                          <span className="text-2xl font-bold text-[#0A3D5C]">
                            {formatCurrency(result.duty.amount + result.vat.amount)}
                          </span>
                        </div>
                        {result.duty.savings > 0 && (
                          <p className="text-xs text-emerald-600 font-medium">
                            {t('settlement.savingsNote').replace('{amount}', formatCurrency(result.duty.savings))}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">{t('settlement.vatNote')}</p>
                      </div>
                    </div>

                    {/* ═══ BLOQUE 2: Coste total de la importación ═══ */}
                    <div className="pt-4">
                      <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">{t('totalCost.title')}</h3>
                      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 space-y-2">
                        <div className="flex justify-between items-center py-1.5">
                          <span className="text-gray-500 text-sm">{t('totalCost.cifValue')}</span>
                          <span className="font-semibold text-gray-700">{formatCurrency(result.cifValue)}</span>
                        </div>
                        <div className="flex justify-between items-center py-1.5">
                          <span className="text-gray-500 text-sm">{t('totalCost.dutyRights')}</span>
                          <span className="font-semibold text-gray-700">{formatCurrency(result.duty.amount)}</span>
                        </div>
                        <div className="flex justify-between items-center py-1.5 border-b border-gray-200 pb-3">
                          <span className="text-gray-500 text-sm">{t('totalCost.importVat')}</span>
                          <span className="font-semibold text-gray-700">{formatCurrency(result.vat.amount)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                          <span className="font-semibold text-gray-600">{t('totalCost.totalImport')}</span>
                          <span className="text-xl font-bold text-gray-900">{formatCurrency(result.total)}</span>
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
                        {t('actions.exportPdf')}
                      </button>
                      <button 
                        onClick={() => window.print()}
                        className="px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 rounded-xl transition-all flex items-center justify-center font-semibold border-2 border-gray-200 hover:border-gray-300"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        {t('actions.print')}
                      </button>
                      <button 
                        onClick={clearAll}
                        className="px-6 py-3 bg-gradient-to-r from-[#F4C542] to-[#f5d05e] hover:from-[#f0b922] hover:to-[#F4C542] text-[#0A3D5C] rounded-xl transition-all flex items-center justify-center font-bold shadow-lg hover:shadow-xl"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        {t('actions.newCalc')}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar derecho */}
            <div className="space-y-6">

              {/* Widget de tipos de cambio */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-[#F4C542]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-slate-900 font-semibold text-base">{t('sidebar.exchangeRates')}</h3>
                </div>
                {exchangeRates && exchangeRates.length > 0 ? (
                  <>
                    <div className="space-y-0">
                      {exchangeRates.slice(0, 5).map((rate, index) => (
                        <div
                          key={`rate-${index}`}
                          className="flex justify-between items-center py-2 border-b border-slate-100 last:border-b-0 font-mono tabular-nums text-sm text-slate-700"
                        >
                          <span>{rate.currency_code || rate.currency}</span>
                          <span className="font-semibold text-slate-900">{rate.rate?.toFixed(4)}</span>
                        </div>
                      ))}
                    </div>
                    <a href="/tipos-cambio" className="text-sm text-[#0A3D5C] hover:underline mt-3 inline-block">
                      {t('sidebar.viewAll')} →
                    </a>
                  </>
                ) : (
                  <p className="text-sm text-slate-500">{t('sidebar.loading')}</p>
                )}
              </div>

              {/* Búsquedas recientes */}
              {recentSearches.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-5 h-5 text-[#0A3D5C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-slate-900 font-semibold text-base">{t('sidebar.recentSearches')}</h3>
                  </div>
                  <div className="space-y-1">
                    {recentSearches.map((search, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setHsCode(search.code)
                          setError('')
                          setResult(null)
                        }}
                        className="w-full text-left py-2 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 -mx-2 px-2 rounded transition-colors group"
                      >
                        <div className="flex justify-between items-center gap-2">
                          <div className="flex-1 min-w-0">
                            <span className="font-mono tabular-nums text-sm font-semibold text-[#0A3D5C]">
                              {search.code}
                            </span>
                            <p className="text-xs text-slate-500 mt-0.5 truncate">
                              {search.description}
                            </p>
                          </div>
                          <svg className="w-4 h-4 text-slate-300 group-hover:text-[#0A3D5C] transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-[#0A3D5C] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div className="flex-1">
                      <h4 className="text-slate-900 font-semibold text-sm mb-1">{t('sidebar.originDocs')}</h4>
                      <p className="text-sm text-slate-500">{t('sidebar.originDocsDesc')}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-[#F4C542] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div className="flex-1">
                      <h4 className="text-slate-900 font-semibold text-sm mb-1">{t('sidebar.important')}</h4>
                      <p className="text-sm text-slate-500">{t('sidebar.importantDesc')}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-[#0A3D5C] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex-1">
                      <h4 className="text-slate-900 font-semibold text-sm mb-1">{t('sidebar.alwaysVerify')}</h4>
                      <p className="text-sm text-slate-500">{t('sidebar.alwaysVerifyDesc')}</p>
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
