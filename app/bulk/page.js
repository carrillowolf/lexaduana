'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import Link from 'next/link'
import { parseCSV, generateSampleCSV } from '@/lib/csvParser'
import { exportBulkToExcel } from '@/lib/excelExporter'

export default function BulkCalculatorPage() {
  const [file, setFile] = useState(null)
  const [batchName, setBatchName] = useState('')
  const [parsedData, setParsedData] = useState(null)
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
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
    setProgress(0)

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
      setProgress(100)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleExportExcel = () => {
    if (!results) return
    try {
      exportBulkToExcel(results)
    } catch (err) {
      setError('Error al exportar a Excel: ' + err.message)
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

  const resetForm = () => {
    setFile(null)
    setParsedData(null)
    setResults(null)
    setError('')
    setProgress(0)
    setBatchName('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-3">
              <img src="/logo.png" alt="LexAduana" className="h-10 w-10" />
              <div>
                <h1 className="text-xl font-bold text-[#0A3D5C]">Calculadora Masiva</h1>
                <p className="text-xs text-gray-500">Procesa múltiples productos</p>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Hero */}
        <div className="mb-8 bg-gradient-to-r from-[#0A3D5C] to-[#0d5078] rounded-2xl shadow-xl p-8 text-white">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-3">📊 Calculadora Masiva</h2>
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
                    <span>Columnas requeridas: <strong>hsCode</strong>, <strong>cifValue</strong>, <strong>countryCode</strong></span>
                  </p>
                  <p className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Separador: coma (,)</span>
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
                    <span>Procesa y descarga resultados en Excel</span>
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <button
                onClick={downloadSample}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Descargar archivo de ejemplo</span>
              </button>
            </div>
          </div>
        </div>

        {/* Upload Zone */}
        {!results && (
          <div className="mb-8 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-[#F4C542] to-[#f5d05e] px-8 py-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-[#0A3D5C] rounded-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-[#0A3D5C]">Subir archivo CSV</h3>
              </div>
            </div>
            <div className="p-8">
              {/* Nombre del lote */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Nombre del lote (opcional)
                </label>
                <input
                  type="text"
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                  placeholder={`Lote ${new Date().toLocaleDateString('es-ES')}`}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#0A3D5C] focus:ring-4 focus:ring-[#0A3D5C]/10 outline-none transition-all"
                />
              </div>

              {/* Drag & Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative border-3 border-dashed rounded-2xl p-12 text-center transition-all ${dragActive
                    ? 'border-[#0A3D5C] bg-blue-50'
                    : 'border-gray-300 hover:border-[#0A3D5C] hover:bg-gray-50'
                  }`}
              >
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="pointer-events-none">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-lg font-bold text-gray-700 mb-2">
                    {file ? file.name : 'Arrastra tu archivo CSV aquí'}
                  </p>
                  <p className="text-sm text-gray-500">
                    o haz click para seleccionar
                  </p>
                </div>
              </div>

              {/* Preview de datos */}
              {parsedData && parsedData.items.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-bold text-gray-900 mb-4">
                    Vista previa ({parsedData.items.length} productos detectados)
                  </h4>
                  <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Línea</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Código HS</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Valor CIF</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">País</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {parsedData.items.slice(0, 5).map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">{item.lineNumber}</td>
                            <td className="px-4 py-3 text-sm font-mono text-gray-900">{item.hsCode}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{formatCurrency(item.cifValue)}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{item.countryCode}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {parsedData.items.length > 5 && (
                    <p className="text-sm text-gray-500 mt-2 text-center">
                      ... y {parsedData.items.length - 5} productos más
                    </p>
                  )}
                </div>
              )}

              {/* Errores de validación */}
              {parsedData && parsedData.errors && parsedData.errors.length > 0 && (
                <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4">
                  <h4 className="font-bold text-red-900 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Errores encontrados ({parsedData.errors.length})
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {parsedData.errors.map((err, index) => (
                      <p key={index} className="text-sm text-red-700">
                        • Línea {err.line}: {err.message}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Botón procesar */}
              {parsedData && parsedData.items.length > 0 && (
                <div className="mt-6 flex justify-end space-x-4">
                  <button
                    onClick={resetForm}
                    className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleProcess}
                    disabled={loading || (parsedData.hasErrors && parsedData.items.length === 0)}
                    className="px-8 py-3 bg-gradient-to-r from-[#0A3D5C] to-[#0d5078] hover:from-[#083049] hover:to-[#0A3D5C] text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Procesando...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                        <span>Procesar {parsedData.items.length} productos</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Error general */}
              {error && (
                <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-sm text-red-700 flex items-start">
                    <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Resultados */}
        {results && (
          <div className="space-y-6">
            {/* Resumen */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-8 py-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-white">Resultados del procesamiento</h3>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleExportExcel}
                      className="px-6 py-3 bg-white text-emerald-600 font-bold rounded-xl hover:bg-emerald-50 transition-all shadow-lg flex items-center space-x-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Exportar a Excel</span>
                    </button>
                    <button
                      onClick={resetForm}
                      className="px-6 py-3 bg-white/20 backdrop-blur-sm text-white font-bold rounded-xl hover:bg-white/30 transition-all"
                    >
                      Nuevo lote
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-8">
                {/* Stats Cards */}
                <div className="grid md:grid-cols-4 gap-6 mb-8">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">Total procesados</span>
                      <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{results.summary.total}</p>
                  </div>

                  <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-6 border border-emerald-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">Exitosos</span>
                      <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{results.summary.successful}</p>
                  </div>

                  <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-6 border border-red-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">Con errores</span>
                      <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{results.summary.failed}</p>
                  </div>

                  <div className="bg-gradient-to-br from-[#F4C542]/20 to-amber-50 rounded-xl p-6 border border-amber-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">Total a pagar</span>
                      <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">
                      {formatCurrency(results.summary.totals.totalAmount)}
                    </p>
                  </div>
                </div>

                {/* Desglose financiero */}
                <div className="bg-gray-50 rounded-xl p-6 mb-8">
                  <h4 className="font-bold text-gray-900 mb-4">Desglose financiero</h4>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Valor CIF total:</span>
                      <span className="font-bold text-gray-900">{formatCurrency(results.summary.totals.totalCIF)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total aranceles:</span>
                      <span className="font-bold text-gray-900">{formatCurrency(results.summary.totals.totalDuties)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total IVA:</span>
                      <span className="font-bold text-gray-900">{formatCurrency(results.summary.totals.totalVAT)}</span>
                    </div>
                  </div>
                </div>

                {/* Tabla de resultados */}
                <div>
                  <h4 className="font-bold text-gray-900 mb-4">Detalle de productos</h4>
                  <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Código HS</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">País</th>
                          <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">Valor CIF</th>
                          <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">Aranceles</th>
                          <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">IVA</th>
                          <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">Total</th>
                          <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {results.results.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            {item.status === 'success' ? (
                              <>
                                <td className="px-4 py-3 text-sm font-mono text-gray-900">{item.result.hsCode}</td>
                                <td className="px-4 py-3 text-sm text-gray-900">{item.result.country.name}</td>
                                <td className="px-4 py-3 text-sm text-right text-gray-900">{formatCurrency(item.result.cifValue)}</td>
                                <td className="px-4 py-3 text-sm text-right text-gray-900">{formatCurrency(item.result.duty.amount)}</td>
                                <td className="px-4 py-3 text-sm text-right text-gray-900">{formatCurrency(item.result.vat.amount)}</td>
                                <td className="px-4 py-3 text-sm text-right font-bold text-gray-900">{formatCurrency(item.result.total)}</td>
                                <td className="px-4 py-3 text-center">
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                    ✓ Exitoso
                                  </span>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="px-4 py-3 text-sm font-mono text-gray-900">{item.hsCode}</td>
                                <td className="px-4 py-3 text-sm text-gray-900">{item.countryCode}</td>
                                <td className="px-4 py-3 text-sm text-right text-gray-900">{formatCurrency(item.cifValue)}</td>
                                <td className="px-4 py-3 text-sm text-right text-gray-400">-</td>
                                <td className="px-4 py-3 text-sm text-right text-gray-400">-</td>
                                <td className="px-4 py-3 text-sm text-right text-gray-400">-</td>
                                <td className="px-4 py-3 text-center">
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    ✗ Error
                                  </span>
                                </td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Errores detallados */}
                {results.errors && results.errors.length > 0 && (
                  <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-6">
                    <h4 className="font-bold text-red-900 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Productos con errores ({results.errors.length})
                    </h4>
                    <div className="space-y-2">
                      {results.errors.map((err, index) => (
                        <div key={index} className="text-sm text-red-700 bg-white rounded-lg p-3">
                          <p className="font-medium">Línea {err.line} - Código HS: {err.hsCode}</p>
                          <p className="text-red-600 mt-1">{err.error}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}