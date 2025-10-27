'use client'

import { useState, useEffect } from 'react'
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
  const [dragActive, setDragActive] = useState(false)
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
    setDragActive(true)
  }

  const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const droppedFile = files[0]

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img src="/logo.png" alt="LexAduana" className="h-10 w-10" />
              <div>
                <h1 className="text-xl font-bold text-[#0A3D5C]">Calculadora Masiva</h1>
                <p className="text-xs text-gray-500">Procesa múltiples productos</p>
              </div>
            </div>

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Hero */}
        <div className="mb-8 bg-gradient-to-r from-[#0A3D5C] to-[#0d5078] rounded-2xl shadow-xl p-8 text-white">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-3">Calculadora Masiva 📊</h2>
              <p className="text-blue-100 text-lg mb-2">Procesa múltiples cálculos simultáneamente desde un archivo CSV</p>
              <p className="text-blue-200 text-sm">
                Ahorra tiempo calculando hasta 100 productos de una sola vez
              </p>
            </div>
            <div className="hidden md:block">
              <svg className="w-24 h-24 text-white/20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Instrucciones */}
        <div className="mb-8 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-[#0A3D5C] rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Instrucciones de uso</h3>
            </div>
          </div>
          <div className="p-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-bold text-gray-900 mb-3">📋 Formato del archivo CSV:</h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <p className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Columnas requeridas: <strong>HS Code</strong>, <strong>Valor CIF</strong>, <strong>País</strong></span>
                  </p>
                  <p className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Separador: coma (,) o punto y coma (;)</span>
                  </p>
                  <p className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Máximo 100 productos por archivo</span>
                  </p>
                  <p className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Códigos HS de 8 o 10 dígitos</span>
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="font-bold text-gray-900 mb-3">⚡ Proceso rápido:</h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <p className="flex items-start">
                    <span className="mr-2">1.</span>
                    <span>Descarga el archivo de ejemplo</span>
                  </p>
                  <p className="flex items-start">
                    <span className="mr-2">2.</span>
                    <span>Rellena con tus datos</span>
                  </p>
                  <p className="flex items-start">
                    <span className="mr-2">3.</span>
                    <span>Sube el archivo aquí</span>
                  </p>
                  <p className="flex items-start">
                    <span className="mr-2">4.</span>
                    <span>Revisa y procesa los cálculos</span>
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={downloadSample}
              className="mt-6 px-6 py-3 bg-gradient-to-r from-[#0A3D5C] to-[#0d5078] hover:from-[#083049] hover:to-[#0A3D5C] text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Descargar archivo de ejemplo</span>
            </button>
          </div>
        </div>

        {/* Upload area */}
        {!results && (
          <div className="mb-8 bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <div
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                border-3 border-dashed rounded-2xl p-12 text-center transition-all
                ${dragActive
                  ? 'border-[#0A3D5C] bg-blue-50'
                  : 'border-gray-300 hover:border-[#0A3D5C] hover:bg-gray-50'
                }
              `}
            >
              <div className="flex flex-col items-center">
                <div className="p-4 bg-blue-100 rounded-full mb-4">
                  <svg className="w-12 h-12 text-[#0A3D5C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                {file ? (
                  <div className="space-y-2">
                    <p className="text-lg font-bold text-gray-900">✓ Archivo cargado</p>
                    <p className="text-sm text-gray-600">{file.name}</p>
                    <button
                      onClick={() => {
                        setFile(null)
                        setParsedData(null)
                      }}
                      className="mt-4 px-4 py-2 text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      Eliminar archivo
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-xl font-bold text-gray-900 mb-2">
                      Arrastra tu archivo CSV aquí
                    </p>
                    <p className="text-gray-600 mb-4">o haz clic para seleccionar</p>
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <span className="inline-flex items-center px-6 py-3 bg-[#0A3D5C] hover:bg-[#083049] text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Seleccionar archivo
                      </span>
                    </label>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-8 bg-red-50 border-l-4 border-red-500 rounded-xl p-6 shadow-md animate-fadeIn">
            <div className="flex items-start">
              <svg className="w-6 h-6 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="ml-3">
                <h3 className="font-semibold text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Preview */}
        {parsedData && !results && (
          <div className="mb-8 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden animate-fadeIn">
            <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-8 py-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Vista previa</h3>
                  <p className="text-sm text-gray-600 mt-1">{parsedData.total} productos listos para procesar</p>
                </div>
                <button
                  onClick={handleProcess}
                  disabled={loading || parsedData.total === 0}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Procesando...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>Calcular Todo</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="p-8">
              {/* Errores de parsing */}
              {parsedData.hasErrors && (
                <div className="mb-6 bg-amber-50 border-l-4 border-amber-500 rounded-xl p-6">
                  <h4 className="font-bold text-amber-800 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    {parsedData.errors.length} errores encontrados
                  </h4>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {parsedData.errors.map((err, idx) => (
                      <p key={idx} className="text-sm text-amber-700">
                        <strong>Línea {err.line}:</strong> {err.error}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Tabla preview */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase">#</th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase">HS Code</th>
                      <th className="px-4 py-4 text-right text-xs font-bold text-gray-600 uppercase">Valor CIF</th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase">País</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {parsedData.items.slice(0, 10).map((item, idx) => (
                      <tr key={idx} className="hover:bg-blue-50">
                        <td className="px-4 py-3 text-sm text-gray-600">{item.lineNumber}</td>
                        <td className="px-4 py-3 text-sm font-mono font-bold text-[#0A3D5C]">{item.hsCode}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">{formatCurrency(item.cifValue)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{item.countryCode}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedData.items.length > 10 && (
                  <p className="text-center text-sm text-gray-500 py-4 bg-gray-50 rounded-b-xl">
                    ... y {parsedData.items.length - 10} productos más
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Resultados */}
        {results && (
          <div className="space-y-8 animate-fadeIn">
            {/* Summary cards */}
            <div className="grid md:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <svg className="w-8 h-8 text-[#0A3D5C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">Procesados</p>
                <p className="text-4xl font-bold text-[#0A3D5C]">{results.summary.total}</p>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-emerald-100 rounded-xl">
                    <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">Exitosos</p>
                <p className="text-4xl font-bold text-emerald-600">{results.summary.successful}</p>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-red-100 rounded-xl">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">Fallidos</p>
                <p className="text-4xl font-bold text-red-600">{results.summary.failed}</p>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-amber-100 rounded-xl">
                    <svg className="w-8 h-8 text-[#F4C542]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">Total</p>
                <p className="text-2xl font-bold text-[#F4C542]">
                  {formatCurrency(results.summary.totals.totalAmount)}
                </p>
              </div>
            </div>

            {/* Totales consolidados */}
            <div className="bg-gradient-to-br from-emerald-500 to-green-500 rounded-2xl shadow-xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-6 flex items-center">
                <svg className="w-8 h-8 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Totales Consolidados
              </h3>
              <div className="grid md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-emerald-100 mb-1">Valor CIF</p>
                  <p className="text-2xl font-bold">{formatCurrency(results.summary.totals.totalCIF)}</p>
                </div>
                <div>
                  <p className="text-sm text-emerald-100 mb-1">Aranceles</p>
                  <p className="text-2xl font-bold">{formatCurrency(results.summary.totals.totalDuties)}</p>
                </div>
                <div>
                  <p className="text-sm text-emerald-100 mb-1">IVA</p>
                  <p className="text-2xl font-bold">{formatCurrency(results.summary.totals.totalVAT)}</p>
                </div>
                <div>
                  <p className="text-sm text-emerald-100 mb-1">TOTAL A PAGAR</p>
                  <p className="text-3xl font-bold">{formatCurrency(results.summary.totals.totalAmount)}</p>
                </div>
              </div>
            </div>

            {/* Tabla detallada */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-8 py-6 border-b border-gray-200">
                <h3 className="text-2xl font-bold text-gray-900">Resultados Detallados</h3>
                <p className="text-sm text-gray-600 mt-1">Desglose completo de cada producto</p>
              </div>
              <div className="p-8 overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase">Estado</th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase">HS Code</th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase">País</th>
                      <th className="px-4 py-4 text-right text-xs font-bold text-gray-600 uppercase">CIF</th>
                      <th className="px-4 py-4 text-right text-xs font-bold text-gray-600 uppercase">Arancel</th>
                      <th className="px-4 py-4 text-right text-xs font-bold text-gray-600 uppercase">IVA</th>
                      <th className="px-4 py-4 text-right text-xs font-bold text-gray-600 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {results.results.map((item, idx) => (
                      <tr key={idx} className={`${item.status === 'error' ? 'bg-red-50' : 'hover:bg-blue-50'} transition-colors`}>
                        <td className="px-4 py-4">
                          {item.status === 'success' ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full font-bold">
                              ✓
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-6 h-6 bg-red-100 text-red-600 rounded-full font-bold" title={item.error}>
                              ✗
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-sm font-mono font-bold text-[#0A3D5C]">
                          {item.hsCode}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">{item.countryCode}</td>
                        <td className="px-4 py-4 text-sm text-gray-900 text-right font-medium">
                          {formatCurrency(item.cifValue)}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900 text-right font-medium">
                          {item.result ? formatCurrency(item.result.duty.amount) : '-'}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900 text-right font-medium">
                          {item.result ? formatCurrency(item.result.vat.amount) : '-'}
                        </td>
                        <td className="px-4 py-4 text-sm font-bold text-emerald-600 text-right">
                          {item.result ? formatCurrency(item.result.total) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Botones finales */}
            <div className="grid md:grid-cols-2 gap-4">
              <button
                onClick={() => {
                  setResults(null)
                  setParsedData(null)
                  setFile(null)
                  setBatchName('')
                }}
                className="flex items-center justify-center px-6 py-4 bg-[#0A3D5C] hover:bg-[#083049] text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Nuevo cálculo masivo</span>
              </button>
              <Link
                href="/dashboard"
                className="flex items-center justify-center px-6 py-4 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span>Ver en historial</span>
              </Link>
            </div>
          </div>
        )}
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