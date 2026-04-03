'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import ProductLineEditor from './ProductLineEditor'

const STEPS = [
  { number: 1, title: 'Datos de empresa' },
  { number: 2, title: 'Productos importados' },
  { number: 3, title: 'Documentación y confirmación' },
]

function ProgressBar({ currentStep }) {
  return (
    <div className="flex items-center justify-between mb-8">
      {STEPS.map((step, i) => (
        <div key={step.number} className="flex items-center flex-1">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
              currentStep > step.number
                ? 'bg-[#0A3D5C] text-white'
                : currentStep === step.number
                  ? 'bg-[#0A3D5C] text-white ring-4 ring-[#0A3D5C]/20'
                  : 'bg-gray-200 text-gray-500'
            }`}>
              {currentStep > step.number ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              ) : step.number}
            </div>
            <span className={`text-sm font-medium hidden sm:block ${
              currentStep >= step.number ? 'text-[#0A3D5C]' : 'text-gray-400'
            }`}>
              {step.title}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`flex-1 h-0.5 mx-3 ${
              currentStep > step.number ? 'bg-[#0A3D5C]' : 'bg-gray-200'
            }`} />
          )}
        </div>
      ))}
    </div>
  )
}

// ============================================================
// PASO 1: DATOS DE EMPRESA
// ============================================================

function Step1({ data, onChange }) {
  function handleChange(field, value) {
    onChange({ ...data, [field]: value })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Datos de tu empresa</h2>
        <p className="text-sm text-gray-500 mt-1">
          Información necesaria para identificar al importador y contacto principal.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre de la empresa <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={data.companyName || ''}
            onChange={(e) => handleChange('companyName', e.target.value)}
            placeholder="Ej: Aceros del Mediterráneo S.L."
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#0A3D5C]/20 focus:border-[#0A3D5C] outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            CIF/NIF <span className="text-gray-400 text-xs">(recomendado)</span>
          </label>
          <input
            type="text"
            value={data.companyCif || ''}
            onChange={(e) => handleChange('companyCif', e.target.value)}
            placeholder="Ej: B12345678"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#0A3D5C]/20 focus:border-[#0A3D5C] outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Número EORI <span className="text-gray-400 text-xs">(si ya lo tienes)</span>
          </label>
          <input
            type="text"
            value={data.companyEori || ''}
            onChange={(e) => handleChange('companyEori', e.target.value)}
            placeholder="Ej: ES12345678901"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#0A3D5C]/20 focus:border-[#0A3D5C] outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre de contacto <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={data.contactName || ''}
            onChange={(e) => handleChange('contactName', e.target.value)}
            placeholder="Nombre y apellidos"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#0A3D5C]/20 focus:border-[#0A3D5C] outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email de contacto <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={data.contactEmail || ''}
            onChange={(e) => handleChange('contactEmail', e.target.value)}
            placeholder="email@empresa.com"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#0A3D5C]/20 focus:border-[#0A3D5C] outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Teléfono <span className="text-gray-400 text-xs">(opcional)</span>
          </label>
          <input
            type="tel"
            value={data.contactPhone || ''}
            onChange={(e) => handleChange('contactPhone', e.target.value)}
            placeholder="+34 600 000 000"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#0A3D5C]/20 focus:border-[#0A3D5C] outline-none"
          />
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-3 pt-2">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={data.isAuthorizedDeclarant || false}
            onChange={(e) => handleChange('isAuthorizedDeclarant', e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-[#0A3D5C] focus:ring-[#0A3D5C]"
          />
          <span className="text-sm text-gray-700">
            Soy declarante CBAM autorizado (o estoy en proceso de autorización)
          </span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={data.hasIndirectRepresentative || false}
            onChange={(e) => handleChange('hasIndirectRepresentative', e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-[#0A3D5C] focus:ring-[#0A3D5C]"
          />
          <span className="text-sm text-gray-700">
            Tengo representante aduanero indirecto
          </span>
        </label>

        {data.hasIndirectRepresentative && (
          <div className="pl-7">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del representante
            </label>
            <input
              type="text"
              value={data.representativeName || ''}
              onChange={(e) => handleChange('representativeName', e.target.value)}
              placeholder="Nombre del representante aduanero"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#0A3D5C]/20 focus:border-[#0A3D5C] outline-none"
            />
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================
// PASO 2: PRODUCTOS
// ============================================================

function Step2({ products, countries, onChange }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Productos importados</h2>
        <p className="text-sm text-gray-500 mt-1">
          Detalla cada producto que importas y que podría estar afectado por el CBAM.
          Necesitas al menos un producto para continuar.
        </p>
      </div>
      <ProductLineEditor
        products={products}
        countries={countries}
        onChange={onChange}
      />
    </div>
  )
}

// ============================================================
// PASO 3: DOCUMENTACIÓN Y CONFIRMACIÓN
// ============================================================

function Step3({ files, onFilesChange, clientNotes, onNotesChange, confirmed, onConfirmChange }) {
  const [uploading, setUploading] = useState(false)

  function handleFileSelect(e) {
    const selectedFiles = Array.from(e.target.files || [])
    const newFiles = selectedFiles.map(f => ({
      file: f,
      fileType: guessFileType(f.name),
      notes: '',
    }))
    onFilesChange([...files, ...newFiles])
  }

  function handleDrop(e) {
    e.preventDefault()
    const droppedFiles = Array.from(e.dataTransfer.files)
    const newFiles = droppedFiles.map(f => ({
      file: f,
      fileType: guessFileType(f.name),
      notes: '',
    }))
    onFilesChange([...files, ...newFiles])
  }

  function guessFileType(name) {
    const lower = name.toLowerCase()
    if (lower.includes('dua') || lower.includes('despacho')) return 'dua'
    if (lower.includes('factura') || lower.includes('invoice')) return 'invoice'
    return 'other'
  }

  function updateFile(index, field, value) {
    const next = [...files]
    next[index] = { ...next[index], [field]: value }
    onFilesChange(next)
  }

  function removeFile(index) {
    onFilesChange(files.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Documentación y confirmación</h2>
        <p className="text-sm text-gray-500 mt-1">
          Sube los documentos relevantes y confirma tu solicitud. Los documentos son opcionales pero
          nos permiten hacer un análisis más preciso.
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-[#0A3D5C] transition-colors cursor-pointer"
        onClick={() => document.getElementById('file-input').click()}
      >
        <div className="text-3xl mb-2">📄</div>
        <p className="font-medium text-gray-700">Arrastra archivos aquí o haz clic para seleccionar</p>
        <p className="text-xs text-gray-500 mt-1">
          PDF, JPEG, PNG, Excel, CSV. Máximo 10MB por archivo.
        </p>
        <input
          id="file-input"
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.csv"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Lista de archivos */}
      {files.length > 0 && (
        <div className="space-y-3">
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{f.file.name}</p>
                <p className="text-xs text-gray-500">{(f.file.size / 1024).toFixed(0)} KB</p>
              </div>
              <select
                value={f.fileType}
                onChange={(e) => updateFile(i, 'fileType', e.target.value)}
                className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-[#0A3D5C] outline-none"
              >
                <option value="dua">DUA</option>
                <option value="invoice">Factura</option>
                <option value="supplier_data">Datos proveedor</option>
                <option value="certificate">Certificado</option>
                <option value="other">Otro</option>
              </select>
              <button
                onClick={() => removeFile(i)}
                className="text-red-400 hover:text-red-600 text-sm"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Notas */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Comentarios adicionales para el equipo de LexAduana
        </label>
        <textarea
          value={clientNotes || ''}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={3}
          placeholder="Cualquier información relevante sobre tus importaciones, plazos, o preguntas específicas..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#0A3D5C]/20 focus:border-[#0A3D5C] outline-none resize-none"
        />
      </div>

      {/* Confirmación */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => onConfirmChange(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-[#0A3D5C] focus:ring-[#0A3D5C] mt-0.5"
          />
          <span className="text-sm text-blue-800">
            He revisado los datos y deseo solicitar el informe de asesoría CBAM.
            Entiendo que el equipo de LexAduana se pondrá en contacto conmigo para completar el análisis.
          </span>
        </label>
      </div>
    </div>
  )
}

// ============================================================
// WIZARD PRINCIPAL
// ============================================================

export default function AdvisoryIntakeForm({ countries = [] }) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [requestId, setRequestId] = useState(null)

  // State del formulario
  const [companyData, setCompanyData] = useState({
    companyName: '',
    companyCif: '',
    companyEori: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    isAuthorizedDeclarant: false,
    hasIndirectRepresentative: false,
    representativeName: '',
  })

  const [products, setProducts] = useState([])
  const [files, setFiles] = useState([])
  const [clientNotes, setClientNotes] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  // Validaciones
  function validateStep1() {
    if (!companyData.companyName?.trim()) return 'El nombre de la empresa es obligatorio'
    if (!companyData.contactName?.trim()) return 'El nombre de contacto es obligatorio'
    if (!companyData.contactEmail?.trim()) return 'El email de contacto es obligatorio'
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(companyData.contactEmail)) return 'El email no es válido'
    return null
  }

  function validateStep2() {
    if (products.length === 0) return 'Debes añadir al menos un producto'
    for (let i = 0; i < products.length; i++) {
      const p = products[i]
      if (!p.productDescription?.trim()) return `Producto ${i + 1}: la descripción es obligatoria`
      if (!p.countryCode) return `Producto ${i + 1}: selecciona un país de origen`
      if (!p.annualTonnes || p.annualTonnes <= 0) return `Producto ${i + 1}: las toneladas deben ser positivas`
    }
    return null
  }

  // Guardar borrador (crea o actualiza la solicitud)
  const saveDraft = useCallback(async () => {
    setSaving(true)
    setError(null)
    try {
      if (!requestId) {
        // Crear nueva solicitud
        const res = await fetch('/api/cbam/advisory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...companyData,
            clientNotes,
          }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Error al crear solicitud')
        setRequestId(json.data.id)
        return json.data.id
      } else {
        // Actualizar existente
        const res = await fetch(`/api/cbam/advisory/${requestId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...companyData,
            clientNotes,
          }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Error al guardar')
        return requestId
      }
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setSaving(false)
    }
  }, [requestId, companyData, clientNotes])

  // Guardar productos
  async function saveProducts(reqId) {
    const res = await fetch(`/api/cbam/advisory/${reqId}/products`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ products }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Error al guardar productos')
    return json.data
  }

  // Subir archivos
  async function uploadFiles(reqId) {
    for (const f of files) {
      if (f.uploaded) continue
      const formData = new FormData()
      formData.append('file', f.file)
      formData.append('fileType', f.fileType)
      if (f.notes) formData.append('notes', f.notes)

      const res = await fetch(`/api/cbam/advisory/${reqId}/documents`, {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || `Error subiendo ${f.file.name}`)
      }
      f.uploaded = true
    }
  }

  // Navegar entre pasos
  async function handleNext() {
    setError(null)

    if (step === 1) {
      const err = validateStep1()
      if (err) { setError(err); return }

      const id = await saveDraft()
      if (!id) return
      setStep(2)
    } else if (step === 2) {
      const err = validateStep2()
      if (err) { setError(err); return }

      setSaving(true)
      try {
        const id = requestId || await saveDraft()
        if (!id) return
        await saveProducts(id)
        setStep(3)
      } catch (err) {
        setError(err.message)
      } finally {
        setSaving(false)
      }
    }
  }

  function handleBack() {
    setError(null)
    setStep(step - 1)
  }

  // Enviar solicitud
  async function handleSubmit() {
    if (!confirmed) {
      setError('Debes confirmar que has revisado los datos')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      // Guardar datos actualizados
      const id = requestId || await saveDraft()
      if (!id) return

      // Actualizar notas si cambiaron
      await fetch(`/api/cbam/advisory/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientNotes }),
      })

      // Subir archivos pendientes
      if (files.length > 0) {
        await uploadFiles(id)
      }

      // Enviar solicitud
      const res = await fetch(`/api/cbam/advisory/${id}/submit`, {
        method: 'POST',
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al enviar')

      // Redirigir a mis solicitudes
      router.push('/cbam/asesoria/mis-solicitudes')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <ProgressBar currentStep={step} />

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Steps */}
      {step === 1 && <Step1 data={companyData} onChange={setCompanyData} />}
      {step === 2 && <Step2 products={products} countries={countries} onChange={setProducts} />}
      {step === 3 && (
        <Step3
          files={files}
          onFilesChange={setFiles}
          clientNotes={clientNotes}
          onNotesChange={setClientNotes}
          confirmed={confirmed}
          onConfirmChange={setConfirmed}
        />
      )}

      {/* Navegación */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
        <div>
          {step > 1 && (
            <button
              onClick={handleBack}
              disabled={saving || submitting}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Anterior
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {step < 3 && requestId && (
            <button
              onClick={saveDraft}
              disabled={saving}
              className="px-4 py-2.5 text-sm text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar borrador'}
            </button>
          )}

          {step < 3 ? (
            <button
              onClick={handleNext}
              disabled={saving}
              className="px-6 py-2.5 text-sm font-medium text-white bg-[#0A3D5C] rounded-lg hover:bg-[#0d5078] transition-colors disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Siguiente'}
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting || !confirmed}
              className="px-6 py-2.5 text-sm font-medium text-white bg-[#0A3D5C] rounded-lg hover:bg-[#0d5078] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Enviando solicitud...' : 'Enviar solicitud'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
