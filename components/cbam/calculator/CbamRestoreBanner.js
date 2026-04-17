'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslation } from '@/lib/i18n'
import { calculadoraCbamDict } from '@/lib/i18n/calculadora-cbam'

/**
 * CbamRestoreBanner
 *
 * Banner del flujo anónimo → registro/login → restore cross-route.
 *
 * Dos variantes:
 *
 * - `variant="cbam"` (informativo): se renderiza en /cbam/calculadora tras
 *   el auto-save. Controlado desde fuera con `show`. Dos CTAs ("Ver mi
 *   historial" + "Hacer otro cálculo") y X para cerrar.
 *
 * - `variant="taric"` (orientativo): se renderiza en /calculadora (TARIC)
 *   y se autoactiva leyendo `localStorage.cbam_calculator_pending`. Si
 *   el usuario cierra con X, marca `cbam_restore_banner_dismissed` en
 *   sessionStorage y no reaparece hasta que cierre la sesión del
 *   navegador. Texto corto con un link al flujo CBAM.
 *
 * No toca /auth/login ni /auth/register — mitiga la fricción del
 * `next=` que no funciona sin modificar rutas de auth.
 */
const STORAGE_KEY = 'cbam_calculator_pending'
const DISMISSED_KEY = 'cbam_restore_banner_dismissed'

export default function CbamRestoreBanner({ variant = 'taric', show = false, onReset }) {
  const t = useTranslation(calculadoraCbamDict)
  const [visible, setVisible] = useState(false)

  // Lógica de visibilidad por variante
  useEffect(() => {
    if (variant === 'cbam') {
      setVisible(!!show)
      return
    }
    // variant === 'taric': autoactivación por stash
    try {
      const dismissed = sessionStorage.getItem(DISMISSED_KEY)
      const stash = localStorage.getItem(STORAGE_KEY)
      setVisible(!!stash && !dismissed)
    } catch {
      setVisible(false)
    }
  }, [variant, show])

  function handleClose() {
    setVisible(false)
    if (variant === 'taric') {
      try { sessionStorage.setItem(DISMISSED_KEY, '1') } catch { /* noop */ }
    }
  }

  function handleReset() {
    if (onReset) onReset()
    handleClose()
  }

  if (!visible) return null

  if (variant === 'cbam') {
    return (
      <div
        role="status"
        aria-live="polite"
        className="relative mx-4 sm:mx-6 lg:mx-8 my-4 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-white px-5 py-4 shadow-sm max-w-5xl lg:mx-auto"
      >
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="flex-1 min-w-0 pr-6">
            <p className="font-semibold text-emerald-900 mb-0.5">{t('restoreBanner.cbamTitle')}</p>
            <p className="text-sm text-emerald-800/80 leading-relaxed">{t('restoreBanner.cbamDesc')}</p>
            <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3">
              <Link
                href="/cbam/historial"
                className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-800 hover:text-emerald-900 hover:underline"
              >
                {t('restoreBanner.cbamCtaHistory')}
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              {onReset && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-sm font-medium text-emerald-800/80 hover:text-emerald-900 hover:underline"
                >
                  {t('restoreBanner.cbamCtaReset')}
                </button>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label={t('restoreBanner.close')}
            className="absolute top-3 right-3 p-1 text-emerald-700/60 hover:text-emerald-900 rounded-md hover:bg-emerald-100/50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  // variant === 'taric' — franja superior discreta
  return (
    <div
      role="status"
      aria-live="polite"
      className="relative border-b border-amber-200/70 bg-amber-50/60"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 pr-10">
        <div className="flex items-center gap-2 flex-wrap">
          <svg className="w-4 h-4 text-amber-700 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm text-amber-900">{t('restoreBanner.taricText')}</span>
          <Link
            href="/cbam/calculadora"
            className="inline-flex items-center gap-1 text-sm font-semibold text-amber-900 hover:text-amber-700 underline underline-offset-2"
          >
            {t('restoreBanner.taricCta')}
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
      <button
        type="button"
        onClick={handleClose}
        aria-label={t('restoreBanner.close')}
        className="absolute top-1/2 right-3 -translate-y-1/2 p-1 text-amber-700/70 hover:text-amber-900 rounded-md hover:bg-amber-100/60 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
