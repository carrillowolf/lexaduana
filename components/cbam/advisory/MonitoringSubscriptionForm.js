'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/lib/i18n'
import { cbamDict } from '@/lib/i18n/cbam'

const DUA_TEXT_VERSION = 'v1-2026-04'

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

function parseCommaList(value, { max = 20, maxLen = 120, upper = false } = {}) {
  if (typeof value !== 'string') return []
  return value
    .split(',')
    .map(s => (upper ? s.trim().toUpperCase() : s.trim()))
    .filter(s => s.length > 0 && s.length <= maxLen)
    .slice(0, max)
}

function FieldError({ message }) {
  if (!message) return null
  return <p className="mt-1 text-xs text-red-600">{message}</p>
}

export default function MonitoringSubscriptionForm() {
  const t = useTranslation(cbamDict)
  const router = useRouter()

  const [step, setStep] = useState(1)
  const [data, setData] = useState({
    companyName: '',
    companyLegalName: '',
    companyCif: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    duaAuthorizationAccepted: false,
    mainCbamProductsInput: '',
    mainOriginCountriesInput: '',
    expectedMonthlyVolume: '',
    clientNotes: '',
    finalConfirm: false,
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [done, setDone] = useState(false)

  const steps = [
    { number: 1, title: t('monitoring.step1') },
    { number: 2, title: t('monitoring.step2') },
    { number: 3, title: t('monitoring.step3') },
    { number: 4, title: t('monitoring.step4') },
  ]

  function update(field, value) {
    setData(prev => ({ ...prev, [field]: value }))
  }

  function validateStep(current) {
    const e = {}
    if (current === 1) {
      if (!data.companyName.trim()) e.companyName = t('monitoring.valCompanyRequired')
      if (!data.contactName.trim()) e.contactName = t('monitoring.valContactRequired')
      if (!data.contactEmail.trim()) e.contactEmail = t('monitoring.valEmailRequired')
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contactEmail.trim())) {
        e.contactEmail = t('monitoring.valEmailInvalid')
      }
    }
    if (current === 2) {
      if (!data.duaAuthorizationAccepted) e.duaAuthorizationAccepted = t('monitoring.valDuaRequired')
    }
    if (current === 3) {
      if (!data.expectedMonthlyVolume) e.expectedMonthlyVolume = t('monitoring.valVolumeRequired')
    }
    if (current === 4) {
      if (!data.finalConfirm) e.finalConfirm = t('monitoring.valConfirmRequired')
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleNext() {
    if (validateStep(step)) setStep(s => Math.min(4, s + 1))
  }

  function handlePrev() {
    setStep(s => Math.max(1, s - 1))
  }

  async function handleSubmit() {
    if (!validateStep(4)) return
    setSubmitting(true)
    setSubmitError('')
    try {
      const payload = {
        companyName: data.companyName.trim(),
        companyLegalName: data.companyLegalName.trim() || null,
        companyCif: data.companyCif.trim() || null,
        contactName: data.contactName.trim(),
        contactEmail: data.contactEmail.trim(),
        contactPhone: data.contactPhone.trim() || null,
        duaAuthorizationAccepted: true,
        mainCbamProducts: parseCommaList(data.mainCbamProductsInput),
        mainOriginCountries: parseCommaList(data.mainOriginCountriesInput, { max: 15, maxLen: 3, upper: true }),
        expectedMonthlyVolume: data.expectedMonthlyVolume,
        clientNotes: data.clientNotes.trim() || null,
      }
      const res = await fetch('/api/cbam/monitoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || 'Error al enviar la solicitud')
      }
      setDone(true)
    } catch (err) {
      setSubmitError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
        <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('monitoring.successTitle')}</h1>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">{t('monitoring.successBody')}</p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/cbam/asesoria" className="px-5 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50">
            {t('monitoring.successBackLanding')}
          </Link>
          <Link href="/cbam/asesoria/mis-solicitudes" className="px-5 py-2.5 rounded-xl bg-[#0A3D5C] text-white text-sm font-semibold hover:bg-[#0d5078]">
            {t('monitoring.successMyRequests')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#0A3D5C]">{t('monitoring.pageTitle')}</h1>
        <p className="text-sm text-gray-600 mt-1">{t('monitoring.pageDesc')}</p>
      </div>

      <ProgressBar currentStep={step} steps={steps} />

      <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8">
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{t('monitoring.companyTitle')}</h2>
              <p className="text-sm text-gray-500 mt-1">{t('monitoring.companyDesc')}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('monitoring.companyName')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={data.companyName}
                onChange={(e) => update('companyName', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#0A3D5C]/20 focus:border-[#0A3D5C] outline-none"
              />
              <FieldError message={errors.companyName} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('monitoring.companyLegalName')}{' '}
                  <span className="text-gray-400 text-xs">{t('monitoring.companyLegalNameHint')}</span>
                </label>
                <input
                  type="text"
                  value={data.companyLegalName}
                  onChange={(e) => update('companyLegalName', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#0A3D5C]/20 focus:border-[#0A3D5C] outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('monitoring.companyCif')}
                </label>
                <input
                  type="text"
                  value={data.companyCif}
                  onChange={(e) => update('companyCif', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#0A3D5C]/20 focus:border-[#0A3D5C] outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('monitoring.contactName')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={data.contactName}
                  onChange={(e) => update('contactName', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#0A3D5C]/20 focus:border-[#0A3D5C] outline-none"
                />
                <FieldError message={errors.contactName} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('monitoring.contactEmail')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={data.contactEmail}
                  onChange={(e) => update('contactEmail', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#0A3D5C]/20 focus:border-[#0A3D5C] outline-none"
                />
                <FieldError message={errors.contactEmail} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('monitoring.contactPhone')}{' '}
                <span className="text-gray-400 text-xs">{t('monitoring.contactPhoneHint')}</span>
              </label>
              <input
                type="tel"
                value={data.contactPhone}
                onChange={(e) => update('contactPhone', e.target.value)}
                className="w-full md:w-1/2 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#0A3D5C]/20 focus:border-[#0A3D5C] outline-none"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{t('monitoring.duaTitle')}</h2>
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">{t('monitoring.duaDesc')}</p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-sm text-gray-700 leading-relaxed">
              {t('monitoring.duaLegal')}
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={data.duaAuthorizationAccepted}
                onChange={(e) => update('duaAuthorizationAccepted', e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-gray-300 text-[#0A3D5C] focus:ring-[#0A3D5C]"
              />
              <span className="text-sm font-medium text-gray-900">
                {t('monitoring.duaAcceptLabel')} <span className="text-red-500">*</span>
              </span>
            </label>
            <FieldError message={errors.duaAuthorizationAccepted} />

            <p className="text-xs text-gray-500">
              {t('monitoring.duaVersionNote').replace('{version}', DUA_TEXT_VERSION)}
            </p>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{t('monitoring.profileTitle')}</h2>
              <p className="text-sm text-gray-500 mt-1">{t('monitoring.profileDesc')}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('monitoring.productsLabel')}
              </label>
              <input
                type="text"
                value={data.mainCbamProductsInput}
                onChange={(e) => update('mainCbamProductsInput', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#0A3D5C]/20 focus:border-[#0A3D5C] outline-none"
              />
              <p className="mt-1 text-xs text-gray-500">{t('monitoring.productsHint')}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('monitoring.countriesLabel')}
              </label>
              <input
                type="text"
                value={data.mainOriginCountriesInput}
                onChange={(e) => update('mainOriginCountriesInput', e.target.value.toUpperCase())}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#0A3D5C]/20 focus:border-[#0A3D5C] outline-none"
              />
              <p className="mt-1 text-xs text-gray-500">{t('monitoring.countriesHint')}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('monitoring.volumeLabel')} <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { value: '<50t', label: t('monitoring.volumeLt50') },
                  { value: '50-200t', label: t('monitoring.volume50_200') },
                  { value: '200-500t', label: t('monitoring.volume200_500') },
                  { value: '500t+', label: t('monitoring.volumeGt500') },
                ].map(opt => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-2 px-3 py-2.5 border rounded-lg text-sm cursor-pointer transition-colors ${
                      data.expectedMonthlyVolume === opt.value
                        ? 'border-[#0A3D5C] bg-[#0A3D5C]/5 text-[#0A3D5C] font-medium'
                        : 'border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="monitoringVolume"
                      value={opt.value}
                      checked={data.expectedMonthlyVolume === opt.value}
                      onChange={(e) => update('expectedMonthlyVolume', e.target.value)}
                      className="w-4 h-4 text-[#0A3D5C] border-gray-300 focus:ring-[#0A3D5C]"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
              <FieldError message={errors.expectedMonthlyVolume} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('monitoring.notesLabel')}
              </label>
              <textarea
                value={data.clientNotes}
                onChange={(e) => update('clientNotes', e.target.value)}
                placeholder={t('monitoring.notesPlaceholder')}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#0A3D5C]/20 focus:border-[#0A3D5C] outline-none resize-y"
              />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{t('monitoring.confirmTitle')}</h2>
              <p className="text-sm text-gray-500 mt-1">{t('monitoring.confirmDesc')}</p>
            </div>

            <div className="bg-[#0A3D5C]/5 border border-[#0A3D5C]/10 rounded-xl p-5">
              <p className="text-sm font-semibold text-[#0A3D5C]">
                {t('monitoring.confirmPriceLine')}
              </p>
              <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                {t('monitoring.confirmBillingNote')}
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-sm space-y-2">
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">{t('monitoring.companyName')}</span>
                <span className="text-gray-900 font-medium text-right">{data.companyName || '—'}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">{t('monitoring.contactEmail')}</span>
                <span className="text-gray-900 font-medium text-right">{data.contactEmail || '—'}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">{t('monitoring.volumeLabel')}</span>
                <span className="text-gray-900 font-medium text-right">{data.expectedMonthlyVolume || '—'}</span>
              </div>
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={data.finalConfirm}
                onChange={(e) => update('finalConfirm', e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-gray-300 text-[#0A3D5C] focus:ring-[#0A3D5C]"
              />
              <span className="text-sm text-gray-900">
                {t('monitoring.confirmCheckbox')} <span className="text-red-500">*</span>
              </span>
            </label>
            <FieldError message={errors.finalConfirm} />

            {submitError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {submitError}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <div>
          {step > 1 ? (
            <button
              type="button"
              onClick={handlePrev}
              className="px-4 py-2 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              ← {t('monitoring.previous')}
            </button>
          ) : (
            <Link
              href="/cbam/asesoria"
              className="px-4 py-2 rounded-xl text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              ← {t('monitoring.backToLanding')}
            </Link>
          )}
        </div>
        <div>
          {step < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2.5 rounded-xl bg-[#0A3D5C] text-white text-sm font-semibold hover:bg-[#0d5078]"
            >
              {t('monitoring.next')} →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-[#0A3D5C] text-white text-sm font-semibold hover:bg-[#0d5078] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? t('monitoring.submitting') : t('monitoring.submit')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
