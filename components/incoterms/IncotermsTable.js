'use client'

import React, { useState } from 'react'
import {
  INCOTERMS_2020,
  RESPONSIBILITY_LABELS,
  RESPONSIBILITY_KEYS,
  getMultimodal,
  getMaritimo,
} from '@/lib/incotermsData'

// ── Celda de responsabilidad ─────────────────────────────────

function ResponsibilityCell({ value }) {
  const config = {
    seller: { bg: 'bg-emerald-100 text-emerald-800', label: 'V' },
    buyer: { bg: 'bg-blue-100 text-blue-800', label: 'C' },
    shared: { bg: 'bg-amber-100 text-amber-800', label: 'V/C' },
  }
  const c = config[value] || config.buyer
  return (
    <td className={`px-2 py-2.5 text-center text-xs font-bold ${c.bg} border border-white/60`}>
      {c.label}
    </td>
  )
}

// ── Panel de detalle expandido ───────────────────────────────

function DetailPanel({ item }) {
  return (
    <div className="bg-gradient-to-br from-slate-50 to-white p-5 md:p-6 space-y-5 border-t border-gray-200 animate-fadeIn">
      <div className="grid md:grid-cols-2 gap-5">
        {/* Qué significa */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">1</span>
            Qué significa
          </h4>
          <p className="text-sm text-gray-700 leading-relaxed">{item.description}</p>
        </div>

        {/* Impacto en valor en aduana */}
        <div className="bg-white rounded-xl p-4 border border-amber-200 shadow-sm">
          <h4 className="text-sm font-bold text-amber-800 mb-2 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold">2</span>
            Impacto en el valor en aduana
          </h4>
          <p className="text-sm text-gray-700 leading-relaxed">{item.customsImpact}</p>
        </div>

        {/* Ejemplo práctico */}
        <div className="bg-white rounded-xl p-4 border border-green-200 shadow-sm">
          <h4 className="text-sm font-bold text-green-800 mb-2 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold">3</span>
            Ejemplo práctico
          </h4>
          <p className="text-sm text-gray-700 leading-relaxed">{item.practicalExample}</p>
        </div>

        {/* Consejo */}
        <div className="bg-white rounded-xl p-4 border border-purple-200 shadow-sm">
          <h4 className="text-sm font-bold text-purple-800 mb-2 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">4</span>
            Consejo profesional
          </h4>
          <p className="text-sm text-gray-700 leading-relaxed">{item.advice}</p>
        </div>
      </div>

      {/* Meta-info row */}
      <div className="grid sm:grid-cols-3 gap-4 pt-2">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Transferencia de riesgo</p>
          <p className="text-sm text-gray-800">{item.riskTransferPoint}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Transferencia de costes</p>
          <p className="text-sm text-gray-800">{item.costTransferPoint}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Diferencia clave</p>
          <p className="text-sm text-gray-800">{item.keyDifference}</p>
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
            <p className="font-semibold text-xs uppercase tracking-wider mb-0.5">Alerta para el despachante</p>
            <p className="leading-relaxed">{item.dispatcherAlert.text}</p>
          </div>
        </div>
      )}

      {/* Documentos */}
      <div>
        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Documentos típicos</p>
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

// ── Card para móvil ──────────────────────────────────────────

function IncotermCard({ item, isExpanded, onToggle }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-4 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
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

      {/* Responsabilidades en mini-grid */}
      <div className="px-4 pb-3 grid grid-cols-7 gap-1">
        {RESPONSIBILITY_KEYS.map((key) => {
          const val = item.responsibilities[key]
          const config = {
            seller: 'bg-emerald-100 text-emerald-800',
            buyer: 'bg-blue-100 text-blue-800',
            shared: 'bg-amber-100 text-amber-800',
          }
          const label = { seller: 'V', buyer: 'C', shared: 'V/C' }
          return (
            <div key={key} className="text-center">
              <p className="text-[9px] text-gray-400 mb-0.5 truncate">{RESPONSIBILITY_LABELS[key].replace('Desp. ', '')}</p>
              <div className={`rounded text-[10px] font-bold py-0.5 ${config[val]}`}>
                {label[val]}
              </div>
            </div>
          )
        })}
      </div>

      {isExpanded && <DetailPanel item={item} />}
    </div>
  )
}

// ── Sub-tabla por grupo ──────────────────────────────────────

function GroupTable({ title, icon, items, expandedCode, onToggle }) {
  return (
    <div className="overflow-hidden">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{icon}</span>
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">{title}</h3>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 w-[180px]">Incoterm</th>
              {RESPONSIBILITY_KEYS.map((key) => (
                <th key={key} className="px-2 py-3 text-center text-[11px] font-semibold text-gray-600 whitespace-nowrap">
                  {RESPONSIBILITY_LABELS[key]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const isExpanded = expandedCode === item.code
              return (
                <React.Fragment key={item.code}>
                  <tr
                    onClick={() => onToggle(item.code)}
                    className={`cursor-pointer transition-colors ${
                      isExpanded
                        ? 'bg-blue-50/50'
                        : 'hover:bg-gray-50'
                    } border-b border-gray-100`}
                  >
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <svg
                          className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
                          fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                        </svg>
                        <div>
                          <span className="text-base font-bold text-[#0A3D5C]">{item.code}</span>
                          <span className="text-sm text-gray-600 ml-2">{item.name}</span>
                          <p className="text-xs text-gray-400">{item.nameEs}</p>
                        </div>
                      </div>
                    </td>
                    {RESPONSIBILITY_KEYS.map((key) => (
                      <ResponsibilityCell key={key} value={item.responsibilities[key]} />
                    ))}
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan={1 + RESPONSIBILITY_KEYS.length} className="p-0">
                        <DetailPanel item={item} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {items.map((item) => (
          <IncotermCard
            key={item.code}
            item={item}
            isExpanded={expandedCode === item.code}
            onToggle={() => onToggle(item.code)}
          />
        ))}
      </div>
    </div>
  )
}

// ── Componente principal ─────────────────────────────────────

export default function IncotermsTable() {
  const [expandedCode, setExpandedCode] = useState(null)

  function handleToggle(code) {
    setExpandedCode((prev) => (prev === code ? null : code))
  }

  return (
    <section id="tabla-incoterms">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
          Tabla de Incoterms 2020
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto text-sm">
          Los 11 Incoterms organizados por modo de transporte. Haz clic en cualquier fila para ver el detalle completo, incluyendo su impacto en el valor en aduana.
        </p>
      </div>

      {/* Leyenda */}
      <div className="flex items-center justify-center gap-6 mb-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="inline-block w-7 h-5 rounded bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center leading-5 text-center">V</span>
          <span className="text-gray-600">= Vendedor</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-7 h-5 rounded bg-blue-100 text-blue-800 text-xs font-bold flex items-center justify-center leading-5 text-center">C</span>
          <span className="text-gray-600">= Comprador</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-7 h-5 rounded bg-amber-100 text-amber-800 text-xs font-bold flex items-center justify-center leading-5 text-center">V/C</span>
          <span className="text-gray-600">= Según acuerdo</span>
        </div>
      </div>

      <div className="space-y-10">
        <GroupTable
          title="Cualquier modo de transporte"
          icon="🚛"
          items={getMultimodal()}
          expandedCode={expandedCode}
          onToggle={handleToggle}
        />
        <GroupTable
          title="Solo transporte marítimo y vías navegables"
          icon="🚢"
          items={getMaritimo()}
          expandedCode={expandedCode}
          onToggle={handleToggle}
        />
      </div>

      {/* Nota FCA */}
      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4 text-xs text-amber-800">
        <p className="font-semibold mb-1">Notas sobre la tabla:</p>
        <ul className="list-disc list-inside space-y-1 text-amber-700">
          <li><strong>FCA:</strong> La carga y el transporte interior dependen del lugar de entrega acordado. Si es en las instalaciones del vendedor, este carga. Si es en otro lugar, el comprador descarga del vehículo del vendedor.</li>
          <li><strong>CIP:</strong> Desde Incoterms 2020, el vendedor debe contratar seguro con cobertura máxima (ICC-A). CIF mantiene solo cobertura mínima (ICC-C).</li>
        </ul>
      </div>
    </section>
  )
}
