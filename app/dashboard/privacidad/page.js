'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import DeleteAccountButton from '@/components/account/DeleteAccountButton'
import { safeLogger } from '@/lib/safe-logger'

const AI_CONSENT_TYPES = [
  { type: 'ai_processing_classifier', label: 'Clasificador IA' },
  { type: 'ai_processing_ocr_invoice', label: 'OCR de facturas' },
]

function formatDate(value) {
  if (!value) return ''
  try {
    return new Date(value).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return ''
  }
}

export default function PrivacidadPage() {
  const router = useRouter()
  const supabase = createClient()

  const [authLoading, setAuthLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState(null)

  const [consentsLoading, setConsentsLoading] = useState(true)
  const [activeConsents, setActiveConsents] = useState([])
  const [revoking, setRevoking] = useState(null)
  const [revokeMessage, setRevokeMessage] = useState(null)

  // --- Auth gate.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (cancelled) return
      if (!user) {
        router.push('/auth/login')
        return
      }
      setAuthLoading(false)
    })()
    return () => { cancelled = true }
  }, [router, supabase])

  // --- Carga de consents activos.
  const loadConsents = useCallback(async () => {
    setConsentsLoading(true)
    try {
      const results = await Promise.all(
        AI_CONSENT_TYPES.map(async ({ type, label }) => {
          const res = await fetch(`/api/consent/check?type=${type}`, { cache: 'no-store' })
          if (!res.ok) return null
          const data = await res.json()
          if (!data?.hasActiveConsent) return null
          return {
            type,
            label,
            acceptedAt: data.lastAcceptedAt,
            version: data.lastAcceptedVersion,
          }
        })
      )
      setActiveConsents(results.filter(Boolean))
    } catch (err) {
      safeLogger.error('[privacidad] loadConsents error:', err?.message || err)
      setActiveConsents([])
    } finally {
      setConsentsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!authLoading) loadConsents()
  }, [authLoading, loadConsents])

  // --- Descarga del export JSON.
  const handleDownload = async () => {
    setDownloading(true)
    setDownloadError(null)
    try {
      const res = await fetch('/api/account/export', { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const blob = await res.blob()
      const disposition = res.headers.get('content-disposition') || ''
      const match = disposition.match(/filename="?([^"]+)"?/)
      const filename = match?.[1] || 'lexaduana-export.json'
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      safeLogger.error('[privacidad] export error:', err?.message || err)
      setDownloadError(
        'No se ha podido generar el export. Inténtalo de nuevo o contacta con privacidad@lexaduana.es.'
      )
    } finally {
      setDownloading(false)
    }
  }

  // --- Revocación de consent.
  const handleRevoke = async (consentType, label) => {
    setRevoking(consentType)
    setRevokeMessage(null)
    try {
      const res = await fetch('/api/consent/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consentType }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setRevokeMessage({ type: 'success', text: `Consentimiento revocado: ${label}.` })
      await loadConsents()
    } catch (err) {
      safeLogger.error('[privacidad] revoke error:', err?.message || err)
      setRevokeMessage({
        type: 'error',
        text: 'No se ha podido revocar el consentimiento. Inténtalo de nuevo.',
      })
    } finally {
      setRevoking(null)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#0A3D5C] border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Cargando…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500">
          <Link href="/dashboard" className="hover:text-[#0A3D5C] hover:underline">
            ← Volver al dashboard
          </Link>
          <span className="mx-2 text-gray-300">/</span>
          <span className="text-gray-700">Privacidad y derechos</span>
        </nav>

        {/* Encabezado */}
        <header className="space-y-3">
          <h1 className="text-3xl font-bold text-[#141B2D]">Privacidad y derechos</h1>
          <p className="text-gray-600 leading-relaxed">
            Esta página te permite ejercer los derechos que el RGPD te reconoce sobre tus
            datos personales. Para más detalle consulta la{' '}
            <Link href="/privacidad" className="text-[#0A3D5C] underline hover:no-underline">
              Política de Privacidad
            </Link>
            .
          </p>
        </header>

        {/* CARD 1 — Acceso y portabilidad */}
        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8">
          <h2 className="text-xl font-bold text-[#141B2D] mb-3">Acceso y portabilidad</h2>
          <p className="text-gray-600 leading-relaxed mb-5">
            Tienes derecho a recibir una copia de todos los datos personales que LexAduana
            trata sobre ti, en formato estructurado y legible por máquina (art. 15 y 20
            RGPD). El archivo JSON incluye tu perfil, historial de clasificaciones,
            extracciones OCR, despachos registrados, alertas, favoritos y registros de
            consentimiento.
          </p>
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="px-5 py-2.5 bg-[#0A3D5C] hover:bg-[#083049] disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors"
          >
            {downloading ? 'Generando…' : 'Descargar mis datos (JSON)'}
          </button>
          {downloadError && (
            <p className="mt-3 text-sm text-red-700 font-medium">⚠ {downloadError}</p>
          )}
        </section>

        {/* CARD 2 — Rectificación */}
        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8">
          <h2 className="text-xl font-bold text-[#141B2D] mb-3">Rectificación de datos</h2>
          <div className="text-gray-600 leading-relaxed space-y-3">
            <p>
              Tu cuenta de LexAduana almacena los siguientes datos personales: email,
              contraseña y nombre de empresa. Para modificar cualquiera de ellos, escribe a{' '}
              <a
                href="mailto:privacidad@lexaduana.es"
                className="text-[#0A3D5C] underline hover:no-underline"
              >
                privacidad@lexaduana.es
              </a>{' '}
              indicando el cambio que deseas realizar. Verificaremos tu identidad antes de
              aplicarlo.
            </p>
            <p>
              Otros datos asociados a tu cuenta (plan contratado, límites de uso,
              configuración del servicio) se gestionan automáticamente por el sistema y no
              requieren rectificación manual.
            </p>
            <p>
              En futuras versiones de LexAduana habilitaremos la edición directa desde esta
              sección.
            </p>
          </div>
        </section>

        {/* CARD 3 — Limitación del tratamiento */}
        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8">
          <h2 className="text-xl font-bold text-[#141B2D] mb-3">Limitación del tratamiento</h2>
          <p className="text-gray-600 leading-relaxed mb-5">
            Puedes revocar tu consentimiento al tratamiento mediante inteligencia artificial
            sin eliminar tu cuenta. Si lo haces, no podrás utilizar las herramientas que
            dependen de IA (clasificador de productos, OCR de facturas) hasta que vuelvas a
            otorgar el consentimiento.
          </p>

          {consentsLoading ? (
            <p className="text-sm text-gray-500">Cargando consentimientos…</p>
          ) : activeConsents.length === 0 ? (
            <p className="text-gray-600 italic leading-relaxed">
              Actualmente no tienes ningún consentimiento de tratamiento mediante IA activo.
              Cuando uses el clasificador o el OCR, se te pedirá aceptar el tratamiento.
            </p>
          ) : (
            <ul className="space-y-2">
              {activeConsents.map((c) => (
                <li
                  key={c.type}
                  className="flex items-center justify-between gap-4 p-3 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <span className="text-sm text-gray-700">
                    <strong>{c.label}</strong>
                    {' '}
                    <span className="text-gray-500">
                      (otorgado el {formatDate(c.acceptedAt)}, versión {c.version})
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRevoke(c.type, c.label)}
                    disabled={revoking === c.type}
                    className="px-3 py-1.5 text-sm bg-white border border-[#0A3D5C] text-[#0A3D5C] hover:bg-[#0A3D5C] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed font-medium rounded-lg transition-colors"
                  >
                    {revoking === c.type ? 'Revocando…' : 'Revocar'}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {revokeMessage && (
            <p
              className={`mt-3 text-sm font-medium ${
                revokeMessage.type === 'success' ? 'text-emerald-700' : 'text-red-700'
              }`}
            >
              {revokeMessage.type === 'success' ? '✓ ' : '⚠ '}
              {revokeMessage.text}
            </p>
          )}
        </section>

        {/* CARD 4 — Oposición */}
        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8">
          <h2 className="text-xl font-bold text-[#141B2D] mb-3">
            Oposición a tratamientos específicos
          </h2>
          <div className="text-gray-600 leading-relaxed space-y-3">
            <p>
              Actualmente LexAduana no realiza tratamientos de datos a los que el usuario
              pueda oponerse específicamente: todos los tratamientos se basan en la ejecución
              del contrato de servicio (art. 6.1.b RGPD) o en obligaciones legales (art.
              6.1.c RGPD), no en interés legítimo del responsable ni en consentimiento
              revocable selectivamente.
            </p>
            <p>
              En particular, LexAduana no envía actualmente comunicaciones comerciales
              propias (newsletter, marketing). Si en el futuro se habilitara este tipo de
              comunicaciones, será siempre con consentimiento previo y opt-in explícito, y
              podrá retirarse desde esta misma sección.
            </p>
            <p>
              Para oponerse al tratamiento mediante IA (clasificador, OCR), utiliza la
              sección <strong>Limitación</strong>. Para suprimir todos tus datos, utiliza la
              sección <strong>Supresión</strong> o el botón &quot;Eliminar mi cuenta&quot;.
            </p>
          </div>
        </section>

        {/* CARD 5 — Supresión */}
        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8">
          <h2 className="text-xl font-bold text-[#141B2D] mb-3">Supresión (derecho al olvido)</h2>
          <p className="text-gray-600 leading-relaxed mb-5">
            Puedes eliminar tu cuenta de LexAduana en cualquier momento. Esta acción es{' '}
            <strong>inmediata e irreversible</strong>: elimina permanentemente tus datos
            personales directamente identificativos (email, contraseña) y pseudonimiza el
            resto de registros operativos asociados a tu cuenta para conservar la evidencia
            legal exigida por el RGPD durante los plazos legalmente aplicables, sin que
            puedan ya vincularse a tu persona.
          </p>
          <DeleteAccountButton />
        </section>
      </div>
    </div>
  )
}
