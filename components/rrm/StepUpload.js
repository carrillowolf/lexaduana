'use client'

import { useState, useRef } from 'react'
import { useTranslation } from '@/lib/i18n'
import { rrmDict } from '@/lib/i18n/rrm'
import { SPANISH_CUSTOMS_OFFICES, MRN_REGEX, isCloseTo3YearLimit } from '@/lib/rrmData'

const inputCls =
  'w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:border-[#0A3D5C] focus:ring-1 focus:ring-[#0A3D5C]'
const labelCls = 'block text-sm font-medium text-slate-700 mb-1'

function Field({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <input
        type={type}
        value={value || ''}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={inputCls}
      />
    </div>
  )
}

export default function StepUpload({ state, setState }) {
  const t = useTranslation(rrmDict)
  const fileInput = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const showWarning = isCloseTo3YearLimit(state.acceptanceDate)
  const mrnInvalid = state.mrn && !MRN_REGEX.test(state.mrn)

  const onFile = async (file) => {
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const xml = await file.text()
      const res = await fetch('/api/rrm/parse-h1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/xml' },
        body: xml,
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error || t('upload.parseError'))
        return
      }
      const d = json.data
      const item0 = (d.goodsItems && d.goodsItems[0]) || {}
      // Construir liquidación inicial a partir del primer ítem
      const dutiesDeclared = {}
      ;(item0.duties || []).forEach((dt) => {
        if (dt.type) dutiesDeclared[dt.type] = (dutiesDeclared[dt.type] || 0) + (Number(dt.amount) || 0)
      })
      setState({
        ...state,
        mrn: d.mrn || '',
        acceptanceDate: d.acceptanceDate || '',
        customsOffice: d.customsOffice || state.customsOffice,
        requestedProcedure: d.requestedProcedure || '',
        deliveryTerms: d.deliveryTerms || '',
        customsValue: d.customsValue ?? state.customsValue,
        importer: d.importer || state.importer,
        representative: d.representative || state.representative,
        commodityCode: item0.commodityCode || '',
        goodsDescription: item0.description || '',
        netMass: item0.netMass || '',
        supplementaryUnits: item0.supplementaryUnits || '',
        countryOfOrigin: item0.countryOfOrigin || '',
        preferenceDeclared: item0.preference || '',
        dutiesDeclared,
        dutiesCorrected: { ...dutiesDeclared },
      })
    } catch (e) {
      setError(t('upload.parseError'))
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-slate-900 mb-2">{t('upload.title')}</h2>
      <p className="text-slate-600 leading-relaxed mb-6">{t('upload.subtitle')}</p>

      {/* Dropzone */}
      <div
        onClick={() => fileInput.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          if (e.dataTransfer.files?.[0]) onFile(e.dataTransfer.files[0])
        }}
        className="border-dashed border-2 border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-[#0A3D5C] transition-all rounded-xl p-8 text-center cursor-pointer mb-3"
      >
        <svg className="w-10 h-10 mx-auto mb-2 text-[#0A3D5C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <div className="text-slate-700 font-medium">{uploading ? t('upload.uploadingMsg') : t('upload.dropzone')}</div>
        <div className="text-sm text-slate-400 mt-1">{t('upload.formatHint')}</div>
        <input
          ref={fileInput}
          type="file"
          accept=".xml,application/xml,text/xml"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
      </div>
      {error && <div className="text-sm text-red-700 mb-4">{error}</div>}

      {showWarning && (
        <div className="mb-4 p-3 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 text-sm">
          ⚠️ {t('upload.warningPlazo')}
        </div>
      )}

      {/* Campos manuales / editables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Declaración */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
          <h3 className="text-slate-900 font-semibold mb-3">{t('upload.sectionDeclaration')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label={t('upload.mrn')} value={state.mrn} onChange={(v) => setState({ ...state, mrn: v })} placeholder="26ES001741I004TCR8" />
            <Field label={t('upload.acceptanceDate')} type="date" value={state.acceptanceDate} onChange={(v) => setState({ ...state, acceptanceDate: v })} />
            <div>
              <label className={labelCls}>{t('upload.customsOffice')}</label>
              <select
                className={inputCls}
                value={state.customsOffice || ''}
                onChange={(e) => setState({ ...state, customsOffice: e.target.value })}
              >
                <option value="">—</option>
                {SPANISH_CUSTOMS_OFFICES.map((o) => (
                  <option key={o.code} value={o.code}>
                    {o.code} — {o.name}
                  </option>
                ))}
              </select>
            </div>
            <Field label={t('upload.regime')} value={state.requestedProcedure} onChange={(v) => setState({ ...state, requestedProcedure: v })} placeholder="4000" />
          </div>
          {mrnInvalid && <p className="text-xs text-orange-700 mt-2">MRN: 18 caracteres formato AAESAAAAAAAAAAAATD</p>}
        </div>

        {/* Importador */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
          <h3 className="text-slate-900 font-semibold mb-3">{t('upload.sectionImporter')}</h3>
          <div className="grid grid-cols-1 gap-3">
            <Field label={t('upload.eori')} value={state.importer?.eori} onChange={(v) => setState({ ...state, importer: { ...state.importer, eori: v } })} />
            <Field label={t('upload.name')} value={state.importer?.name} onChange={(v) => setState({ ...state, importer: { ...state.importer, name: v } })} />
            <Field label={t('upload.address')} value={typeof state.importer?.address === 'string' ? state.importer.address : [state.importer?.address?.line, state.importer?.address?.postcode, state.importer?.address?.city, state.importer?.address?.country].filter(Boolean).join(', ')} onChange={(v) => setState({ ...state, importer: { ...state.importer, address: v } })} />
          </div>
        </div>

        {/* Representante */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
          <h3 className="text-slate-900 font-semibold mb-3">{t('upload.sectionRepresentative')}</h3>
          <div className="grid grid-cols-1 gap-3">
            <Field label={t('upload.eori')} value={state.representative?.eori} onChange={(v) => setState({ ...state, representative: { ...state.representative, eori: v } })} />
            <Field label={t('upload.name')} value={state.representative?.name} onChange={(v) => setState({ ...state, representative: { ...state.representative, name: v } })} />
            <Field label={t('upload.address')} value={typeof state.representative?.address === 'string' ? state.representative.address : [state.representative?.address?.line, state.representative?.address?.postcode, state.representative?.address?.city, state.representative?.address?.country].filter(Boolean).join(', ')} onChange={(v) => setState({ ...state, representative: { ...state.representative, address: v } })} />
          </div>
        </div>

        {/* Mercancía */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
          <h3 className="text-slate-900 font-semibold mb-3">{t('upload.sectionGoods')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label={t('upload.commodityCode')} value={state.commodityCode} onChange={(v) => setState({ ...state, commodityCode: v })} />
            <Field label={t('upload.countryOfOrigin')} value={state.countryOfOrigin} onChange={(v) => setState({ ...state, countryOfOrigin: v })} />
            <Field label={t('upload.netMass')} value={state.netMass} onChange={(v) => setState({ ...state, netMass: v })} />
            <Field label={t('upload.suppUnits')} value={state.supplementaryUnits} onChange={(v) => setState({ ...state, supplementaryUnits: v })} />
            <Field label={t('upload.customsValue')} type="number" value={state.customsValue} onChange={(v) => setState({ ...state, customsValue: v })} />
            <Field label={t('upload.preference')} value={state.preferenceDeclared} onChange={(v) => setState({ ...state, preferenceDeclared: v })} />
          </div>
          <div className="mt-3">
            <label className={labelCls}>{t('upload.goodsDescription')}</label>
            <textarea
              rows={2}
              className={inputCls}
              value={state.goodsDescription || ''}
              onChange={(e) => setState({ ...state, goodsDescription: e.target.value })}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
