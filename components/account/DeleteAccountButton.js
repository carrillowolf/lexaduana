'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DeleteAccountButton() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  async function handleDelete() {
    const firstConfirm = window.confirm(
      '¿Seguro que quieres eliminar tu cuenta?\n\n' +
      'Esta acción es IRREVERSIBLE. Tus datos personales se anonimizarán ' +
      'y dejarás de tener acceso a LexAduana inmediatamente.'
    )
    if (!firstConfirm) return

    const secondConfirm = window.confirm(
      'Última oportunidad.\n\n' +
      '¿Confirmas DEFINITIVAMENTE que quieres eliminar tu cuenta?'
    )
    if (!secondConfirm) return

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: true }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(data.error || 'Error eliminando la cuenta')
        setSubmitting(false)
        return
      }

      // Éxito: la sesión queda invalidada porque el usuario ya no existe.
      router.push('/')
      router.refresh()
    } catch {
      setError('Error de red. Intenta de nuevo.')
      setSubmitting(false)
    }
  }

  return (
    <div className="border border-red-200 bg-red-50 rounded-2xl p-4">
      <h3 className="font-semibold text-red-900 mb-1">Zona peligrosa</h3>
      <p className="text-sm text-red-700 mb-3">
        Eliminar tu cuenta es una acción irreversible. Tus datos personales
        serán anonimizados según los plazos legales de retención y dejarás de
        tener acceso a LexAduana inmediatamente.
      </p>
      <button
        type="button"
        onClick={handleDelete}
        disabled={submitting}
        className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors"
      >
        {submitting ? 'Eliminando…' : 'Eliminar mi cuenta'}
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-700 font-medium">⚠ {error}</p>
      )}
    </div>
  )
}
