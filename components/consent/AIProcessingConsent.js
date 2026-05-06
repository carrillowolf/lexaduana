'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { POLICY_VERSIONS } from '@/lib/consentPolicy'

const SESSION_STORAGE_KEYS = {
  ai_processing_classifier: 'lexaduana_ai_consent_classifier',
  ai_processing_ocr_invoice: 'lexaduana_ai_consent_ocr_invoice',
}

const TEXTS = {
  ai_processing_classifier: {
    title: 'Procesamiento del contenido por IA',
    body: 'El texto que envíes se procesará con la API de Anthropic (Claude) para sugerirte códigos arancelarios. Anthropic procesa el contenido para devolver la respuesta y aplica una retención técnica de 7 días con fines de detección de abuso. No se utiliza para entrenar modelos.',
  },
  ai_processing_ocr_invoice: {
    title: 'Procesamiento del archivo por IA',
    body: 'El archivo que subas se procesará con la API de Anthropic (Claude) para extraer los datos de la factura. Anthropic procesa el contenido para devolver la respuesta y aplica una retención técnica de 7 días con fines de detección de abuso. No se utiliza para entrenar modelos.',
  },
}

export default function AIProcessingConsent({ consentType, onConsentChange }) {
  const [loading, setLoading] = useState(true)
  const [hasConsent, setHasConsent] = useState(false)
  const [unauthenticated, setUnauthenticated] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [shake, setShake] = useState(false)

  // Estable: el padre puede pasar una función inline. Capturamos referencia
  // para no re-disparar el efecto en cada render del padre.
  const onConsentChangeRef = useRef(onConsentChange)
  useEffect(() => {
    onConsentChangeRef.current = onConsentChange
  }, [onConsentChange])

  useEffect(() => {
    // Limpiar sessionStorage huérfano de Phase 2.5.
    if (typeof window !== 'undefined') {
      const legacyKey = SESSION_STORAGE_KEYS[consentType]
      if (legacyKey) window.sessionStorage.removeItem(legacyKey)
    }

    let cancelled = false
    async function check() {
      try {
        const res = await fetch(`/api/consent/check?type=${encodeURIComponent(consentType)}`, {
          method: 'GET',
          credentials: 'same-origin',
        })
        if (cancelled) return
        if (res.status === 401) {
          setUnauthenticated(true)
          setLoading(false)
          return
        }
        if (!res.ok) {
          setError('No se pudo comprobar el consentimiento. Inténtalo de nuevo.')
          setLoading(false)
          return
        }
        const json = await res.json()
        if (json.hasActiveConsent) {
          setHasConsent(true)
          onConsentChangeRef.current?.(true)
        }
      } catch {
        if (!cancelled) setError('Error de red al comprobar el consentimiento.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    check()
    return () => { cancelled = true }
  }, [consentType])

  async function handleAccept() {
    if (!accepted) {
      setShake(true)
      setError('Debes marcar la casilla para continuar.')
      setTimeout(() => setShake(false), 500)
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/consent/record', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consentType,
          policyVersion: POLICY_VERSIONS[consentType],
          accepted: true,
        }),
      })
      if (res.status === 401) {
        setUnauthenticated(true)
        return
      }
      if (!res.ok) {
        setError('No se pudo registrar el consentimiento. Inténtalo de nuevo.')
        return
      }
      setHasConsent(true)
      onConsentChangeRef.current?.(true)
    } catch {
      setError('Error de red al registrar el consentimiento.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div
        className="rounded-2xl border border-slate-200 bg-slate-50 p-4 animate-pulse"
        aria-hidden="true"
      >
        <div className="h-3 w-1/3 bg-slate-200 rounded mb-3" />
        <div className="h-3 w-full bg-slate-200 rounded mb-2" />
        <div className="h-3 w-5/6 bg-slate-200 rounded" />
      </div>
    )
  }

  if (hasConsent) return null

  if (unauthenticated) {
    return (
      <div
        className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
        role="alert"
      >
        Debes{' '}
        <Link href="/auth/login" className="underline font-semibold hover:text-amber-700">
          iniciar sesión
        </Link>
        {' '}para continuar.
      </div>
    )
  }

  const text = TEXTS[consentType] || TEXTS.ai_processing_classifier

  return (
    <div
      className={`rounded-2xl border p-4 transition-all ${
        shake ? 'border-red-400 animate-pulse' : 'border-slate-200'
      }`}
      role="region"
      aria-label="Consentimiento de procesamiento por IA"
    >
      <div className="flex gap-3">
        <span aria-hidden="true" className="text-[#0A3D5C] text-xl leading-none">ⓘ</span>
        <div className="flex-1 min-w-0 space-y-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">{text.title}</p>
            <p className="text-sm text-slate-700 mt-1 leading-relaxed">
              {text.body}{' '}
              Más detalles en la{' '}
              <Link
                href="/privacidad"
                className="underline text-[#0A3D5C] hover:text-[#0A3D5C]/80"
              >
                Política de Privacidad
              </Link>
              .
            </p>
          </div>

          <label className="flex items-start gap-2 text-sm text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => {
                setAccepted(e.target.checked)
                if (e.target.checked) setError(null)
              }}
              disabled={submitting}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#0A3D5C] focus:ring-[#0A3D5C]/30"
            />
            <span>Acepto el procesamiento descrito.</span>
          </label>

          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <button
              type="button"
              onClick={handleAccept}
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-[#F4C542] text-[#0A3D5C] text-sm font-semibold hover:bg-[#F4C542]/90 disabled:opacity-60 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Registrando…</span>
                </>
              ) : (
                <span>Aceptar y continuar</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
