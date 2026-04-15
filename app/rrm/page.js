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
      <div className="min-h-screen bg-[#060d16] text-gray-400 flex items-center justify-center">
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
    <div className="min-h-screen bg-[#060d16] text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Hero */}
        <div className="mb-6">
          <div className="inline-block text-xs px-2 py-1 rounded bg-[#0A3D5C]/40 border border-[#F4C542]/30 text-[#F4C542] mb-2">
            {t('hero.badge')}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{t('hero.title')}</h1>
          <p className="text-gray-400 max-w-3xl">{t('hero.description')}</p>
        </div>

        <RRMProgressBar current={step} />

        <div className="bg-[#0a1628]/40 border border-[#1a2d4a] rounded-xl p-5 sm:p-7">
          {step === 1 && <StepSelector state={state} setState={setState} />}
          {step === 2 && <StepUpload state={state} setState={setState} />}
          {step === 3 && <StepReview state={state} setState={setState} />}
          {step === 4 && <StepGenerate state={state} onRestart={restart} />}

          {/* Botones de navegación */}
          {step < 4 && (
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-[#1a2d4a]">
              <button
                onClick={() => setStep((s) => Math.max(1, s - 1))}
                disabled={step === 1}
                className="border border-[#1a2d4a] text-gray-300 px-5 py-2 rounded hover:border-[#F4C542]/50 transition-colors disabled:opacity-30"
              >
                ← {t('common.back')}
              </button>
              <button
                onClick={() => setStep((s) => Math.min(4, s + 1))}
                disabled={!canAdvance}
                className="bg-[#F4C542] text-black font-semibold px-5 py-2 rounded hover:bg-[#e3b637] transition-colors disabled:opacity-50"
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
