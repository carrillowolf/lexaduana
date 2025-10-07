'use client'

import { useState, useEffect } from 'react'
import { exportToPDF } from '../components/ExportPDF'

export default function Home() {
  const [hsCode, setHsCode] = useState('')
  const [cifValue, setCifValue] = useState('')
  const [countryCode, setCountryCode] = useState('ERGA OMNES')
  const [countries, setCountries] = useState([])
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [suggestions, setSuggestions] = useState(null)

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

  const calculate = async (e, specificCode = null) => {
    if (e) e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)
    setSuggestions(null)

    try {
      const response = await fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          hsCode: specificCode || hsCode, 
          cifValue, 
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
          <div className="flex justify-center mb-6">
            <img src="/logo.png" alt="Lex Aduana" className="h-24 w-auto" />
          </div>
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
                        onClick={() => {
                          setResult(null)
                          setSuggestions(null)
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
