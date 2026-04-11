'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { parseCSV, generateSampleCSV } from '@/lib/csvParser'
import { exportBulkToExcel } from '@/lib/excelExporter'
import { useTranslation } from '@/lib/i18n'
import { bulkDict } from '@/lib/i18n/bulk'

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
  const t = useTranslation(bulkDict)

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
          setError(t('upload.fileErrors').replace('{count}', parsed.errors.length))
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
        setError(t('upload.csvOnly'))
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
            setError(t('upload.fileErrors').replace('{count}', parsed.errors.length))
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
      setError(t('upload.noValidData'))
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
          batchName: batchName || `${t('upload.batchPlaceholder')} ${new Date().toLocaleDateString('es-ES')}`
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
      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Hero */}
        <div className="mb-8 bg-gradient-to-r from-[#0A3D5C] to-[#0d5078] rounded-2xl shadow-xl p-8 text-white">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-3">📊 {t('hero.title')}</h2>
              <p className="text-blue-100 text-lg mb-2">{t('hero.subtitle')}</p>
              <p className="text-blue-200 text-sm">
                {t('hero.desc')}
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
              <h3 className="text-xl font-bold text-gray-900">{t('instructions.title')}</h3>
            </div>
          </div>
          <div className="p-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-bold text-gray-900 mb-3">📋 {t('instructions.formatTitle')}</h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <p className="flex items-start">
                    <span className="mr-2">•</span>
                    <span dangerouslySetInnerHTML={{ __html: t('instructions.formatCols') }} />
                  </p>
                  <p className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>{t('instructions.formatSep')}</span>
                  </p>
                  <p className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>{t('instructions.formatMax')}</span>
                  </p>
                  <p className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>{t('instructions.formatDigits')}</span>
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="font-bold text-gray-900 mb-3">⚡ {t('instructions.processTitle')}</h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <p className="flex items-start">
                    <span className="mr-2">1.</span>
                    <span>{t('instructions.processStep1')}</span>
                  </p>
                  <p className="flex items-start">
                    <span className="mr-2">2.</span>
                    <span>{t('instructions.processStep2')}</span>
                  </p>
                  <p className="flex items-start">
                    <span className="mr-2">3.</span>
                    <span>{t('instructions.processStep3')}</span>
                  </p>
                  <p className="flex items-start">
                    <span className="mr-2">4.</span>
                    <span>{t('instructions.processStep4')}</span>
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
                <span>{t('instructions.downloadSample')}</span>
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
                <h3 className="text-xl font-bold text-[#0A3D5C]">{t('upload.title')}</h3>
              </div>
            </div>
            <div className="p-8">
              {/* Nombre del lote */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  {t('upload.batchLabel')}
                </label>
                <input
                  type="text"
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                  placeholder={`${t('upload.batchPlaceholder')} ${new Date().toLocaleDateString('es-ES')}`}
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
                    {file ? file.name : t('upload.dragText')}
                  </p>
                  <p className="text-sm text-gray-500">
                    {t('upload.clickText')}
                  </p>
                </div>
              </div>

              {/* Preview de datos */}
              {parsedData && parsedData.items.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-bold text-gray-900 mb-4">
                    {t('upload.preview')} ({parsedData.items.length} {t('upload.productsDetected')})
                  </h4>
                  <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">{t('upload.colLine')}</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">{t('upload.colHsCode')}</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">{t('upload.colCifValue')}</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">{t('upload.colCountry')}</th>
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
                      ... {t('upload.andMore').replace('{count}', parsedData.items.length - 5)}
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
                    {t('upload.errorsFound')} ({parsedData.errors.length})
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {parsedData.errors.map((err, index) => (
                      <p key={index} className="text-sm text-red-700">
                        • {t('upload.errorLine').replace('{line}', err.line)} {err.message}
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
                    {t('upload.cancel')}
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
                        <span>{t('upload.processing')}</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                        <span>{t('upload.process')} {parsedData.items.length} {t('upload.products')}</span>
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
                    <h3 className="text-xl font-bold text-white">{t('results.title')}</h3>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleExportExcel}
                      className="px-6 py-3 bg-white text-emerald-600 font-bold rounded-xl hover:bg-emerald-50 transition-all shadow-lg flex items-center space-x-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>{t('results.exportExcel')}</span>
                    </button>
                    <button
                      onClick={resetForm}
                      className="px-6 py-3 bg-white/20 backdrop-blur-sm text-white font-bold rounded-xl hover:bg-white/30 transition-all"
                    >
                      {t('results.newBatch')}
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-8">
                {/* Stats Cards */}
                <div className="grid md:grid-cols-4 gap-6 mb-8">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">{t('results.totalProcessed')}</span>
                      <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{results.summary.total}</p>
                  </div>

                  <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-6 border border-emerald-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">{t('results.successful')}</span>
                      <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{results.summary.successful}</p>
                  </div>

                  <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-6 border border-red-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">{t('results.withErrors')}</span>
                      <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{results.summary.failed}</p>
                  </div>

                  <div className="bg-gradient-to-br from-[#F4C542]/20 to-amber-50 rounded-xl p-6 border border-amber-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">{t('results.totalPayable')}</span>
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
                  <h4 className="font-bold text-gray-900 mb-4">{t('results.financialBreakdown')}</h4>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('results.totalCif')}</span>
                      <span className="font-bold text-gray-900">{formatCurrency(results.summary.totals.totalCIF)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('results.totalDuties')}</span>
                      <span className="font-bold text-gray-900">{formatCurrency(results.summary.totals.totalDuties)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('results.totalVat')}</span>
                      <span className="font-bold text-gray-900">{formatCurrency(results.summary.totals.totalVAT)}</span>
                    </div>
                  </div>
                </div>

                {/* Tabla de resultados */}
                <div>
                  <h4 className="font-bold text-gray-900 mb-4">{t('results.productDetail')}</h4>
                  <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">{t('results.colHsCode')}</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">{t('results.colCountry')}</th>
                          <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">{t('results.colCifValue')}</th>
                          <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">{t('results.colDuties')}</th>
                          <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">{t('results.colVat')}</th>
                          <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">{t('results.colTotal')}</th>
                          <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">{t('results.colStatus')}</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {results.results.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            {item.status === 'success' ? (
                              <>
                                <td className="px-4 py-3 text-sm font-mono text-gray-900">
                                  {item.hsCode}
                                  {item.savings > 0 && (
                                    <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">
                                      -{item.savings > 0 ? formatCurrency(item.savings) : ''} {t('results.savings')}
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {item.countryName}
                                  {item.agreement && (
                                    <span className="block text-[10px] text-blue-600 font-medium">{item.agreement}</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-sm text-right text-gray-900">{formatCurrency(item.cifValue)}</td>
                                <td className="px-4 py-3 text-sm text-right text-gray-900">
                                  {formatCurrency(item.dutyAmount)}
                                  <span className="block text-[10px] text-gray-500">
                                    {item.appliedRate}%{item.appliedRate !== item.standardRate && ` (ERGA: ${item.standardRate}%)`}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-right text-gray-900">
                                  {formatCurrency(item.vatAmount)}
                                  <span className="block text-[10px] text-gray-500">{item.vatRate}% {item.vatType}</span>
                                </td>
                                <td className="px-4 py-3 text-sm text-right font-bold text-gray-900">{formatCurrency(item.total)}</td>
                                <td className="px-4 py-3 text-center">
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                    ✓ OK
                                  </span>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="px-4 py-3 text-sm font-mono text-gray-900">{item.hsCode}</td>
                                <td className="px-4 py-3 text-sm text-gray-900">{item.countryCode}</td>
                                <td className="px-4 py-3 text-sm text-right text-gray-900">-</td>
                                <td className="px-4 py-3 text-sm text-right text-gray-400">-</td>
                                <td className="px-4 py-3 text-sm text-right text-gray-400">-</td>
                                <td className="px-4 py-3 text-sm text-right text-gray-400">-</td>
                                <td className="px-4 py-3 text-center">
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800" title={item.error}>
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
                      {t('results.productsWithErrors')} ({results.errors.length})
                    </h4>
                    <div className="space-y-2">
                      {results.errors.map((err, index) => (
                        <div key={index} className="text-sm text-red-700 bg-white rounded-lg p-3">
                          <p className="font-medium">{t('results.errorLine').replace('{line}', err.line).replace('{code}', err.hsCode)}</p>
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