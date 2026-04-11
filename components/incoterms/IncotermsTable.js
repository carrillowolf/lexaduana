'use client'

import React, { useState } from 'react'
import {
  INCOTERMS_2020,
  STAGE_CONFIG,
  STAGE_KEYS,
  getMultimodal,
  getMaritimo,
} from '@/lib/incotermsData'
import { useTranslation, useLocale } from '@/lib/i18n'
import { incotermsDict, incotermsDataLabels, incotermsContentDict } from '@/lib/i18n/incoterms'

// ── Helper: get translated content for an incoterm ─────────
function useIncotermContent() {
  const { locale } = useLocale()
  return (code, field) => {
    const localeData = incotermsContentDict[locale]?.[code]
    if (localeData?.[field]) return localeData[field]
    // Fallback to Spanish data from the original object
    const item = INCOTERMS_2020.find(i => i.code === code)
    return item?.[field] ?? ''
  }
}

// ── Barra de responsabilidad ────────────────────────────────

function Bar({ who }) {
  return (
    <div
      className={`h-[18px] rounded-[3px] ${
        who === 'S' ? 'bg-blue-600' : 'bg-amber-400'
      }`}
    />
  )
}

// ── Cabecera con iconos y línea de flujo ────────────────────

function StageHeader({ t, stageLabels }) {
  return (
    <div className="pt-4 pb-2 px-3 border-b border-gray-100 min-w-[700px]">
      {/* Fila de iconos */}
      <div
        className="grid items-end gap-[3px]"
        style={{ gridTemplateColumns: '130px 58px repeat(10, 1fr)' }}
      >
        <div />
        <div />
        {STAGE_CONFIG.map((stage) => (
          <div key={stage.key} className="text-center">
            <div className="text-base md:text-lg leading-none mb-1">{stage.icon}</div>
            <p className="text-[7px] md:text-[8px] font-semibold text-gray-500 leading-tight">
              {stageLabels[stage.key + 'Short'] || stage.shortLabel}
            </p>
          </div>
        ))}
      </div>

      {/* Línea de flujo: origen → transporte → destino */}
      <div
        className="grid items-center gap-[3px] mt-2.5 mb-1"
        style={{ gridTemplateColumns: '130px 58px repeat(10, 1fr)' }}
      >
        <div />
        <div />
        <div className="col-span-4 bg-blue-50 border border-blue-200 rounded-full py-[3px] text-center">
          <span className="text-[7px] md:text-[8px] font-bold text-blue-600 uppercase tracking-wider">
            {t('table.originCountry')}
          </span>
        </div>
        <div className="col-span-2 flex items-center justify-center gap-1">
          <div className="h-px flex-1 bg-gray-300" />
          <span className="text-[7px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap px-0.5">
            {t('table.transport')}
          </span>
          <div className="h-px flex-1 bg-gray-300" />
        </div>
        <div className="col-span-4 bg-amber-50 border border-amber-200 rounded-full py-[3px] text-center">
          <span className="text-[7px] md:text-[8px] font-bold text-amber-600 uppercase tracking-wider">
            {t('table.destCountry')}
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Panel de detalle expandido ──────────────────────────────

function DetailPanel({ item, t, getContent }) {
  return (
    <div className="bg-gradient-to-br from-slate-50 to-white p-5 md:p-6 space-y-5 border-t border-gray-200 animate-fadeIn">
      <div className="grid md:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">1</span>
            {t('table.detail.meaning')}
          </h4>
          <p className="text-sm text-gray-700 leading-relaxed">{getContent(item.code, 'description') || item.description}</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-amber-200 shadow-sm">
          <h4 className="text-sm font-bold text-amber-800 mb-2 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold">2</span>
            {t('table.detail.customsImpact')}
          </h4>
          <p className="text-sm text-gray-700 leading-relaxed">{getContent(item.code, 'customsImpact') || item.customsImpact}</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-green-200 shadow-sm">
          <h4 className="text-sm font-bold text-green-800 mb-2 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold">3</span>
            {t('table.detail.example')}
          </h4>
          <p className="text-sm text-gray-700 leading-relaxed">{getContent(item.code, 'practicalExample') || item.practicalExample}</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-purple-200 shadow-sm">
          <h4 className="text-sm font-bold text-purple-800 mb-2 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">4</span>
            {t('table.detail.advice')}
          </h4>
          <p className="text-sm text-gray-700 leading-relaxed">{getContent(item.code, 'advice') || item.advice}</p>
        </div>
      </div>

      {/* Meta-info row */}
      <div className="grid sm:grid-cols-3 gap-4 pt-2">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">{t('table.detail.riskTransfer')}</p>
          <p className="text-sm text-gray-800">{getContent(item.code, 'riskTransferPoint') || item.riskTransferPoint}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">{t('table.detail.costTransfer')}</p>
          <p className="text-sm text-gray-800">{getContent(item.code, 'costTransferPoint') || item.costTransferPoint}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">{t('table.detail.keyDifference')}</p>
          <p className="text-sm text-gray-800">{getContent(item.code, 'keyDifference') || item.keyDifference}</p>
        </div>
      </div>

      {/* Alerta despachante */}
      {item.dispatcherAlert && (
        <div className={`rounded-lg p-3.5 text-sm flex items-start gap-2.5 ${
          item.dispatcherAlert.type === 'critical'
            ? 'bg-red-50 border border-red-200 text-red-800'
            : item.dispatcherAlert.type === 'warning'
            ? 'bg-amber-50 border border-amber-200 text-amber-800'
            : item.dispatcherAlert.type === 'success'
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
            : 'bg-blue-50 border border-blue-200 text-blue-800'
        }`}>
          <span className="flex-shrink-0 text-base mt-0.5">
            {item.dispatcherAlert.type === 'critical' ? '🚨' : item.dispatcherAlert.type === 'warning' ? '⚠️' : item.dispatcherAlert.type === 'success' ? '✅' : 'ℹ️'}
          </span>
          <div>
            <p className="font-semibold text-xs uppercase tracking-wider mb-0.5">{t('table.detail.dispatcherAlert')}</p>
            <p className="leading-relaxed">{getContent(item.code, 'dispatcherAlertText') || item.dispatcherAlert.text}</p>
          </div>
        </div>
      )}

      {/* Documentos */}
      <div>
        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">{t('table.detail.typicalDocs')}</p>
        <div className="flex flex-wrap gap-2">
          {item.typicalDocuments.map((doc) => (
            <span key={doc} className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
              {doc}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Filas de Incoterm (desktop) ─────────────────────────────

function IncotermRows({ item, isExpanded, onToggle, t }) {
  const rows = [
    { label: t('table.cost'), data: item.responsibilities.cost },
    { label: t('table.risk'), data: item.responsibilities.risk },
  ]
  if (item.hasInsuranceRow) {
    rows.push({ label: t('table.insurance'), data: item.insuranceRow })
  }

  return (
    <div
      className={`cursor-pointer transition-colors min-w-[700px] ${
        isExpanded ? 'bg-blue-50/40' : 'hover:bg-gray-50/60'
      }`}
      onClick={() => onToggle(item.code)}
    >
      {rows.map((row, idx) => (
        <div
          key={row.label}
          className={`grid items-center gap-[3px] px-3 ${
            idx === 0 ? 'pt-2.5' : ''
          } ${idx === rows.length - 1 ? 'pb-2.5' : 'pb-0.5'}`}
          style={{ gridTemplateColumns: '130px 58px repeat(10, 1fr)' }}
        >
          {idx === 0 ? (
            <div className="flex items-center gap-1.5 min-w-0">
              <svg
                className={`w-3.5 h-3.5 text-gray-400 transition-transform flex-shrink-0 ${
                  isExpanded ? 'rotate-90' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
              <div className="min-w-0">
                <span className="text-sm font-bold text-[#0A3D5C]">{item.code}</span>
                <span className="text-[11px] text-gray-500 ml-1.5 hidden lg:inline">{item.name}</span>
                <p className="text-[10px] text-gray-400 truncate hidden lg:block">{item.nameEs}</p>
              </div>
            </div>
          ) : (
            <div />
          )}

          <span className="text-[9px] font-bold text-gray-400 tracking-wider">{row.label}</span>

          {row.data.map((who, i) => (
            <Bar key={i} who={who} />
          ))}
        </div>
      ))}
    </div>
  )
}

// ── Card para móvil ─────────────────────────────────────────

function IncotermCard({ item, isExpanded, onToggle, t, getContent }) {
  const barRows = [
    { label: t('table.cost'), data: item.responsibilities.cost },
    { label: t('table.risk'), data: item.responsibilities.risk },
  ]
  if (item.hasInsuranceRow) {
    barRows.push({ label: t('table.insurance'), data: item.insuranceRow })
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-[#0A3D5C]">{item.code}</span>
          <div>
            <p className="text-sm font-medium text-gray-900">{item.name}</p>
            <p className="text-xs text-gray-500">{item.nameEs}</p>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      <div className="px-4 pb-3 space-y-1.5">
        {barRows.map((row) => (
          <div key={row.label} className="flex items-center gap-2">
            <span className="text-[9px] font-bold text-gray-400 w-12 tracking-wider">{row.label}</span>
            <div className="flex gap-[2px] flex-1">
              {row.data.map((who, i) => (
                <div
                  key={i}
                  className={`h-3.5 flex-1 rounded-[2px] ${
                    who === 'S' ? 'bg-blue-600' : 'bg-amber-400'
                  }`}
                />
              ))}
            </div>
          </div>
        ))}
        <div className="flex items-center gap-3 pt-1 text-[8px] text-gray-400">
          <div className="flex items-center gap-1">
            <div className="w-3 h-2 rounded-[1px] bg-blue-600" />
            <span>{t('table.seller')}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-2 rounded-[1px] bg-amber-400" />
            <span>{t('table.buyer')}</span>
          </div>
        </div>
      </div>

      {isExpanded && <DetailPanel item={item} t={t} getContent={getContent} />}
    </div>
  )
}

// ── Componente principal ────────────────────────────────────

export default function IncotermsTable() {
  const [expandedCode, setExpandedCode] = useState(null)
  const t = useTranslation(incotermsDict)
  const { locale } = useLocale()
  const stageLabels = incotermsDataLabels[locale] || incotermsDataLabels.es
  const getContent = useIncotermContent()

  function handleToggle(code) {
    setExpandedCode((prev) => (prev === code ? null : code))
  }

  const multimodal = getMultimodal()
  const maritimo = getMaritimo()

  return (
    <section id="tabla-incoterms">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
          {t('table.title')}
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto text-sm">
          {t('table.subtitle')}
        </p>
      </div>

      {/* Leyenda */}
      <div className="flex items-center justify-center gap-6 mb-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="inline-block w-8 h-4 rounded bg-blue-600" />
          <span className="text-gray-600 font-medium">{t('table.legendSeller')}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-8 h-4 rounded bg-amber-400" />
          <span className="text-gray-600 font-medium">{t('table.legendBuyer')}</span>
        </div>
      </div>

      {/* Aviso interactivo */}
      <div className="flex items-center justify-center gap-2 mb-6 text-xs text-gray-400">
        <svg className="w-4 h-4 text-gray-300 animate-pulse" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672ZM12 2.25V4.5m5.834.166-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243-1.59-1.59" />
        </svg>
        <span>{t('table.clickHint')}</span>
      </div>

      <div className="space-y-10">
        {/* Grupo 1: Cualquier modo de transporte */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🚛</span>
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
              {t('table.groupMultimodal')}
            </h3>
          </div>

          <div className="hidden md:block rounded-xl border border-gray-200 shadow-sm overflow-x-auto bg-white">
            <StageHeader t={t} stageLabels={stageLabels} />
            <div className="divide-y divide-gray-100">
              {multimodal.map((item) => (
                <React.Fragment key={item.code}>
                  <IncotermRows item={item} isExpanded={expandedCode === item.code} onToggle={handleToggle} t={t} />
                  {expandedCode === item.code && <DetailPanel item={item} t={t} getContent={getContent} />}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="md:hidden space-y-3">
            {multimodal.map((item) => (
              <IncotermCard key={item.code} item={item} isExpanded={expandedCode === item.code} onToggle={() => handleToggle(item.code)} t={t} getContent={getContent} />
            ))}
          </div>
        </div>

        {/* Grupo 2: Solo marítimo */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🚢</span>
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
              {t('table.groupMaritime')}
            </h3>
          </div>

          <div className="hidden md:block rounded-xl border border-gray-200 shadow-sm overflow-x-auto bg-white">
            <StageHeader t={t} stageLabels={stageLabels} />
            <div className="divide-y divide-gray-100">
              {maritimo.map((item) => (
                <React.Fragment key={item.code}>
                  <IncotermRows item={item} isExpanded={expandedCode === item.code} onToggle={handleToggle} t={t} />
                  {expandedCode === item.code && <DetailPanel item={item} t={t} getContent={getContent} />}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="md:hidden space-y-3">
            {maritimo.map((item) => (
              <IncotermCard key={item.code} item={item} isExpanded={expandedCode === item.code} onToggle={() => handleToggle(item.code)} t={t} getContent={getContent} />
            ))}
          </div>
        </div>
      </div>

      {/* Notas */}
      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4 text-xs text-amber-800">
        <p className="font-semibold mb-1">{t('table.notes.title')}</p>
        <ul className="list-disc list-inside space-y-1 text-amber-700">
          <li><strong>FCA:</strong> {t('table.notes.fca')}</li>
          <li><strong>CIP:</strong> {t('table.notes.cip')}</li>
          <li><strong>CPT / CIP / CFR / CIF:</strong> {t('table.notes.cTerms')}</li>
          <li><strong>DAP / DPU:</strong> {t('table.notes.dapDpu')}</li>
        </ul>
      </div>
    </section>
  )
}
