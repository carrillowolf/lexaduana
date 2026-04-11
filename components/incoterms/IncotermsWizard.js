'use client'

import { useState, useCallback } from 'react'
import { INCOTERMS_2020 } from '@/lib/incotermsData'
import { useTranslation, useLocale } from '@/lib/i18n'
import { incotermsDict, wizardQuestionsDict, incotermsContentDict } from '@/lib/i18n/incoterms'

// ── Decision trees (structure only — text comes from i18n) ──

const SELLER_TREE = [
  { id: 'S1', yes: 'S2a', no: 'S3' },
  { id: 'S2a', yes: { result: 'DDP' }, no: 'S2b' },
  { id: 'S2b', yes: { result: 'DPU' }, no: { result: 'DAP' } },
  { id: 'S3', yes: 'S4', no: 'S6' },
  { id: 'S4', yes: 'S5a', no: 'S5b' },
  { id: 'S5a', yes: { result: 'CPT', altResult: 'CIP', altReasonKey: 'alt_S5a_cpt' }, no: { result: 'CFR', altResult: 'CIF', altReasonKey: 'alt_S5a_cfr' } },
  { id: 'S5b', yes: { result: 'CIP' }, no: { result: 'CPT' } },
  { id: 'S6', yes: 'S7', no: { result: 'EXW' } },
  { id: 'S7', yes: { result: 'FCA' }, no: 'S8' },
  { id: 'S8', yes: { result: 'FOB' }, no: 'S8b' },
  { id: 'S8b', yes: { result: 'FAS' }, no: { result: 'FCA' } },
]

const BUYER_TREE = [
  { id: 'B1', yes: 'B2', no: 'B5' },
  { id: 'B2', yes: { result: 'DDP' }, no: 'B3' },
  { id: 'B3', yes: { result: 'DPU' }, no: { result: 'DAP' } },
  { id: 'B5', yes: 'B6', no: 'B9' },
  { id: 'B6', yes: 'B7', no: 'B8' },
  { id: 'B7', yes: { result: 'CPT', altResult: 'CIP', altReasonKey: 'alt_B7_cpt' }, no: { result: 'CFR', altResult: 'CIF', altReasonKey: 'alt_B7_cfr' } },
  { id: 'B8', yes: { result: 'CIP' }, no: { result: 'CPT' } },
  { id: 'B9', yes: 'B10', no: { result: 'EXW' } },
  { id: 'B10', yes: 'B11', no: { result: 'FCA' } },
  { id: 'B11', yes: { result: 'FCA' }, no: 'B12' },
  { id: 'B12', yes: { result: 'FOB' }, no: { result: 'FAS' } },
]

// ── Helpers ──────────────────────────────────────────────────

function getNodeById(tree, id) {
  return tree.find((n) => n.id === id)
}

function getIncoterm(code) {
  return INCOTERMS_2020.find((i) => i.code === code)
}

// ── Resultado del wizard ─────────────────────────────────────

function WizardResult({ resultObj, perspective, onRestart, onSwitch, t, qDict }) {
  const { locale } = useLocale()
  const main = getIncoterm(resultObj.result)
  const alt = resultObj.altResult ? getIncoterm(resultObj.altResult) : null
  const altReason = resultObj.altReasonKey ? (qDict[resultObj.altReasonKey] || '') : ''

  const getContent = (code, field) => {
    return incotermsContentDict[locale]?.[code]?.[field]
  }

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-100 text-green-700 text-2xl mb-3">
          ✓
        </div>
        <h4 className="text-lg font-bold text-gray-900">{t('wizard.recommended')}</h4>
      </div>

      <div className="bg-gradient-to-br from-[#0A3D5C] to-[#0D5A8A] rounded-xl p-6 text-white">
        <div className="flex items-baseline gap-3 mb-2">
          <span className="text-3xl font-bold">{main.code}</span>
          <span className="text-lg text-blue-200">{main.name}</span>
        </div>
        <p className="text-sm text-blue-100 mb-3">{main.nameEs}</p>
        <p className="text-sm text-blue-100 leading-relaxed">
          {getContent(main.code, perspective === 'seller' ? 'sellerPerspective' : 'buyerPerspective') || (perspective === 'seller' ? main.sellerPerspective : main.buyerPerspective)}
        </p>
      </div>

      {alt && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <p className="text-sm font-semibold text-amber-800 mb-1">{t('wizard.alternative')}: {alt.code} — {alt.name}</p>
          <p className="text-sm text-amber-700">{altReason}</p>
          <p className="text-xs text-amber-600 mt-2">
            {getContent(alt.code, perspective === 'seller' ? 'sellerPerspective' : 'buyerPerspective') || (perspective === 'seller' ? alt.sellerPerspective : alt.buyerPerspective)}
          </p>
        </div>
      )}

      <a href="#tabla-incoterms" className="block text-center text-sm text-[#0A3D5C] font-medium hover:underline">
        {t('wizard.seeDetail')}
      </a>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button onClick={onRestart} className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
          {t('wizard.restart')}
        </button>
        <button onClick={onSwitch} className="px-5 py-2.5 bg-blue-50 text-[#0A3D5C] rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors">
          {t('wizard.tryAs')} {perspective === 'seller' ? t('wizard.perspectiveBuyer').toLowerCase() : t('wizard.perspectiveSeller').toLowerCase()}
        </button>
      </div>
    </div>
  )
}

// ── Componente principal ─────────────────────────────────────

export default function IncotermsWizard() {
  const [perspective, setPerspective] = useState(null)
  const [history, setHistory] = useState([])
  const [result, setResult] = useState(null)
  const t = useTranslation(incotermsDict)
  const { locale } = useLocale()
  const qDict = wizardQuestionsDict[locale] || wizardQuestionsDict.es

  const tree = perspective === 'seller' ? SELLER_TREE : BUYER_TREE
  const currentNode = history.length > 0 ? getNodeById(tree, history[history.length - 1]) : null
  const totalSteps = 5
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
    if (result) { setResult(null); return }
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
          {!perspective && (
            <div className="text-center space-y-5 animate-fadeIn">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                {t('wizard.title')}
              </h2>
              <p className="text-blue-200 max-w-lg mx-auto text-sm">
                {t('wizard.subtitle')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
                <button
                  onClick={() => start('seller')}
                  className="px-8 py-4 bg-white text-[#0A3D5C] font-bold rounded-xl text-sm hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl"
                >
                  <span className="text-xl block mb-1">📦</span>
                  {t('wizard.seller')}
                </button>
                <button
                  onClick={() => start('buyer')}
                  className="px-8 py-4 bg-white/10 border border-white/30 text-white font-bold rounded-xl text-sm hover:bg-white/20 transition-all"
                >
                  <span className="text-xl block mb-1">🛒</span>
                  {t('wizard.buyer')}
                </button>
              </div>
            </div>
          )}

          {perspective && !result && currentNode && (
            <div className="max-w-xl mx-auto space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between">
                <button onClick={goBack} className="flex items-center gap-1 text-blue-200 hover:text-white text-sm transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                  </svg>
                  {t('wizard.back')}
                </button>
                <span className="text-xs text-blue-300 font-medium">
                  {t('wizard.step')} {currentStep} · {perspective === 'seller' ? t('wizard.perspectiveSeller') : t('wizard.perspectiveBuyer')}
                </span>
              </div>

              <div className="w-full bg-white/10 rounded-full h-1.5">
                <div
                  className="bg-white/60 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((currentStep / totalSteps) * 100, 95)}%` }}
                />
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg">
                <p className="text-gray-900 font-medium text-base leading-relaxed mb-6">
                  {qDict[currentNode.id] || currentNode.id}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => answer('yes')}
                    className="flex-1 px-6 py-3.5 bg-emerald-600 text-white font-bold rounded-xl text-sm hover:bg-emerald-700 transition-colors"
                  >
                    {t('wizard.yes')}
                  </button>
                  <button
                    onClick={() => answer('no')}
                    className="flex-1 px-6 py-3.5 bg-gray-200 text-gray-800 font-bold rounded-xl text-sm hover:bg-gray-300 transition-colors"
                  >
                    {t('wizard.no')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {perspective && result && (
            <div className="max-w-xl mx-auto">
              <WizardResult
                resultObj={result}
                perspective={perspective}
                onRestart={restart}
                onSwitch={switchPerspective}
                t={t}
                qDict={qDict}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
