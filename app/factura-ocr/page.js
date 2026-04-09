'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { validateExtractedInvoice, summarizeValidation } from '@/lib/invoiceValidator'
import { exportInvoiceToExcel } from '@/lib/excelExporter'

const INCOTERMS = ['EXW', 'FCA', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP', 'FAS', 'FOB', 'CFR', 'CIF']
const COMMON_CURRENCIES = ['EUR', 'USD', 'GBP', 'CNY', 'JPY', 'CHF', 'HKD', 'TRY', 'INR', 'BRL']

export default function FacturaOCRPage() {
  const router = useRouter()
  const fileInputRef = useRef(null)

  const [authChecked, setAuthChecked] = useState(false)
  const [authed, setAuthed] = useState(false)
  const [step, setStep] = useState(1)
  const [file, setFile] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [extractError, setExtractError] = useState(null)
  const [invoiceData, setInvoiceData] = useState(null)
  const [usage, setUsage] = useState(null)
  const [classifying, setClassifying] = useState(false)
  const [classifications, setClassifications] = useState({}) // { lineNumber: { code, confidence, ... } }
  const [reviewedConfirmed, setReviewedConfirmed] = useState(false)
  const [calculating, setCalculating] = useState(false)
  const [calcResults, setCalcResults] = useState(null)
  const [linesFilter, setLinesFilter] = useState('')
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState(null)

  // Cargar historial del usuario
  const loadHistory = useCallback(async () => {
    setHistoryLoading(true)
    setHistoryError(null)
    try {
      const res = await fetch('/api/extract-invoice/history?limit=20')
      const json = await res.json()
      if (!res.ok || !json.success) {
        setHistoryError(json.error || 'Error cargando historial')
        return
      }
      setHistory(json.data || [])
    } catch {
      setHistoryError('Error de red al cargar historial')
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  // Comprobar sesión al montar
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      const ok = !!data?.user
      setAuthed(ok)
      setAuthChecked(true)
      if (ok) loadHistory()
    })
  }, [loadHistory])

  // Re-cargar cuando termina una extracción
  useEffect(() => {
    if (invoiceData && authed) loadHistory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceData])

  const deleteExtraction = async (id) => {
    if (!confirm('¿Borrar esta extracción del historial? No se puede deshacer.')) return
    try {
      const res = await fetch(`/api/extract-invoice/history?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        alert(json.error || 'Error al borrar')
        return
      }
      setHistory((h) => h.filter((x) => x.id !== id))
    } catch {
      alert('Error de red al borrar')
    }
  }

  const reDownloadExcel = async (id) => {
    try {
      const res = await fetch(`/api/extract-invoice/history?id=${encodeURIComponent(id)}`)
      const json = await res.json()
      if (!res.ok || !json.success) {
        alert(json.error || 'Error al cargar extracción')
        return
      }
      exportInvoiceToExcel(json.data.extracted_data, {}, null)
    } catch {
      alert('Error de red al descargar')
    }
  }

  // Re-validación reactiva en frontend cada vez que cambia invoiceData
  const validation = useMemo(() => {
    if (!invoiceData) return null
    const issues = validateExtractedInvoice(invoiceData)
    return summarizeValidation(issues)
  }, [invoiceData])

  // Líneas filtradas para la búsqueda en tabla
  const filteredLineIndexes = useMemo(() => {
    if (!invoiceData?.lines) return []
    const term = linesFilter.trim().toLowerCase()
    if (!term) return invoiceData.lines.map((_, i) => i)
    return invoiceData.lines
      .map((l, i) => ({ l, i }))
      .filter(({ l }) => {
        const hay = [l.description, l.description_es, l.taric_code, l.hs_code_on_invoice, l.country_of_origin]
          .filter(Boolean).join(' ').toLowerCase()
        return hay.includes(term)
      })
      .map(({ i }) => i)
  }, [invoiceData, linesFilter])

  // Export a Excel
  const handleExportExcel = () => {
    if (!invoiceData) return
    try {
      exportInvoiceToExcel(invoiceData, classifications, calcResults)
    } catch (err) {
      alert('No se ha podido generar el Excel: ' + (err?.message || 'error'))
    }
  }

  // ============================================
  // Drag & drop / selección de archivo
  // ============================================
  const handleFile = useCallback((f) => {
    setExtractError(null)
    if (!f) return
    const allowed = ['application/pdf', 'image/png', 'image/jpeg']
    if (!allowed.includes(f.type)) {
      setExtractError('Formato no soportado. Solo PDF, PNG o JPG.')
      return
    }
    if (f.size > 10 * 1024 * 1024) {
      setExtractError('El archivo supera el tamaño máximo de 10 MB.')
      return
    }
    setFile(f)
  }, [])

  const onDrop = (e) => {
    e.preventDefault()
    setDragActive(false)
    handleFile(e.dataTransfer.files?.[0])
  }

  // ============================================
  // Extracción
  // ============================================
  const extract = async () => {
    if (!file) return
    setExtracting(true)
    setExtractError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/extract-invoice', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setExtractError(json.error || 'Error al extraer la factura.')
        return
      }
      setInvoiceData(json.data)
      setUsage(json.usage?.daily || null)
      setStep(2)
    } catch (err) {
      setExtractError('Error de red. Inténtalo de nuevo.')
    } finally {
      setExtracting(false)
    }
  }

  // ============================================
  // Edición de campos (con re-validación reactiva)
  // ============================================
  const updateInvoiceField = (field, value) => {
    setInvoiceData((prev) => ({
      ...prev,
      invoice: { ...prev.invoice, [field]: value },
    }))
  }

  const updateLine = (idx, field, value) => {
    setInvoiceData((prev) => {
      const lines = [...(prev.lines || [])]
      lines[idx] = { ...lines[idx], [field]: value }
      return { ...prev, lines }
    })
  }

  const parseNumber = (v) => {
    if (v === '' || v === null || v === undefined) return null
    const n = Number(String(v).replace(',', '.'))
    return Number.isFinite(n) ? n : null
  }

  // ============================================
  // Clasificación de líneas
  // ============================================
  const classifyAll = async () => {
    if (!invoiceData?.lines?.length) return
    setClassifying(true)
    try {
      const res = await fetch('/api/extract-invoice/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lines: invoiceData.lines.map((l) => ({
            line_number: l.line_number,
            description: l.description,
            description_es: l.description_es,
            country: l.country_of_origin || invoiceData.invoice?.supplier_country,
            total_price: l.total_price,
          })),
        }),
      })
      const json = await res.json()
      if (json.success) {
        const map = {}
        json.classifications.forEach((c) => {
          map[c.line_number] = c
        })
        setClassifications(map)
      } else {
        alert(json.error || 'Error al clasificar')
      }
    } finally {
      setClassifying(false)
    }
  }

  const acceptSuggestion = (lineNumber) => {
    const sug = classifications[lineNumber]
    if (!sug?.suggested_code) return
    const idx = invoiceData.lines.findIndex((l) => l.line_number === lineNumber)
    if (idx >= 0) updateLine(idx, 'taric_code', sug.suggested_code)
  }

  // ============================================
  // Cálculo de tributos
  // ============================================
  const calculateAll = async () => {
    if (!invoiceData?.lines?.length) return
    setCalculating(true)
    try {
      const linesToCalc = invoiceData.lines.filter(
        (l) => l.taric_code && typeof l.total_price === 'number' && l.total_price > 0
      )
      const results = await Promise.all(
        linesToCalc.map(async (line) => {
          try {
            const res = await fetch('/api/calculate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                hsCode: line.taric_code,
                cifValue: line.total_price,
                countryCode: line.country_of_origin || invoiceData.invoice?.supplier_country,
                currency: invoiceData.invoice?.currency,
              }),
            })
            const data = await res.json()
            return { line_number: line.line_number, ...data }
          } catch {
            return { line_number: line.line_number, error: 'fallo' }
          }
        })
      )
      setCalcResults(results)
      setStep(3)
    } finally {
      setCalculating(false)
    }
  }

  // ============================================
  // RENDER
  // ============================================
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500">Cargando…</div>
      </div>
    )
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-slate-50">
        <section className="bg-[#0A3D5C] py-16">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
              Extractor de Facturas <span className="text-[#F4C542]">con IA</span>
            </h1>
            <p className="text-white/70 mb-8">
              Sube tu factura comercial y obtén datos, código TARIC y aranceles automáticamente.
            </p>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
              <p className="text-white/80 mb-4">Necesitas iniciar sesión para usar esta herramienta.</p>
              <button
                onClick={() => router.push('/auth/login?redirect=/factura-ocr')}
                className="px-7 py-3 bg-[#F4C542] text-[#0A3D5C] font-bold rounded-xl hover:bg-[#F4C542]/90 transition"
              >
                Iniciar sesión
              </button>
            </div>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* HERO */}
      <section className="relative overflow-hidden bg-[#0A3D5C] py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block px-4 py-1.5 bg-white/10 border border-white/10 text-white/70 rounded-full text-sm font-medium mb-5">
            Powered by Claude Vision · Free tier: 2/día
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
            Extractor de Facturas <span className="text-[#F4C542]">Comerciales</span>
          </h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto leading-relaxed">
            Sube una factura PDF o imagen y obtén automáticamente proveedor, líneas, código TARIC y cálculo de aranceles.
          </p>
        </div>
      </section>

      {/* BANNER DE SEGURIDAD */}
      <div className="max-w-5xl mx-auto px-4 pt-8">
        <div className="bg-slate-100 border-l-4 border-green-500 rounded-r-lg p-5">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🔒</span>
            <div className="text-sm text-slate-700 leading-relaxed">
              <p className="font-semibold text-slate-900 mb-2">Tu factura está protegida</p>
              <ul className="space-y-1 text-slate-600">
                <li>• El archivo se procesa en memoria y <strong>NO se almacena</strong> en nuestros servidores</li>
                <li>• Los datos viajan cifrados (TLS) a la API de Anthropic (Claude)</li>
                <li>• Anthropic no entrena con datos enviados vía API (política Zero Data Retention)</li>
                <li>• Solo se guardan los <strong>datos extraídos</strong> en tu cuenta privada</li>
                <li>• Puedes eliminar tus extracciones en cualquier momento desde tu dashboard</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENIDO */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* PASO 1 — SUBIR */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-full bg-[#0A3D5C] text-white flex items-center justify-center font-bold text-sm">1</div>
            <h2 className="text-xl font-bold text-slate-900">Sube tu factura</h2>
          </div>

          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
            onDragLeave={() => setDragActive(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition ${
              dragActive ? 'border-[#0A3D5C] bg-blue-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="application/pdf,image/png,image/jpeg"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            {file ? (
              <div>
                <p className="text-slate-900 font-semibold">{file.name}</p>
                <p className="text-slate-500 text-sm mt-1">{(file.size / 1024).toFixed(0)} KB · {file.type}</p>
                <button
                  onClick={(e) => { e.stopPropagation(); setFile(null) }}
                  className="mt-3 text-sm text-red-600 hover:underline"
                >
                  Quitar archivo
                </button>
              </div>
            ) : (
              <div>
                <div className="text-5xl mb-3">📄</div>
                <p className="text-slate-700 font-medium">Arrastra tu factura aquí o haz clic para seleccionar</p>
                <p className="text-slate-500 text-sm mt-2">PDF, PNG o JPG · Máximo 10 MB · Hasta 20 páginas</p>
              </div>
            )}
          </div>

          {extractError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {extractError}
            </div>
          )}

          <div className="mt-5 flex items-center justify-between flex-wrap gap-3">
            <p className="text-xs text-slate-500">
              {usage?.unlimited
                ? '👑 Sin límite (admin)'
                : usage
                  ? `Has usado ${usage.used}/${usage.limit} extracciones hoy.`
                  : 'Free tier: 2 extracciones por día.'}
            </p>
            <button
              onClick={extract}
              disabled={!file || extracting}
              className="px-6 py-3 bg-[#0A3D5C] text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0A3D5C]/90 transition"
            >
              {extracting ? 'Extrayendo con IA…' : 'Extraer datos'}
            </button>
          </div>
        </section>

        {/* PASO 2 — REVISAR */}
        {invoiceData && (
          <section className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-full bg-[#0A3D5C] text-white flex items-center justify-center font-bold text-sm">2</div>
              <h2 className="text-xl font-bold text-slate-900">Revisa los datos extraídos</h2>
            </div>

            {/* PANEL DE VALIDACIÓN */}
            {validation && validation.issues.length > 0 && (
              <div className={`mb-6 p-4 rounded-xl border ${
                validation.errors > 0
                  ? 'bg-red-50 border-red-200'
                  : validation.warnings > 0
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-blue-50 border-blue-200'
              }`}>
                <p className={`font-semibold mb-2 ${
                  validation.errors > 0 ? 'text-red-800' : validation.warnings > 0 ? 'text-amber-800' : 'text-blue-800'
                }`}>
                  {validation.errors > 0
                    ? `⚠️ Se han detectado ${validation.errors} inconsistencia${validation.errors > 1 ? 's' : ''}. Revisa antes de calcular.`
                    : validation.warnings > 0
                      ? `Datos extraídos con ${validation.warnings} observacion${validation.warnings > 1 ? 'es' : ''}.`
                      : 'Información adicional'}
                </p>
                <ul className="text-sm space-y-1">
                  {validation.issues.map((iss, i) => (
                    <li key={i} className={
                      iss.severity === 'error' ? 'text-red-700' :
                      iss.severity === 'warning' ? 'text-amber-700' : 'text-blue-700'
                    }>
                      • {iss.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {validation && validation.errors === 0 && validation.warnings === 0 && (
              <div className="mb-6 p-4 rounded-xl border bg-green-50 border-green-200 text-green-800 text-sm font-medium">
                ✓ Datos verificados — totales cuadran y campos completos.
              </div>
            )}

            {/* DATOS GENERALES — fila tipo hoja de cálculo */}
            <div className="mb-5 border border-slate-300 rounded overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead className="bg-slate-100 text-[10px] uppercase tracking-wider text-slate-600">
                  <tr>
                    <th className="px-2 py-1.5 text-left border-r border-slate-300 font-semibold">Proveedor</th>
                    <th className="px-2 py-1.5 text-left border-r border-slate-300 font-semibold w-16">País</th>
                    <th className="px-2 py-1.5 text-left border-r border-slate-300 font-semibold w-32">Nº factura</th>
                    <th className="px-2 py-1.5 text-left border-r border-slate-300 font-semibold w-32">Fecha</th>
                    <th className="px-2 py-1.5 text-left border-r border-slate-300 font-semibold w-20">Divisa</th>
                    <th className="px-2 py-1.5 text-left border-r border-slate-300 font-semibold w-24">Incoterm</th>
                    <th className="px-2 py-1.5 text-right font-semibold w-32">Total factura</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white">
                    <td className="border-t border-r border-slate-300 p-0">
                      <input
                        value={invoiceData.invoice?.supplier_name || ''}
                        onChange={(e) => updateInvoiceField('supplier_name', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm bg-transparent focus:outline-none focus:bg-blue-50"
                      />
                    </td>
                    <td className="border-t border-r border-slate-300 p-0">
                      <input
                        value={invoiceData.invoice?.supplier_country || ''}
                        maxLength={2}
                        onChange={(e) => updateInvoiceField('supplier_country', e.target.value.toUpperCase())}
                        className="w-full px-2 py-1.5 text-sm bg-transparent uppercase font-mono focus:outline-none focus:bg-blue-50"
                      />
                    </td>
                    <td className="border-t border-r border-slate-300 p-0">
                      <input
                        value={invoiceData.invoice?.invoice_number || ''}
                        onChange={(e) => updateInvoiceField('invoice_number', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm bg-transparent font-mono focus:outline-none focus:bg-blue-50"
                      />
                    </td>
                    <td className="border-t border-r border-slate-300 p-0">
                      <input
                        type="date"
                        value={invoiceData.invoice?.invoice_date || ''}
                        onChange={(e) => updateInvoiceField('invoice_date', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm bg-transparent focus:outline-none focus:bg-blue-50"
                      />
                    </td>
                    <td className="border-t border-r border-slate-300 p-0">
                      <select
                        value={invoiceData.invoice?.currency || ''}
                        onChange={(e) => updateInvoiceField('currency', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm bg-transparent font-mono focus:outline-none focus:bg-blue-50"
                      >
                        <option value="">—</option>
                        {COMMON_CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </td>
                    <td className="border-t border-r border-slate-300 p-0">
                      <select
                        value={(invoiceData.invoice?.incoterm || '').toUpperCase().split(' ')[0]}
                        onChange={(e) => updateInvoiceField('incoterm', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm bg-transparent font-mono focus:outline-none focus:bg-blue-50"
                      >
                        <option value="">—</option>
                        {INCOTERMS.map((i) => <option key={i} value={i}>{i}</option>)}
                      </select>
                    </td>
                    <td className="border-t border-slate-300 p-0">
                      <input
                        type="number"
                        value={invoiceData.invoice?.total_amount ?? ''}
                        onChange={(e) => updateInvoiceField('total_amount', parseNumber(e.target.value))}
                        className="w-full px-2 py-1.5 text-sm bg-transparent text-right font-mono tabular-nums focus:outline-none focus:bg-blue-50"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* AVISO INCOTERM */}
            {invoiceData.invoice?.incoterm && incotermNote(invoiceData.invoice.incoterm) && (
              <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                ⚠️ {incotermNote(invoiceData.invoice.incoterm)}
              </div>
            )}

            {/* TABLA DE LÍNEAS */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <h3 className="font-semibold text-slate-900">
                Líneas de producto ({invoiceData.lines?.length || 0})
                {linesFilter && (
                  <span className="text-slate-500 font-normal ml-2">· {filteredLineIndexes.length} visibles</span>
                )}
              </h3>
              <div className="flex flex-wrap gap-2 items-center">
                <input
                  type="search"
                  placeholder="🔍 Filtrar líneas…"
                  value={linesFilter}
                  onChange={(e) => setLinesFilter(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm w-48 focus:outline-none focus:ring-2 focus:ring-[#0A3D5C]/30"
                />
                <button
                  onClick={handleExportExcel}
                  className="px-3 py-1.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition flex items-center gap-1.5"
                  title="Descargar todos los datos extraídos en Excel (3 hojas: cabecera, líneas, resumen)"
                >
                  📊 Exportar a Excel
                </button>
              </div>
            </div>
            <div className="border border-slate-300 rounded overflow-auto max-h-[600px]">
              <table className="w-full text-xs border-collapse">
                <thead className="bg-slate-100 text-[10px] uppercase tracking-wider text-slate-600 sticky top-0 z-10">
                  <tr>
                    <th className="px-2 py-1.5 text-left border-r border-b border-slate-300 font-semibold w-10">#</th>
                    <th className="px-2 py-1.5 text-left border-r border-b border-slate-300 font-semibold min-w-[260px]">Descripción</th>
                    <th className="px-2 py-1.5 text-right border-r border-b border-slate-300 font-semibold w-20">Qty</th>
                    <th className="px-2 py-1.5 text-left border-r border-b border-slate-300 font-semibold w-16">Ud.</th>
                    <th className="px-2 py-1.5 text-right border-r border-b border-slate-300 font-semibold w-24">P. unit.</th>
                    <th className="px-2 py-1.5 text-right border-r border-b border-slate-300 font-semibold w-28">Total</th>
                    <th className="px-2 py-1.5 text-left border-r border-b border-slate-300 font-semibold w-16">Origen</th>
                    <th className="px-2 py-1.5 text-right border-r border-b border-slate-300 font-semibold w-20">Peso (kg)</th>
                    <th className="px-2 py-1.5 text-left border-r border-b border-slate-300 font-semibold w-32">TARIC</th>
                    <th className="px-2 py-1.5 text-left border-b border-slate-300 font-semibold w-28">Sugerencia IA</th>
                  </tr>
                </thead>
                <tbody className="font-mono tabular-nums">
                  {filteredLineIndexes.map((idx) => {
                    const line = invoiceData.lines[idx]
                    const sug = classifications[line.line_number]
                    return (
                      <tr key={idx} className="hover:bg-blue-50/40">
                        <td className="border-b border-r border-slate-200 px-2 py-1 text-slate-500 text-center">{line.line_number}</td>
                        <td className="border-b border-r border-slate-200 p-0">
                          <input
                            value={line.description_es || line.description || ''}
                            onChange={(e) => updateLine(idx, 'description_es', e.target.value)}
                            className="w-full px-2 py-1 bg-transparent text-slate-900 font-sans focus:outline-none focus:bg-blue-50"
                          />
                        </td>
                        <td className="border-b border-r border-slate-200 p-0">
                          <input
                            type="number"
                            value={line.quantity ?? ''}
                            onChange={(e) => updateLine(idx, 'quantity', parseNumber(e.target.value))}
                            className="w-full px-2 py-1 bg-transparent text-right text-slate-900 focus:outline-none focus:bg-blue-50"
                          />
                        </td>
                        <td className="border-b border-r border-slate-200 p-0">
                          <input
                            value={line.unit || ''}
                            onChange={(e) => updateLine(idx, 'unit', e.target.value)}
                            className="w-full px-2 py-1 bg-transparent text-slate-900 uppercase focus:outline-none focus:bg-blue-50"
                          />
                        </td>
                        <td className="border-b border-r border-slate-200 p-0">
                          <input
                            type="number"
                            value={line.unit_price ?? ''}
                            onChange={(e) => updateLine(idx, 'unit_price', parseNumber(e.target.value))}
                            className="w-full px-2 py-1 bg-transparent text-right text-slate-900 focus:outline-none focus:bg-blue-50"
                          />
                        </td>
                        <td className="border-b border-r border-slate-200 p-0">
                          <input
                            type="number"
                            value={line.total_price ?? ''}
                            onChange={(e) => updateLine(idx, 'total_price', parseNumber(e.target.value))}
                            className="w-full px-2 py-1 bg-transparent text-right text-slate-900 font-semibold focus:outline-none focus:bg-blue-50"
                          />
                        </td>
                        <td className="border-b border-r border-slate-200 p-0">
                          <input
                            value={line.country_of_origin || ''}
                            maxLength={2}
                            onChange={(e) => updateLine(idx, 'country_of_origin', e.target.value.toUpperCase())}
                            className="w-full px-2 py-1 bg-transparent text-slate-900 uppercase text-center focus:outline-none focus:bg-blue-50"
                          />
                        </td>
                        <td className="border-b border-r border-slate-200 p-0">
                          <input
                            type="number"
                            value={line.net_weight_kg ?? ''}
                            onChange={(e) => updateLine(idx, 'net_weight_kg', parseNumber(e.target.value))}
                            className="w-full px-2 py-1 bg-transparent text-right text-slate-900 focus:outline-none focus:bg-blue-50"
                          />
                        </td>
                        <td className="border-b border-r border-slate-200 p-0">
                          <input
                            value={line.taric_code || line.hs_code_on_invoice || ''}
                            onChange={(e) => updateLine(idx, 'taric_code', e.target.value)}
                            placeholder="—"
                            className="w-full px-2 py-1 bg-transparent text-slate-900 focus:outline-none focus:bg-blue-50"
                          />
                        </td>
                        <td className="border-b border-slate-200 px-2 py-1">
                          {sug?.suggested_code ? (
                            <button
                              onClick={() => acceptSuggestion(line.line_number)}
                              className="text-[#0A3D5C] hover:underline text-left"
                              title={`Aceptar (${sug.confidence}% confianza)`}
                            >
                              {sug.suggested_code}
                              <span className="text-slate-400 ml-1">{sug.confidence}%</span>
                            </button>
                          ) : sug?.error ? (
                            <span className="text-red-600 text-[10px]">error</span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                {invoiceData.lines?.length > 0 && (
                  <tfoot className="bg-slate-100 font-mono tabular-nums sticky bottom-0 z-10">
                    <tr>
                      <td className="border-t border-r border-slate-300 px-2 py-1.5 text-[10px] uppercase tracking-wider text-slate-600 font-semibold" colSpan={2}>Totales</td>
                      <td className="border-t border-r border-slate-300 px-2 py-1.5 text-right font-semibold">
                        {invoiceData.lines.reduce((a, l) => a + (Number(l.quantity) || 0), 0)}
                      </td>
                      <td className="border-t border-r border-slate-300"></td>
                      <td className="border-t border-r border-slate-300"></td>
                      <td className="border-t border-r border-slate-300 px-2 py-1.5 text-right font-bold text-[#0A3D5C]">
                        {invoiceData.lines.reduce((a, l) => a + (Number(l.total_price) || 0), 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="border-t border-r border-slate-300"></td>
                      <td className="border-t border-r border-slate-300 px-2 py-1.5 text-right">
                        {invoiceData.lines.reduce((a, l) => a + (Number(l.net_weight_kg) || 0), 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="border-t border-r border-slate-300"></td>
                      <td className="border-t border-slate-300"></td>
                    </tr>
                  </tfoot>
                )}
              </table>
              {filteredLineIndexes.length === 0 && (
                <div className="px-4 py-6 text-center text-xs text-slate-500">
                  Ninguna línea coincide con &quot;{linesFilter}&quot;.
                </div>
              )}
            </div>

            <div className="mt-5 flex flex-wrap gap-3 items-center">
              <button
                onClick={classifyAll}
                disabled={classifying || !invoiceData.lines?.length}
                className="px-5 py-2.5 bg-[#F4C542] text-[#0A3D5C] font-semibold rounded-xl disabled:opacity-50 hover:bg-[#F4C542]/90 transition"
              >
                {classifying ? 'Clasificando con IA…' : '🤖 Clasificar líneas con IA'}
              </button>
              {validation?.errors > 0 && (
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={reviewedConfirmed}
                    onChange={(e) => setReviewedConfirmed(e.target.checked)}
                  />
                  He revisado y confirmo los datos
                </label>
              )}
              <button
                onClick={calculateAll}
                disabled={
                  calculating ||
                  (validation?.errors > 0 && !reviewedConfirmed) ||
                  !invoiceData.lines?.some((l) => l.taric_code && l.total_price)
                }
                className="px-5 py-2.5 bg-[#0A3D5C] text-white font-semibold rounded-xl disabled:opacity-50 hover:bg-[#0A3D5C]/90 transition"
              >
                {calculating ? 'Calculando…' : '💰 Calcular tributos'}
              </button>
            </div>
          </section>
        )}

        {/* PASO 3 — RESULTADOS */}
        {calcResults && (
          <section className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#0A3D5C] text-white flex items-center justify-center font-bold text-sm">3</div>
                <h2 className="text-xl font-bold text-slate-900">Resultados del cálculo</h2>
              </div>
              <button
                onClick={handleExportExcel}
                className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition flex items-center gap-1.5"
              >
                📊 Exportar todo a Excel
              </button>
            </div>

            {/* Totales generales */}
            {(() => {
              const totalDuty = calcResults.reduce((acc, r) => acc + (Number(r.dutyAmount) || 0), 0)
              const totalVat = calcResults.reduce((acc, r) => acc + (Number(r.vatAmount) || 0), 0)
              const totalCif = calcResults.reduce((acc, r) => acc + (Number(r.cifValue) || 0), 0)
              return (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <div className="text-xs text-slate-500">Valor CIF total</div>
                    <div className="text-lg font-bold text-slate-900">{formatMoney(totalCif)}</div>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <div className="text-xs text-slate-500">Arancel total</div>
                    <div className="text-lg font-bold text-slate-900">{formatMoney(totalDuty)}</div>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <div className="text-xs text-slate-500">IVA total</div>
                    <div className="text-lg font-bold text-slate-900">{formatMoney(totalVat)}</div>
                  </div>
                  <div className="bg-[#0A3D5C] text-white border border-[#0A3D5C] rounded-lg p-3">
                    <div className="text-xs text-white/70">Total tributos</div>
                    <div className="text-lg font-bold">{formatMoney(totalDuty + totalVat)}</div>
                  </div>
                </div>
              )
            })()}

            <div className="border border-slate-300 rounded overflow-auto max-h-[600px]">
              <table className="w-full text-xs border-collapse">
                <thead className="bg-slate-100 text-[10px] uppercase tracking-wider text-slate-600 sticky top-0 z-10">
                  <tr>
                    <th className="px-2 py-1.5 text-left border-r border-b border-slate-300 font-semibold w-12">#</th>
                    <th className="px-2 py-1.5 text-left border-r border-b border-slate-300 font-semibold w-32">TARIC</th>
                    <th className="px-2 py-1.5 text-right border-r border-b border-slate-300 font-semibold">Valor CIF</th>
                    <th className="px-2 py-1.5 text-right border-r border-b border-slate-300 font-semibold w-20">Aran. %</th>
                    <th className="px-2 py-1.5 text-right border-r border-b border-slate-300 font-semibold">Arancel €</th>
                    <th className="px-2 py-1.5 text-right border-r border-b border-slate-300 font-semibold w-16">IVA %</th>
                    <th className="px-2 py-1.5 text-right border-r border-b border-slate-300 font-semibold">IVA €</th>
                    <th className="px-2 py-1.5 text-right border-b border-slate-300 font-semibold">Total tributos</th>
                  </tr>
                </thead>
                <tbody className="font-mono tabular-nums">
                  {calcResults.map((r, i) => (
                    <tr key={i} className="hover:bg-blue-50/40">
                      <td className="border-b border-r border-slate-200 px-2 py-1 text-slate-500 text-center">{r.line_number}</td>
                      <td className="border-b border-r border-slate-200 px-2 py-1">{r.hsCode || '—'}</td>
                      <td className="border-b border-r border-slate-200 px-2 py-1 text-right">{formatMoney(r.cifValue)}</td>
                      <td className="border-b border-r border-slate-200 px-2 py-1 text-right text-slate-500">{r.dutyRate ?? '—'}</td>
                      <td className="border-b border-r border-slate-200 px-2 py-1 text-right">{formatMoney(r.dutyAmount)}</td>
                      <td className="border-b border-r border-slate-200 px-2 py-1 text-right text-slate-500">{r.vatRate ?? '—'}</td>
                      <td className="border-b border-r border-slate-200 px-2 py-1 text-right">{formatMoney(r.vatAmount)}</td>
                      <td className="border-b border-slate-200 px-2 py-1 text-right font-bold text-[#0A3D5C]">
                        {formatMoney((r.dutyAmount || 0) + (r.vatAmount || 0))}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100 font-mono tabular-nums sticky bottom-0 z-10">
                  <tr>
                    <td className="border-t border-r border-slate-300 px-2 py-1.5 text-[10px] uppercase tracking-wider text-slate-600 font-semibold" colSpan={2}>Totales</td>
                    <td className="border-t border-r border-slate-300 px-2 py-1.5 text-right font-semibold">
                      {formatMoney(calcResults.reduce((a, r) => a + (Number(r.cifValue) || 0), 0))}
                    </td>
                    <td className="border-t border-r border-slate-300"></td>
                    <td className="border-t border-r border-slate-300 px-2 py-1.5 text-right font-semibold">
                      {formatMoney(calcResults.reduce((a, r) => a + (Number(r.dutyAmount) || 0), 0))}
                    </td>
                    <td className="border-t border-r border-slate-300"></td>
                    <td className="border-t border-r border-slate-300 px-2 py-1.5 text-right font-semibold">
                      {formatMoney(calcResults.reduce((a, r) => a + (Number(r.vatAmount) || 0), 0))}
                    </td>
                    <td className="border-t border-slate-300 px-2 py-1.5 text-right font-bold text-[#0A3D5C]">
                      {formatMoney(calcResults.reduce((a, r) => a + (Number(r.dutyAmount) || 0) + (Number(r.vatAmount) || 0), 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        )}

        {/* HISTORIAL */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm">🗂</div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Historial de extracciones</h2>
                <p className="text-xs text-slate-500">Solo se guardan los datos extraídos, nunca el archivo original.</p>
              </div>
            </div>
            <button
              onClick={loadHistory}
              disabled={historyLoading}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
            >
              {historyLoading ? 'Cargando…' : '↻ Actualizar'}
            </button>
          </div>

          {historyError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
              {historyError}
            </div>
          )}

          {!historyLoading && history.length === 0 && !historyError && (
            <div className="text-center py-10 text-sm text-slate-500">
              Aún no has extraído ninguna factura. Sube una arriba para empezar.
            </div>
          )}

          {history.length > 0 && (
            <div className="border border-slate-300 rounded overflow-auto max-h-[500px]">
              <table className="w-full text-xs border-collapse">
                <thead className="bg-slate-100 text-[10px] uppercase tracking-wider text-slate-600 sticky top-0 z-10">
                  <tr>
                    <th className="px-2 py-1.5 text-left border-r border-b border-slate-300 font-semibold w-32">Fecha</th>
                    <th className="px-2 py-1.5 text-left border-r border-b border-slate-300 font-semibold">Proveedor</th>
                    <th className="px-2 py-1.5 text-left border-r border-b border-slate-300 font-semibold w-14">País</th>
                    <th className="px-2 py-1.5 text-left border-r border-b border-slate-300 font-semibold w-32">Nº factura</th>
                    <th className="px-2 py-1.5 text-left border-r border-b border-slate-300 font-semibold w-20">Incoterm</th>
                    <th className="px-2 py-1.5 text-right border-r border-b border-slate-300 font-semibold w-14">Líneas</th>
                    <th className="px-2 py-1.5 text-right border-r border-b border-slate-300 font-semibold w-28">Total</th>
                    <th className="px-2 py-1.5 text-center border-b border-slate-300 font-semibold w-36">Acciones</th>
                  </tr>
                </thead>
                <tbody className="font-mono tabular-nums">
                  {history.map((row) => {
                    const issues = Array.isArray(row.validation_issues) ? row.validation_issues : []
                    const errors = issues.filter((i) => i.severity === 'error').length
                    const warnings = issues.filter((i) => i.severity === 'warning').length
                    return (
                      <tr key={row.id} className="hover:bg-blue-50/40">
                        <td className="border-b border-r border-slate-200 px-2 py-1 text-slate-500">
                          {new Date(row.created_at).toLocaleString('es-ES', {
                            day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit',
                          })}
                        </td>
                        <td className="border-b border-r border-slate-200 px-2 py-1 text-slate-900 font-sans truncate max-w-[200px]" title={row.supplier_name || ''}>
                          {row.supplier_name || <span className="text-slate-400">—</span>}
                          {errors > 0 && <span className="ml-1 text-red-600" title={`${errors} error(es) de validación`}>⚠</span>}
                          {errors === 0 && warnings > 0 && <span className="ml-1 text-amber-600" title={`${warnings} aviso(s)`}>!</span>}
                        </td>
                        <td className="border-b border-r border-slate-200 px-2 py-1 text-center text-slate-700">
                          {row.supplier_country || '—'}
                        </td>
                        <td className="border-b border-r border-slate-200 px-2 py-1 text-slate-700 truncate max-w-[120px]" title={row.invoice_number || ''}>
                          {row.invoice_number || '—'}
                        </td>
                        <td className="border-b border-r border-slate-200 px-2 py-1 text-slate-700">
                          {row.incoterm ? String(row.incoterm).toUpperCase().split(' ')[0] : '—'}
                        </td>
                        <td className="border-b border-r border-slate-200 px-2 py-1 text-right text-slate-700">
                          {row.lines_count ?? 0}
                        </td>
                        <td className="border-b border-r border-slate-200 px-2 py-1 text-right font-semibold text-slate-900">
                          {typeof row.total_amount === 'number'
                            ? `${row.total_amount.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${row.currency || ''}`.trim()
                            : '—'}
                        </td>
                        <td className="border-b border-slate-200 px-2 py-1 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => reDownloadExcel(row.id)}
                              className="px-2 py-0.5 text-[11px] font-semibold text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded"
                              title="Descargar Excel"
                            >
                              📊 Excel
                            </button>
                            <button
                              onClick={() => deleteExtraction(row.id)}
                              className="px-2 py-0.5 text-[11px] font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded"
                              title="Borrar del historial"
                            >
                              🗑
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* DISCLAIMER */}
        <div className="text-xs text-slate-500 text-center pb-8">
          Los datos extraídos son orientativos. Verifica siempre contra la factura original.
          Las clasificaciones IA no sustituyen una IAV (Información Arancelaria Vinculante).
        </div>
      </div>
    </div>
  )
}

// ============================================
// Sub-componentes locales
// ============================================
function Field({ label, value, onChange, type = 'text', maxLength }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-slate-600 mb-1">{label}</span>
      <input
        type={type}
        value={value ?? ''}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A3D5C]/30"
      />
    </label>
  )
}

function SelectField({ label, value, options, onChange }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-slate-600 mb-1">{label}</span>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A3D5C]/30 bg-white"
      >
        <option value="">— Seleccionar —</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  )
}

function incotermNote(incoterm) {
  const i = String(incoterm).toUpperCase().split(' ')[0]
  if (['FOB', 'FCA', 'EXW', 'FAS'].includes(i)) {
    return 'El valor declarado NO incluye flete ni seguro. Deberás ajustar el valor en aduana sumando esos costes.'
  }
  if (['DDP', 'DAP', 'DPU'].includes(i)) {
    return 'El valor puede incluir gastos post-importación que deben deducirse del valor en aduana.'
  }
  return null
}

function formatMoney(n) {
  if (n === null || n === undefined || isNaN(n)) return '—'
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n)
}
