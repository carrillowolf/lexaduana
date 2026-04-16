'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import ProductLineEditor from './ProductLineEditor'
import { useTranslation } from '@/lib/i18n'
import { cbamDict } from '@/lib/i18n/cbam'
import { isCnSupportedByAdvisory } from '@/lib/cbamData'

function ProgressBar({ currentStep, steps }) {
  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, i) => (
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
          {i < steps.length - 1 && (
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
// STEP 1: COMPANY DATA
// ============================================================

function Step1({ data, onChange, t }) {
  function handleChange(field, value) {
    onChange({ ...data, [field]: value })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">{t('intake.companyTitle')}</h2>
        <p className="text-sm text-gray-500 mt-1">
          {t('intake.companyDesc')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('intake.companyName')} <span className="text-red-500">*</span>
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
            {t('intake.companyCif')} <span className="text-gray-400 text-xs">{t('intake.companyCifHint')}</span>
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
            {t('intake.companyEori')} <span className="text-gray-400 text-xs">{t('intake.companyEoriHint')}</span>
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
            {t('intake.contactName')} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={data.contactName || ''}
            onChange={(e) => handleChange('contactName', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#0A3D5C]/20 focus:border-[#0A3D5C] outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('intake.contactEmail')} <span className="text-red-500">*</span>
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
            {t('intake.contactPhone')} <span className="text-gray-400 text-xs">{t('intake.contactPhoneHint')}</span>
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
            {t('intake.isAuthorized')}
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
            {t('intake.hasRepresentative')}
          </span>
        </label>

        {data.hasIndirectRepresentative && (
          <div className="pl-7">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('intake.representativeName')}
            </label>
            <input
              type="text"
              value={data.representativeName || ''}
              onChange={(e) => handleChange('representativeName', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#0A3D5C]/20 focus:border-[#0A3D5C] outline-none"
            />
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================
// STEP 2: PRODUCTS
// ============================================================

function Step2({ products, countries, onChange, t }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">{t('intake.productsTitle')}</h2>
        <p className="text-sm text-gray-500 mt-1">
          {t('intake.productsDesc')}
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
// STEP 3: DOCUMENTATION & CONFIRMATION
// ============================================================

function Step3({ files, onFilesChange, clientNotes, onNotesChange, confirmed, onConfirmChange, t }) {
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
        <h2 className="text-xl font-bold text-gray-900">{t('intake.docsTitle')}</h2>
        <p className="text-sm text-gray-500 mt-1">
          {t('intake.docsDesc')}
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
        <p className="font-medium text-gray-700">{t('intake.dropzone')}</p>
        <p className="text-xs text-gray-500 mt-1">
          {t('intake.dropzoneFormats')}
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

      {/* File list */}
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
                <option value="dua">{t('intake.fileTypeDua')}</option>
                <option value="invoice">{t('intake.fileTypeInvoice')}</option>
                <option value="supplier_data">{t('intake.fileTypeSupplier')}</option>
                <option value="certificate">{t('intake.fileTypeCert')}</option>
                <option value="other">{t('intake.fileTypeOther')}</option>
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

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('intake.notesLabel')}
        </label>
        <textarea
          value={clientNotes || ''}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={3}
          placeholder={t('intake.notesPlaceholder')}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#0A3D5C]/20 focus:border-[#0A3D5C] outline-none resize-none"
        />
      </div>

      {/* Confirmation */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => onConfirmChange(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-[#0A3D5C] focus:ring-[#0A3D5C] mt-0.5"
          />
          <span className="text-sm text-blue-800">
            {t('intake.confirmText')}
          </span>
        </label>
      </div>
    </div>
  )
}

// ============================================================
// MAIN WIZARD
// ============================================================

export default function AdvisoryIntakeForm({ countries = [] }) {
  const router = useRouter()
  const t = useTranslation(cbamDict)
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [requestId, setRequestId] = useState(null)

  const STEPS = [
    { number: 1, title: t('intake.step1') },
    { number: 2, title: t('intake.step2') },
    { number: 3, title: t('intake.step3') },
  ]

  // Form state
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

  // Validations
  function validateStep1() {
    if (!companyData.companyName?.trim()) return t('intake.valCompanyRequired')
    if (!companyData.contactName?.trim()) return t('intake.valContactRequired')
    if (!companyData.contactEmail?.trim()) return t('intake.valEmailRequired')
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(companyData.contactEmail)) return t('intake.valEmailInvalid')
    return null
  }

  function validateStep2() {
    if (products.length === 0) return t('intake.valProductRequired')
    for (let i = 0; i < products.length; i++) {
      const p = products[i]
      if (!p.productDescription?.trim()) return `${t('productEditor.productN')} ${i + 1}: ${t('intake.valProductDesc')}`
      if (!p.countryCode) return `${t('productEditor.productN')} ${i + 1}: ${t('intake.valProductCountry')}`
      if (!p.annualTonnes || p.annualTonnes <= 0) return `${t('productEditor.productN')} ${i + 1}: ${t('intake.valProductTonnes')}`
      if (p.cnCode && !isCnSupportedByAdvisory(p.cnCode).supported) {
        return `${t('productEditor.productN')} ${i + 1}: El sector de electricidad (CN 2716) no está incluido en esta estimación automática. Contacte con LexAduana para una consultoría especializada.`
      }
    }
    return null
  }

  // Save draft
  const saveDraft = useCallback(async () => {
    setSaving(true)
    setError(null)
    try {
      if (!requestId) {
        const res = await fetch('/api/cbam/advisory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...companyData,
            clientNotes,
          }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Error')
        setRequestId(json.data.id)
        return json.data.id
      } else {
        const res = await fetch(`/api/cbam/advisory/${requestId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...companyData,
            clientNotes,
          }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Error')
        return requestId
      }
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setSaving(false)
    }
  }, [requestId, companyData, clientNotes])

  // Save products
  async function saveProducts(reqId) {
    const res = await fetch(`/api/cbam/advisory/${reqId}/products`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ products }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Error')
    return json.data
  }

  // Upload files
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
        throw new Error(json.error || `Error uploading ${f.file.name}`)
      }
      f.uploaded = true
    }
  }

  // Navigate between steps
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

  // Submit request
  async function handleSubmit() {
    if (!confirmed) {
      setError(t('intake.valConfirmRequired'))
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const id = requestId || await saveDraft()
      if (!id) return

      await fetch(`/api/cbam/advisory/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientNotes }),
      })

      if (files.length > 0) {
        await uploadFiles(id)
      }

      const res = await fetch(`/api/cbam/advisory/${id}/submit`, {
        method: 'POST',
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error')

      router.push('/cbam/asesoria/mis-solicitudes')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#0A3D5C]">{t('intake.pageTitle')}</h1>
        <p className="text-sm text-gray-600 mt-1">
          {t('intake.pageDesc')}
        </p>
      </div>

      <ProgressBar currentStep={step} steps={STEPS} />

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Steps */}
      {step === 1 && <Step1 data={companyData} onChange={setCompanyData} t={t} />}
      {step === 2 && <Step2 products={products} countries={countries} onChange={setProducts} t={t} />}
      {step === 3 && (
        <Step3
          files={files}
          onFilesChange={setFiles}
          clientNotes={clientNotes}
          onNotesChange={setClientNotes}
          confirmed={confirmed}
          onConfirmChange={setConfirmed}
          t={t}
        />
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
        <div>
          {step > 1 && (
            <button
              onClick={handleBack}
              disabled={saving || submitting}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {t('intake.previous')}
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
              {saving ? t('intake.savingDraft') : t('intake.saveDraft')}
            </button>
          )}

          {step < 3 ? (
            <button
              onClick={handleNext}
              disabled={saving}
              className="px-6 py-2.5 text-sm font-medium text-white bg-[#0A3D5C] rounded-lg hover:bg-[#0d5078] transition-colors disabled:opacity-50"
            >
              {saving ? t('intake.savingDraft') : t('intake.next')}
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting || !confirmed}
              className="px-6 py-2.5 text-sm font-medium text-white bg-[#0A3D5C] rounded-lg hover:bg-[#0d5078] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? t('intake.submitting') : t('intake.submit')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
