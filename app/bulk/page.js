'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import Link from 'next/link'
import { parseCSV, generateSampleCSV } from '@/lib/csvParser'

export default function BulkCalculatorPage() {
  const [file, setFile] = useState(null)
  const [batchName, setBatchName] = useState('')
  const [parsedData, setParsedData] = useState(null)
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [user, setUser] = useState(null)
  const router = useRouter()
  const supabase = createClient()

  // Verificar usuario
  useState(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
      } else {
        setUser(user)
      }
    }
    checkUser()
  }, [])

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0]
    if (!uploadedFile) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target.result
        const parsed = parseCSV(text)
        setParsedData(parsed)
        setFile(uploadedFile)
        setError('')
        
        if (parsed.hasErrors) {
          setError(`Se encontraron ${parsed.errors.length} errores en el archivo. Revisa la tabla de errores.`)
        }
      } catch (err) {
        setError(err.message)
        setParsedData(null)
        setFile(null)
      }
    }
    reader.readAsText(uploadedFile)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const droppedFile = files[0]

      // Validar que sea CSV
      if (!droppedFile.name.endsWith('.csv')) {
        setError('Solo se permiten archivos CSV')
        return
      }

      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const text = event.target.result
          const parsed = parseCSV(text)
          setParsedData(parsed)
          setFile(droppedFile)
          setError('')

          if (parsed.hasErrors) {
            setError(`Se encontraron ${parsed.errors.length} errores en el archivo. Revisa la tabla de errores.`)
          }
        } catch (err) {
          setError(err.message)
          setParsedData(null)
          setFile(null)
        }
      }
      reader.readAsText(droppedFile)
    }
  }

  const handleProcess = async () => {
    if (!parsedData || parsedData.items.length === 0) {
      setError('No hay datos válidos para procesar')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/bulk-calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: parsedData.items,
          batchName: batchName || `Lote ${new Date().toLocaleDateString('es-ES')}`
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al procesar')
      }

      setResults(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const downloadSample = () => {
    const csv = generateSampleCSV()
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'ejemplo_calculadora_masiva.csv'
    a.click()
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(value)
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-xl p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                📊 Calculadora Masiva
              </h1>
              <p className="text-gray-600">
                Procesa múltiples cálculos simultáneamente desde CSV
              </p>
            </div>
            <Link
              href="/dashboard"
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
            >
              ← Dashboard
            </Link>
          </div>

          {/* Instrucciones */}
          <div className="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-gray-800 mb-3">📋 Instrucciones:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li>Prepara un archivo CSV con las columnas: <strong>HS Code</strong>, <strong>Valor CIF</strong>, <strong>País</strong></li>
              <li>El separador puede ser coma (,) o punto y coma (;)</li>
              <li>Máximo 100 productos por archivo</li>
              <li>Sube el archivo y revisa los datos antes de procesar</li>
            </ol>
            <button
              onClick={downloadSample}
              className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
            >
              📥 Descargar archivo de ejemplo
            </button>
          </div>

          {/* Upload */}
          {!results && (
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del lote (opcional)
              </label>
              <input
                type="text"
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                placeholder="ej: Importación Noviembre 2024"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-4"
              />

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subir archivo CSV
              </label>
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition"
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="text-4xl mb-2">📤</div>
                  <p className="text-gray-600 mb-2">
                    {file ? file.name : 'Click para seleccionar archivo CSV'}
                  </p>
                  <p className="text-sm text-gray-500">
                    o arrastra y suelta aquí
                  </p>
                </label>
              </div>
            </div>
          )}

          {/* Error general */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Preview de datos parseados */}
          {parsedData && !results && (
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800">
                  Vista previa: {parsedData.total} productos
                </h3>
                <button
                  onClick={handleProcess}
                  disabled={loading || parsedData.total === 0}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition"
                >
                  {loading ? 'Procesando...' : '🚀 Calcular todo'}
                </button>
              </div>

              {/* Errores de parsing */}
              {parsedData.hasErrors && (
                <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded">
                  <h4 className="font-semibold text-yellow-800 mb-2">
                    ⚠️ {parsedData.errors.length} errores encontrados:
                  </h4>
                  <div className="max-h-40 overflow-y-auto">
                    {parsedData.errors.map((err, idx) => (
                      <p key={idx} className="text-sm text-yellow-700">
                        Línea {err.line}: {err.error}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Tabla preview */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">HS Code</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valor CIF</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">País</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {parsedData.items.slice(0, 10).map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3 text-sm text-gray-600">{item.lineNumber}</td>
                        <td className="px-4 py-3 text-sm font-mono font-semibold text-blue-600">{item.hsCode}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">{formatCurrency(item.cifValue)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{item.countryCode}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedData.items.length > 10 && (
                  <p className="text-center text-sm text-gray-500 py-4">
                    ... y {parsedData.items.length - 10} más
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Resultados */}
          {results && (
            <div>
              {/* Summary */}
              <div className="mb-8 grid md:grid-cols-4 gap-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-gray-600 mb-1">Procesados</p>
                  <p className="text-2xl font-bold text-green-600">{results.summary.total}</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-gray-600 mb-1">Exitosos</p>
                  <p className="text-2xl font-bold text-blue-600">{results.summary.successful}</p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-sm text-gray-600 mb-1">Fallidos</p>
                  <p className="text-2xl font-bold text-red-600">{results.summary.failed}</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-sm text-gray-600 mb-1">Total</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatCurrency(results.summary.totals.totalAmount)}
                  </p>
                </div>
              </div>

              {/* Totales detallados */}
              <div className="mb-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">💰 Totales Consolidados</h3>
                <div className="grid md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Valor CIF</p>
                    <p className="text-xl font-bold text-gray-800">{formatCurrency(results.summary.totals.totalCIF)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Aranceles</p>
                    <p className="text-xl font-bold text-orange-600">{formatCurrency(results.summary.totals.totalDuties)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">IVA</p>
                    <p className="text-xl font-bold text-blue-600">{formatCurrency(results.summary.totals.totalVAT)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">TOTAL A PAGAR</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(results.summary.totals.totalAmount)}</p>
                  </div>
                </div>
              </div>

              {/* Tabla de resultados */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">📋 Resultados Detallados</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">HS Code</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">País</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">CIF</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Arancel</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">IVA</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {results.results.map((item, idx) => (
                        <tr key={idx} className={item.status === 'error' ? 'bg-red-50' : ''}>
                          <td className="px-4 py-3">
                            {item.status === 'success' ? (
                              <span className="text-green-600">✓</span>
                            ) : (
                              <span className="text-red-600" title={item.error}>✗</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm font-mono font-semibold text-blue-600">
                            {item.hsCode}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{item.countryCode}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">
                            {formatCurrency(item.cifValue)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">
                            {item.result ? formatCurrency(item.result.duty.amount) : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">
                            {item.result ? formatCurrency(item.result.vat.amount) : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-green-600 text-right">
                            {item.result ? formatCurrency(item.result.total) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Botones finales */}
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setResults(null)
                    setParsedData(null)
                    setFile(null)
                    setBatchName('')
                  }}
                  className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
                >
                  ← Nuevo cálculo masivo
                </button>
                <Link
                  href="/dashboard"
                  className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition"
                >
                  Ver en historial →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}