'use client'

import { useState, useRef } from 'react'
import { useTranslation } from '@/lib/i18n'
import { rrmDict } from '@/lib/i18n/rrm'
import { SPANISH_CUSTOMS_OFFICES, MRN_REGEX, isCloseTo3YearLimit } from '@/lib/rrmData'

const inputCls =
  'w-full bg-[#0d1f35] border border-[#1a2d4a] rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-[#F4C542]'
const labelCls = 'block text-xs text-gray-400 mb-1'

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
      <h2 className="text-2xl font-bold text-white mb-2">{t('upload.title')}</h2>
      <p className="text-gray-400 mb-6">{t('upload.subtitle')}</p>

      {/* Dropzone */}
      <div
        onClick={() => fileInput.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          if (e.dataTransfer.files?.[0]) onFile(e.dataTransfer.files[0])
        }}
        className="border-dashed border-2 border-[#1a2d4a] hover:border-[#F4C542] hover:shadow-[0_0_25px_rgba(244,197,66,0.15)] transition-all rounded-lg p-8 text-center cursor-pointer mb-3"
      >
        <div className="text-3xl mb-2">📤</div>
        <div className="text-white">{uploading ? t('upload.uploadingMsg') : t('upload.dropzone')}</div>
        <div className="text-xs text-gray-500 mt-1">{t('upload.formatHint')}</div>
        <input
          ref={fileInput}
          type="file"
          accept=".xml,application/xml,text/xml"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
      </div>
      {error && <div className="text-sm text-red-400 mb-4">{error}</div>}

      {showWarning && (
        <div className="mb-4 p-3 rounded border border-orange-500/50 bg-orange-950/30 text-orange-200 text-sm">
          ⚠️ {t('upload.warningPlazo')}
        </div>
      )}

      {/* Campos manuales / editables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Declaración */}
        <div className="bg-[#0a1628] border border-[#1a2d4a] rounded-lg p-4">
          <h3 className="text-white font-semibold mb-3">{t('upload.sectionDeclaration')}</h3>
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
          {mrnInvalid && <p className="text-xs text-orange-400 mt-2">MRN: 18 caracteres formato AAESAAAAAAAAAAAATD</p>}
        </div>

        {/* Importador */}
        <div className="bg-[#0a1628] border border-[#1a2d4a] rounded-lg p-4">
          <h3 className="text-white font-semibold mb-3">{t('upload.sectionImporter')}</h3>
          <div className="grid grid-cols-1 gap-3">
            <Field label={t('upload.eori')} value={state.importer?.eori} onChange={(v) => setState({ ...state, importer: { ...state.importer, eori: v } })} />
            <Field label={t('upload.name')} value={state.importer?.name} onChange={(v) => setState({ ...state, importer: { ...state.importer, name: v } })} />
            <Field label={t('upload.address')} value={typeof state.importer?.address === 'string' ? state.importer.address : [state.importer?.address?.line, state.importer?.address?.postcode, state.importer?.address?.city, state.importer?.address?.country].filter(Boolean).join(', ')} onChange={(v) => setState({ ...state, importer: { ...state.importer, address: v } })} />
          </div>
        </div>

        {/* Representante */}
        <div className="bg-[#0a1628] border border-[#1a2d4a] rounded-lg p-4">
          <h3 className="text-white font-semibold mb-3">{t('upload.sectionRepresentative')}</h3>
          <div className="grid grid-cols-1 gap-3">
            <Field label={t('upload.eori')} value={state.representative?.eori} onChange={(v) => setState({ ...state, representative: { ...state.representative, eori: v } })} />
            <Field label={t('upload.name')} value={state.representative?.name} onChange={(v) => setState({ ...state, representative: { ...state.representative, name: v } })} />
            <Field label={t('upload.address')} value={typeof state.representative?.address === 'string' ? state.representative.address : [state.representative?.address?.line, state.representative?.address?.postcode, state.representative?.address?.city, state.representative?.address?.country].filter(Boolean).join(', ')} onChange={(v) => setState({ ...state, representative: { ...state.representative, address: v } })} />
          </div>
        </div>

        {/* Mercancía */}
        <div className="bg-[#0a1628] border border-[#1a2d4a] rounded-lg p-4">
          <h3 className="text-white font-semibold mb-3">{t('upload.sectionGoods')}</h3>
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
