'use client'

import { useEffect, useState } from 'react'

const STORAGE_PREFIX = 'lexaduana_ai_consent_'

const NOUN_BY_KEY = {
  classifier: 'contenido',
  ocr_invoice: 'archivo',
}

export default function QuickAIConsent({ consentKey, onConsentChange, className = '' }) {
  const [hidden, setHidden] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [hideForSession, setHideForSession] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = window.sessionStorage.getItem(STORAGE_PREFIX + consentKey)
    if (stored === 'session-accepted') {
      setHidden(true)
      onConsentChange(true)
    }
  }, [consentKey, onConsentChange])

  const toggleAccept = (e) => {
    const next = e.target.checked
    setAccepted(next)
    onConsentChange(next)
    if (!next) {
      setHideForSession(false)
    }
  }

  const toggleHideForSession = (e) => {
    const next = e.target.checked
    setHideForSession(next)
    if (next && typeof window !== 'undefined') {
      window.sessionStorage.setItem(STORAGE_PREFIX + consentKey, 'session-accepted')
      setHidden(true)
    }
  }

  if (hidden) return null

  const noun = NOUN_BY_KEY[consentKey] || 'contenido'

  return (
    <div
      className={`rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5 ${className}`}
      role="region"
      aria-label="Información sobre el procesamiento con IA"
    >
      <div className="flex gap-3">
        <span aria-hidden="true" className="text-[#0A3D5C] text-xl leading-none">ⓘ</span>
        <div className="flex-1 space-y-3 min-w-0">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Información sobre el procesamiento
            </p>
            <p className="text-sm text-slate-700 mt-1 leading-relaxed">
              El {noun} se enviará a la API de Anthropic (proveedor de IA con sede en EEUU)
              bajo Cláusulas Contractuales Tipo aprobadas por la UE. Anthropic conserva
              los datos un máximo de 7 días para detección de abuso y no los utiliza para
              entrenar modelos. Si no aceptas, no se procesará.
            </p>
          </div>

          <div className="space-y-2">
            <label className="flex items-start gap-2 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={accepted}
                onChange={toggleAccept}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#0A3D5C] focus:ring-[#0A3D5C]/30"
              />
              <span>Acepto el procesamiento descrito</span>
            </label>

            <label
              className={`flex items-start gap-2 text-sm ${
                accepted ? 'text-slate-700 cursor-pointer' : 'text-slate-400 cursor-not-allowed'
              }`}
            >
              <input
                type="checkbox"
                checked={hideForSession}
                onChange={toggleHideForSession}
                disabled={!accepted}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#0A3D5C] focus:ring-[#0A3D5C]/30 disabled:opacity-50"
              />
              <span>No volver a mostrar en esta sesión</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}
