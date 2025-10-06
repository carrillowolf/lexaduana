'use client'

import { useState } from 'react'

export default function Home() {
  const [hsCode, setHsCode] = useState('')
  const [cifValue, setCifValue] = useState('')
  const [country, setCountry] = useState('ERGA OMNES')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const calculate = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hsCode, cifValue, country })
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Calculadora TARIC
          </h1>
          <p className="text-gray-600">
            Calcula aranceles e IVA para importaciones en la UE
          </p>
        </header>

        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-xl p-8">
            <form onSubmit={calculate} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código HS
                  </label>
                  <input
                    type="text"
                    value={hsCode}
                    onChange={(e) => setHsCode(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  País de origen (opcional)
                </label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="ERGA OMNES">Terceros países (general)</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Próximamente: más países con acuerdos preferenciales
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition duration-200 disabled:bg-gray-400"
              >
                {loading ? 'Calculando...' : 'Calcular'}
              </button>
            </form>

            {error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {result && (
              <div className="mt-8 space-y-6">
                <div className="border-t pt-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    Resultado del cálculo
                  </h2>
                  
                  {result.description && (
                    <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Descripción:</span> {result.description}
                      </p>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600">Valor CIF:</span>
                      <span className="font-medium">{formatCurrency(result.cifValue)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-t">
                      <span className="text-gray-600">
                        Arancel ({result.duty.rate}%):
                      </span>
                      <span className="font-medium">{formatCurrency(result.duty.amount)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600">Base imponible IVA:</span>
                      <span className="font-medium">{formatCurrency(result.customsBase)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-t">
                      <span className="text-gray-600">
                        IVA ({result.vat.rate}%):
                      </span>
                      <span className="font-medium">{formatCurrency(result.vat.amount)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-3 border-t border-gray-300 bg-green-50 px-4 rounded">
                      <span className="text-lg font-semibold text-gray-800">
                        TOTAL A PAGAR:
                      </span>
                      <span className="text-xl font-bold text-green-600">
                        {formatCurrency(result.total)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <footer className="text-center mt-12 text-gray-600 text-sm">
          <p>© 2024 Lexaduana - Calculadora TARIC profesional</p>
        </footer>
      </div>
    </div>
  )
}
