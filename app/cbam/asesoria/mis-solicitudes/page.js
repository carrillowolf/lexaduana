'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import AdvisoryStatusBadge from '@/components/cbam/advisory/AdvisoryStatusBadge'

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatCurrency(value) {
  if (value == null) return '—'
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(value)
}

export default function MisSolicitudesPage() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/cbam/advisory')
        if (res.status === 401) {
          setError('Debes iniciar sesión para ver tus solicitudes.')
          setLoading(false)
          return
        }
        const json = await res.json()
        if (!res.ok) throw new Error(json.error)
        setRequests(json.data || [])
      } catch (err) {
        setError(err.message || 'Error al cargar solicitudes')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function handleDelete(id) {
    if (!confirm('¿Eliminar este borrador? Esta acción no se puede deshacer.')) return
    try {
      const res = await fetch(`/api/cbam/advisory/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error)
      }
      setRequests(requests.filter(r => r.id !== id))
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#0A3D5C]">Mis solicitudes</h1>
            <p className="text-sm text-gray-600 mt-1">Historial de tus solicitudes de asesoría CBAM.</p>
          </div>
          <Link
            href="/cbam/asesoria/solicitud"
            className="px-4 py-2.5 bg-[#0A3D5C] text-white rounded-lg text-sm font-medium hover:bg-[#0d5078] transition-colors"
          >
            Nueva solicitud
          </Link>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-16">
            <div className="inline-block w-6 h-6 border-2 border-[#0A3D5C] border-t-transparent rounded-full animate-spin" />
            <p className="mt-3 text-sm text-gray-500">Cargando solicitudes...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && requests.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <div className="text-4xl mb-3">📋</div>
            <p className="font-medium text-gray-700 mb-1">No tienes solicitudes todavía</p>
            <p className="text-sm text-gray-500 mb-4">
              Solicita tu primera asesoría CBAM profesional.
            </p>
            <Link
              href="/cbam/asesoria/solicitud"
              className="inline-block px-4 py-2 bg-[#0A3D5C] text-white rounded-lg text-sm font-medium hover:bg-[#0d5078] transition-colors"
            >
              Crear solicitud
            </Link>
          </div>
        )}

        {/* Lista */}
        {!loading && requests.length > 0 && (
          <div className="space-y-3">
            {requests.map((r) => (
              <div
                key={r.id}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">{r.companyName}</h3>
                      <AdvisoryStatusBadge status={r.status} />
                    </div>
                    <p className="text-sm text-gray-500">
                      {r.contactName} &middot; Creada {formatDate(r.createdAt)}
                      {r.submittedAt && ` &middot; Enviada ${formatDate(r.submittedAt)}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    {r.totalEstimatedCost != null && (
                      <span className="text-lg font-bold text-[#0A3D5C]">
                        {formatCurrency(r.totalEstimatedCost)}
                      </span>
                    )}

                    {r.status === 'draft' && (
                      <>
                        <Link
                          href="/cbam/asesoria/solicitud"
                          className="text-sm text-[#0A3D5C] hover:underline font-medium"
                        >
                          Continuar
                        </Link>
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="text-sm text-red-500 hover:text-red-700"
                        >
                          Eliminar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
