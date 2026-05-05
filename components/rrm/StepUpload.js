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

function fmtMoney(n) {
  if (n == null || Number.isNaN(Number(n))) return '—'
  return Number(n).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

export default function StepUpload({ state, setState }) {
  const t = useTranslation(rrmDict)
  const fileInput = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('paste')
  const [pastedText, setPastedText] = useState('')
  const [parseResult, setParseResult] = useState(null)

  const showWarning = isCloseTo3YearLimit(state.acceptanceDate)
  const mrnInvalid = state.mrn && !MRN_REGEX.test(state.mrn)

  const processPastedXml = async () => {
    const cleaned = pastedText.replace(/^-/gm, '').trim()
    const looksLikeH1 = cleaned.includes('<CC415A') || cleaned.includes('<GoodsShipment')
    if (!cleaned || !looksLikeH1) {
      setError(t('upload.pasteInvalid'))
      return
    }
    const file = new File([cleaned], 'pasted-xml.xml', { type: 'application/xml' })
    await onFile(file)
  }

  // Aplica los datos del header de la declaración al state (siempre, sea cual sea el número de partidas).
  const applyHeaderToState = (d) => {
    setState((prev) => ({
      ...prev,
      mrn: d.mrn || '',
      acceptanceDate: d.acceptanceDate || '',
      customsOffice: d.customsOffice || prev.customsOffice,
      requestedProcedure: d.requestedProcedure || '',
      deliveryTerms: d.deliveryTerms || '',
      customsValue: d.customsValue ?? prev.customsValue,
      importer: d.importer || prev.importer,
      representative: d.representative || prev.representative,
    }))
  }

  // Aplica los datos de UNA partida (la indicada por idx) al state. Útil cuando hay 1 sola partida
  // o cuando el usuario selecciona en la tabla multi-partida (commit 3).
  const applyItemToState = (d, idx) => {
    const item0 = (d.goodsItems && d.goodsItems[idx]) || {}
    const dutiesDeclared = {}
    ;(item0.duties || []).forEach((dt) => {
      if (dt.type) dutiesDeclared[dt.type] = (dutiesDeclared[dt.type] || 0) + (Number(dt.amount) || 0)
    })
    setState((prev) => ({
      ...prev,
      commodityCode: item0.commodityCode || '',
      goodsDescription: item0.description || '',
      netMass: item0.netMass || '',
      supplementaryUnits: item0.supplementaryUnits || '',
      countryOfOrigin: item0.countryOfOrigin || '',
      preferenceDeclared: item0.preference || '',
      dutiesDeclared,
      dutiesCorrected: { ...dutiesDeclared },
    }))
  }

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
      if (!res.ok || !(json.ok || json.success)) {
        setError(json.error || t('upload.parseError'))
        setParseResult(null)
        return
      }
      const d = json.data
      setParseResult(d)
      applyHeaderToState(d)
      // Si hay exactamente 1 partida, autoseleccionar y rellenar campos del item.
      // Si hay 2+ partidas, esperar selección del usuario en la tabla (commit 3).
      const itemCount = (d.items || d.goodsItems || []).length
      if (itemCount === 1) {
        applyItemToState(d, 0)
      }
    } catch (e) {
      setError(t('upload.parseError'))
      setParseResult(null)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-slate-900 mb-2">{t('upload.title')}</h2>
      <p className="text-slate-600 leading-relaxed mb-6">{t('upload.subtitle')}</p>

      {/* Tabs */}
      <div className="border-b border-slate-200 mb-6 flex gap-1">
        <button
          type="button"
          onClick={() => { setTab('paste'); setError('') }}
          className={
            tab === 'paste'
              ? 'bg-white border-b-2 border-[#0A3D5C] text-slate-900 font-semibold px-4 py-2.5 -mb-px'
              : 'text-slate-500 hover:text-slate-700 px-4 py-2.5'
          }
        >
          {t('upload.tabPaste')}
        </button>
        <button
          type="button"
          onClick={() => { setTab('file'); setError('') }}
          className={
            tab === 'file'
              ? 'bg-white border-b-2 border-[#0A3D5C] text-slate-900 font-semibold px-4 py-2.5 -mb-px'
              : 'text-slate-500 hover:text-slate-700 px-4 py-2.5'
          }
        >
          {t('upload.tabFile')}
        </button>
      </div>

      {/* Tab content */}
      {tab === 'paste' ? (
        <div className="mb-3">
          <textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder={t('upload.pastePlaceholder')}
            disabled={uploading}
            className="w-full min-h-[300px] max-h-[500px] overflow-y-auto bg-white border border-slate-300 rounded-xl p-4 font-mono text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0A3D5C] focus:ring-1 focus:ring-[#0A3D5C] disabled:bg-slate-50"
          />
          <div className="flex items-center justify-between mt-3 gap-4 flex-wrap">
            <p className="text-sm text-slate-500">{t('upload.pasteHelp')}</p>
            <button
              type="button"
              onClick={processPastedXml}
              disabled={!pastedText.trim() || uploading}
              className="bg-[#F4C542] hover:bg-[#e0b332] text-slate-900 font-semibold px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              {uploading && (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {uploading ? t('upload.uploadingMsg') : t('upload.pasteSubmit')}
            </button>
          </div>
        </div>
      ) : (
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
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Resumen del header (tras parsear con éxito) */}
      {parseResult && parseResult.header && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-4">
          <h3 className="text-slate-900 font-semibold mb-3">{t('upload.summaryTitle')}</h3>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">{t('upload.summaryMRN')}</dt>
              <dd className="text-slate-900 font-mono text-right truncate">{parseResult.mrn || '—'}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">{t('upload.summaryDate')}</dt>
              <dd className="text-slate-900 text-right">{parseResult.header.preparationDateFormatted || '—'}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">{t('upload.summaryCustoms')}</dt>
              <dd className="text-slate-900 text-right">{parseResult.header.customsOfficeOfImport || '—'}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">{t('upload.summaryImporter')}</dt>
              <dd className="text-slate-900 text-right truncate">
                {parseResult.header.importer?.eori || '—'}
                {parseResult.header.importer?.name ? ` · ${parseResult.header.importer.name}` : ''}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">{t('upload.summaryExporter')}</dt>
              <dd className="text-slate-900 text-right truncate">{parseResult.header.exporter?.name || '—'}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">{t('upload.summaryItems')}</dt>
              <dd className="text-slate-900 font-semibold text-right">{parseResult.summary?.totalItems ?? 0}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">{t('upload.summaryDuty')}</dt>
              <dd className="text-slate-900 font-mono text-right">{fmtMoney(parseResult.summary?.totalDuty)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">{t('upload.summaryVAT')}</dt>
              <dd className="text-slate-900 font-mono text-right">{fmtMoney(parseResult.summary?.totalVAT)}</dd>
            </div>
          </dl>

          {/* Mensaje contextual según número de partidas */}
          {parseResult.summary?.totalItems === 1 && (
            <div className="mt-4 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
              ✓ {t('upload.autoFilledSingle')}
            </div>
          )}
          {parseResult.summary?.totalItems >= 2 && (
            <div className="mt-4 px-3 py-2 rounded-lg bg-[#0A3D5C]/5 border border-[#0A3D5C]/20 text-[#0A3D5C] text-sm font-medium">
              {t('upload.multiItemsDetected').replace('{n}', parseResult.summary.totalItems)}
            </div>
          )}
        </div>
      )}

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
