'use client'

import { useState, useEffect } from 'react'

export default function Home() {
  const [hsCode, setHsCode] = useState('')
  const [cifValue, setCifValue] = useState('')
  const [countryCode, setCountryCode] = useState('ERGA OMNES')
  const [countries, setCountries] = useState([])
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Cargar lista de países al iniciar
  useEffect(() => {
    fetchCountries()
  }, [])

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

  const calculate = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hsCode, cifValue, countryCode })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Error en el cálculo')
      }

      setResult(data.data)
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

  // Agrupar países por tipo de acuerdo
  const groupedCountries = countries.reduce((acc, country) => {
    const group = country.agreement_type || 'Otros'
    if (!acc[group]) acc[group] = []
    acc[group].push(country)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-3">
            Calculadora TARIC
          </h1>
          <p className="text-lg text-gray-600">
            Calcula aranceles e IVA para importaciones en la UE
          </p>
          <div className="mt-4 flex justify-center gap-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              ✓ {countries.length} países con acuerdos
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              ✓ Base de datos actualizada 2024
            </span>
          </div>
        </header>

        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-xl p-8">
            <form onSubmit={calculate} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código HS / TARIC
                  </label>
                  <input
                    type="text"
                    value={hsCode}
                    onChange={(e) => setHsCode(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    placeholder="ej: 8471300000"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Introduce el código arancelario (2-10 dígitos)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor CIF (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={cifValue}
                    onChange={(e) => setCifValue(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    placeholder="ej: 10000"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Coste + Seguro + Flete
                  </p>
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
                          {country.reduction_rate === 100 && ' ✓ (0% arancel)'}
                          {country.reduction_rate > 0 && country.reduction_rate < 100 && ` (−${country.reduction_rate}%)`}
                          {country.reduction_rate < 0 && ' ⚠️ (+sanciones)'}
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
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-700 hover:to-indigo-700 transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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

            {result && (
              <div className="mt-8 space-y-6">
                <div className="border-t-2 border-gray-100 pt-6">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                    <svg className="w-6 h-6 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Resultado del cálculo
                  </h2>
                  
                  {result.description && (
                    <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold text-gray-900">📦 Producto:</span> {result.description}
                      </p>
                    </div>
                  )}

                  {result.country.agreement && (
                    <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                      <div className="flex items-start">
                        <span className="text-2xl mr-3">🌍</span>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 mb-1">
                            {result.country.name} - {result.country.agreement}
                          </p>
                          {result.country.notes && (
                            <p className="text-sm text-gray-600">{result.country.notes}</p>
                          )}
                          {result.duty.savings > 0 && (
                            <p className="text-sm font-semibold text-green-600 mt-2">
                              💰 Ahorro por acuerdo: {formatCurrency(result.duty.savings)}
                            </p>
                          )}
                        </div>
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
                    
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-600">
                        IVA ({result.vat.rate}%):
                      </span>
                      <span className="font-semibold text-lg">{formatCurrency(result.vat.amount)}</span>
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

                    <div className="mt-4 flex gap-3">
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
                        onClick={() => {
                          setResult(null)
                          setHsCode('')
                          setCifValue('')
                          setCountryCode('ERGA OMNES')
                        }}
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
                <span className="text-green-500 mr-2">✓</span>
                Países con 0% arancel
              </h3>
              <p className="text-sm text-gray-600">
                UE, Noruega, Suiza, Islandia, Reino Unido*
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-semibold text-gray-700 mb-2 flex items-center">
                <span className="text-blue-500 mr-2">★</span>
                Acuerdos principales
              </h3>
              <p className="text-sm text-gray-600">
                Canadá, Japón, México, Corea, Vietnam
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-semibold text-gray-700 mb-2 flex items-center">
                <span className="text-orange-500 mr-2">⚠</span>
                Sanciones activas
              </h3>
              <p className="text-sm text-gray-600">
                Rusia, Bielorrusia (+25% adicional)
              </p>
            </div>
          </div>
        </div>

        <footer className="text-center mt-12 text-gray-600 text-sm">
          <p>© 2024 Lexaduana - Calculadora TARIC profesional</p>
          <p className="mt-2">
            <a href="https://lexaduana.es" className="text-blue-600 hover:underline">lexaduana.es</a>
            {' | '}
            <a href="https://lexaduana.eu" className="text-blue-600 hover:underline">lexaduana.eu</a>
          </p>
        </footer>
      </div>
    </div>
  )
}
