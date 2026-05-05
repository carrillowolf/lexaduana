'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { useTranslation } from '@/lib/i18n'
import { rrmDict } from '@/lib/i18n/rrm'
import RRMProgressBar from '@/components/rrm/RRMProgressBar'
import StepSelector from '@/components/rrm/StepSelector'
import StepUpload from '@/components/rrm/StepUpload'
import StepReview from '@/components/rrm/StepReview'
import StepGenerate from '@/components/rrm/StepGenerate'

const INITIAL_STATE = {
  // Paso 1
  caseType: '',
  requestType: 'REM',
  legalBasis: 'A',
  subRequestType: '1',
  // Paso 2 (datos del H1)
  mrn: '',
  acceptanceDate: '',
  customsOffice: '',
  requestedProcedure: '',
  deliveryTerms: '',
  customsValue: '',
  importer: { eori: '', name: '', address: '' },
  representative: { eori: '', name: '', address: '' },
  commodityCode: '',
  goodsDescription: '',
  netMass: '',
  supplementaryUnits: '',
  countryOfOrigin: '',
  preferenceDeclared: '',
  // Paso 3 (revisión)
  dutiesDeclared: { A00: 0, B00: 0 },
  dutiesCorrected: { A00: 0, B00: 0 },
  motivosText: '',
  contact: { name: '', role: '', email: '', phone: '' },
  bank: { holder: '', iban: '', bic: '' },
  goodsLocation: '',
  customsCompetent: '',
  useDestination: '',
  additionalInfo: '',
  place: '',
  requestDate: '',
}

export default function RrmPage() {
  const t = useTranslation(rrmDict)
  const router = useRouter()
  const [authReady, setAuthReady] = useState(false)
  const [step, setStep] = useState(1)
  const [state, setState] = useState(INITIAL_STATE)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/auth/login?redirect=/rrm')
        return
      }
      setAuthReady(true)
    })
  }, [router])

  if (!authReady) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-500 flex items-center justify-center">
        <div className="animate-pulse">…</div>
      </div>
    )
  }

  // Validación por paso (controla habilitación del botón Siguiente)
  const canAdvance = (() => {
    if (step === 1) return !!state.caseType && !!state.requestType
    if (step === 2) return !!state.mrn && !!state.customsOffice
    if (step === 3) return !!state.motivosText
    return true
  })()

  const restart = () => {
    setStep(1)
    setState(INITIAL_STATE)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Hero */}
        <div className="bg-[#0A3D5C] rounded-2xl px-6 sm:px-8 py-8 mb-8 shadow-sm">
          <div className="inline-block text-xs px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-medium mb-3">
            {t('hero.badge')}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{t('hero.title')}</h1>
          <p className="text-slate-200 max-w-3xl leading-relaxed">{t('hero.description')}</p>
        </div>

        <RRMProgressBar current={step} />

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 md:p-8">
          {step === 1 && <StepSelector state={state} setState={setState} />}
          {step === 2 && <StepUpload state={state} setState={setState} />}
          {step === 3 && <StepReview state={state} setState={setState} />}
          {step === 4 && <StepGenerate state={state} onRestart={restart} />}

          {/* Botones de navegación */}
          {step < 4 && (
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-200">
              <button
                onClick={() => setStep((s) => Math.max(1, s - 1))}
                disabled={step === 1}
                className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-6 py-3 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ← {t('common.back')}
              </button>
              <button
                onClick={() => setStep((s) => Math.min(4, s + 1))}
                disabled={!canAdvance}
                className="bg-[#0A3D5C] hover:bg-[#082c44] text-white font-medium px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('common.next')} →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
