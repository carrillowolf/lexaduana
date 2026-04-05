'use client'

import { useState, useCallback } from 'react'
import { INCOTERMS_2020 } from '@/lib/incotermsData'

// ── Árboles de decisión (basados en diagramas ICC) ───────────

const SELLER_TREE = [
  {
    id: 'S1',
    question: '¿Está dispuesto a asumir todos los costos y riesgos hasta que la mercancía llegue al país de destino?',
    yes: 'S2a',
    no: 'S3',
  },
  {
    id: 'S2a',
    question: '¿Puede conseguir las licencias de importación, llevar a cabo los trámites de importación en el país de destino y recuperar el IVA a la importación?',
    yes: { result: 'DDP' },
    no: 'S2b',
  },
  {
    id: 'S2b',
    question: '¿Puede descargar la mercancía del transporte de llegada en el lugar de destino?',
    yes: { result: 'DPU' },
    no: { result: 'DAP' },
  },
  {
    id: 'S3',
    question: '¿Está dispuesto a organizar el transporte y pagar el flete hasta el lugar de destino acordado (sin garantizar la llegada)?',
    yes: 'S4',
    no: 'S6',
  },
  {
    id: 'S4',
    question: '¿El lugar de destino es un puerto marítimo?',
    yes: 'S5a',
    no: 'S5b',
  },
  {
    id: 'S5a',
    question: '¿La mercancía se envía en contenedor?',
    yes: { result: 'CPT', altResult: 'CIP', altReason: 'Si quiere incluir seguro (cobertura máxima ICC-A)' },
    no: { result: 'CFR', altResult: 'CIF', altReason: 'Si quiere incluir seguro (cobertura mínima ICC-C)' },
  },
  {
    id: 'S5b',
    question: '¿Desea incluir el seguro de transporte en el precio para el comprador?',
    yes: { result: 'CIP' },
    no: { result: 'CPT' },
  },
  {
    id: 'S6',
    question: '¿Está dispuesto a llevar la mercancía hasta el lugar de embarque internacional y gestionar el despacho de exportación?',
    yes: 'S7',
    no: { result: 'EXW' },
  },
  {
    id: 'S7',
    question: '¿La mercancía se envía en contenedor?',
    yes: { result: 'FCA' },
    no: 'S8',
  },
  {
    id: 'S8',
    question: '¿La mercancía se entrega cargada a bordo de un buque?',
    yes: { result: 'FOB' },
    no: 'S8b',
  },
  {
    id: 'S8b',
    question: '¿La mercancía se entrega al costado del buque (en el muelle)?',
    yes: { result: 'FAS' },
    no: { result: 'FCA' },
  },
]

const BUYER_TREE = [
  {
    id: 'B1',
    question: '¿Prefiere que el vendedor asuma la mayor parte de los costos y riesgos hasta el destino?',
    yes: 'B2',
    no: 'B5',
  },
  {
    id: 'B2',
    question: '¿Quiere que el vendedor también se encargue del despacho de importación y el pago de aranceles en destino?',
    yes: { result: 'DDP' },
    no: 'B3',
  },
  {
    id: 'B3',
    question: '¿Necesita que el vendedor descargue la mercancía en el lugar de destino?',
    yes: { result: 'DPU' },
    no: { result: 'DAP' },
  },
  {
    id: 'B5',
    question: '¿Prefiere que el vendedor contrate y pague el flete hasta su destino?',
    yes: 'B6',
    no: 'B9',
  },
  {
    id: 'B6',
    question: '¿El transporte principal es marítimo?',
    yes: 'B7',
    no: 'B8',
  },
  {
    id: 'B7',
    question: '¿La mercancía se envía en contenedor?',
    yes: { result: 'CPT', altResult: 'CIP', altReason: 'Si quiere que el vendedor incluya seguro (cobertura máxima ICC-A)' },
    no: { result: 'CFR', altResult: 'CIF', altReason: 'Si quiere que el vendedor incluya seguro (cobertura mínima ICC-C)' },
  },
  {
    id: 'B8',
    question: '¿Quiere que el vendedor incluya también un seguro de transporte?',
    yes: { result: 'CIP' },
    no: { result: 'CPT' },
  },
  {
    id: 'B9',
    question: '¿Quiere controlar el transporte principal y contratar su propio flete?',
    yes: 'B10',
    no: { result: 'EXW' },
  },
  {
    id: 'B10',
    question: '¿El transporte principal es marítimo?',
    yes: 'B11',
    no: { result: 'FCA' },
  },
  {
    id: 'B11',
    question: '¿La mercancía se envía en contenedor?',
    yes: { result: 'FCA' },
    no: 'B12',
  },
  {
    id: 'B12',
    question: '¿Quiere que el vendedor cargue la mercancía a bordo del buque?',
    yes: { result: 'FOB' },
    no: { result: 'FAS' },
  },
]

// ── Helpers ──────────────────────────────────────────────────

function getNodeById(tree, id) {
  return tree.find((n) => n.id === id)
}

function getIncoterm(code) {
  return INCOTERMS_2020.find((i) => i.code === code)
}

// ── Resultado del wizard ─────────────────────────────────────

function WizardResult({ resultObj, perspective, onRestart, onSwitch }) {
  const main = getIncoterm(resultObj.result)
  const alt = resultObj.altResult ? getIncoterm(resultObj.altResult) : null

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-100 text-green-700 text-2xl mb-3">
          ✓
        </div>
        <h4 className="text-lg font-bold text-gray-900">Incoterm recomendado</h4>
      </div>

      {/* Resultado principal */}
      <div className="bg-gradient-to-br from-[#0A3D5C] to-[#0D5A8A] rounded-xl p-6 text-white">
        <div className="flex items-baseline gap-3 mb-2">
          <span className="text-3xl font-bold">{main.code}</span>
          <span className="text-lg text-blue-200">{main.name}</span>
        </div>
        <p className="text-sm text-blue-100 mb-3">{main.nameEs}</p>
        <p className="text-sm text-blue-100 leading-relaxed">
          {perspective === 'seller' ? main.sellerPerspective : main.buyerPerspective}
        </p>
      </div>

      {/* Alternativa con seguro */}
      {alt && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <p className="text-sm font-semibold text-amber-800 mb-1">Alternativa: {alt.code} — {alt.name}</p>
          <p className="text-sm text-amber-700">{resultObj.altReason}</p>
          <p className="text-xs text-amber-600 mt-2">
            {perspective === 'seller' ? alt.sellerPerspective : alt.buyerPerspective}
          </p>
        </div>
      )}

      {/* Enlace a la tabla */}
      <a
        href="#tabla-incoterms"
        className="block text-center text-sm text-[#0A3D5C] font-medium hover:underline"
      >
        Ver detalle completo en la tabla ↑
      </a>

      {/* Acciones */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={onRestart}
          className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
        >
          Volver a empezar
        </button>
        <button
          onClick={onSwitch}
          className="px-5 py-2.5 bg-blue-50 text-[#0A3D5C] rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
        >
          Probar como {perspective === 'seller' ? 'comprador' : 'vendedor'}
        </button>
      </div>
    </div>
  )
}

// ── Componente principal ─────────────────────────────────────

export default function IncotermsWizard() {
  const [perspective, setPerspective] = useState(null) // 'seller' | 'buyer'
  const [history, setHistory] = useState([])            // stack of node IDs
  const [result, setResult] = useState(null)             // result object or null

  const tree = perspective === 'seller' ? SELLER_TREE : BUYER_TREE

  const currentNode = history.length > 0 ? getNodeById(tree, history[history.length - 1]) : null

  const totalSteps = perspective === 'seller' ? 5 : 5
  const currentStep = history.length

  const start = useCallback((p) => {
    setPerspective(p)
    setHistory([p === 'seller' ? 'S1' : 'B1'])
    setResult(null)
  }, [])

  const answer = useCallback((direction) => {
    if (!currentNode) return
    const next = currentNode[direction]
    if (typeof next === 'string') {
      setHistory((prev) => [...prev, next])
    } else if (next && next.result) {
      setResult(next)
    }
  }, [currentNode])

  const goBack = useCallback(() => {
    if (result) {
      setResult(null)
      return
    }
    if (history.length > 1) {
      setHistory((prev) => prev.slice(0, -1))
    } else {
      setPerspective(null)
      setHistory([])
    }
  }, [history, result])

  const restart = useCallback(() => {
    setPerspective(null)
    setHistory([])
    setResult(null)
  }, [])

  const switchPerspective = useCallback(() => {
    const newP = perspective === 'seller' ? 'buyer' : 'seller'
    start(newP)
  }, [perspective, start])

  return (
    <section id="wizard-incoterms">
      <div className="bg-gradient-to-br from-[#0A3D5C] via-[#0D5A8A] to-[#1A6FA0] rounded-2xl overflow-hidden shadow-lg">
        <div className="p-6 md:p-10">
          {/* Estado inicial — selección de perspectiva */}
          {!perspective && (
            <div className="text-center space-y-5 animate-fadeIn">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                ¿No sabes qué Incoterm usar?
              </h2>
              <p className="text-blue-200 max-w-lg mx-auto text-sm">
                Responde unas preguntas sencillas y te recomendamos el Incoterm más adecuado para tu operación, basado en los diagramas de decisión oficiales de la ICC.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
                <button
                  onClick={() => start('seller')}
                  className="px-8 py-4 bg-white text-[#0A3D5C] font-bold rounded-xl text-sm hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl"
                >
                  <span className="text-xl block mb-1">📦</span>
                  Soy vendedor / exportador
                </button>
                <button
                  onClick={() => start('buyer')}
                  className="px-8 py-4 bg-white/10 border border-white/30 text-white font-bold rounded-xl text-sm hover:bg-white/20 transition-all"
                >
                  <span className="text-xl block mb-1">🛒</span>
                  Soy comprador / importador
                </button>
              </div>
            </div>
          )}

          {/* Wizard activo */}
          {perspective && !result && currentNode && (
            <div className="max-w-xl mx-auto space-y-6 animate-fadeIn">
              {/* Header */}
              <div className="flex items-center justify-between">
                <button
                  onClick={goBack}
                  className="flex items-center gap-1 text-blue-200 hover:text-white text-sm transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                  </svg>
                  Atrás
                </button>
                <span className="text-xs text-blue-300 font-medium">
                  Paso {currentStep} · {perspective === 'seller' ? 'Vendedor' : 'Comprador'}
                </span>
              </div>

              {/* Barra de progreso */}
              <div className="w-full bg-white/10 rounded-full h-1.5">
                <div
                  className="bg-white/60 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((currentStep / totalSteps) * 100, 95)}%` }}
                />
              </div>

              {/* Pregunta */}
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <p className="text-gray-900 font-medium text-base leading-relaxed mb-6">
                  {currentNode.question}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => answer('yes')}
                    className="flex-1 px-6 py-3.5 bg-emerald-600 text-white font-bold rounded-xl text-sm hover:bg-emerald-700 transition-colors"
                  >
                    Sí
                  </button>
                  <button
                    onClick={() => answer('no')}
                    className="flex-1 px-6 py-3.5 bg-gray-200 text-gray-800 font-bold rounded-xl text-sm hover:bg-gray-300 transition-colors"
                  >
                    No
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Resultado */}
          {perspective && result && (
            <div className="max-w-xl mx-auto">
              <WizardResult
                resultObj={result}
                perspective={perspective}
                onRestart={restart}
                onSwitch={switchPerspective}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
