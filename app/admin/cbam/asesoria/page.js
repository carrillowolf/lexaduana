'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import AdvisoryStatusBadge from '@/components/cbam/advisory/AdvisoryStatusBadge'

const ADMIN_EMAILS = ['ccarrillodelolmo@gmail.com']

const STATUS_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'draft', label: 'Borrador' },
  { value: 'intake_complete', label: 'Enviada' },
  { value: 'reviewing', label: 'En revisión' },
  { value: 'report_ready', label: 'Informe listo' },
  { value: 'pending_payment', label: 'Pendiente pago' },
  { value: 'paid', label: 'Pagado' },
  { value: 'delivered', label: 'Entregado' },
  { value: 'cancelled', label: 'Cancelada' },
]

const PAYMENT_BADGE = {
  unpaid: { label: 'Sin facturar', bg: 'bg-gray-100', text: 'text-gray-600' },
  invoiced: { label: 'Facturado', bg: 'bg-amber-50', text: 'text-amber-700' },
  paid: { label: 'Pagado', bg: 'bg-emerald-50', text: 'text-emerald-700' },
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatNum(n, decimals = 1) {
  if (n == null) return '—'
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n)
}

export default function AdminCbamAsesoriaPage() {
  const supabase = createClientComponentClient()
  const router = useRouter()

  const [authChecked, setAuthChecked] = useState(false)
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')

  // Auth check
  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      if (!ADMIN_EMAILS.includes(user.email)) {
        router.push('/dashboard')
        return
      }
      setAuthChecked(true)
    }
    check()
  }, [supabase, router])

  // Cargar listado
  useEffect(() => {
    if (!authChecked) return
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        if (statusFilter) params.set('status', statusFilter)
        if (search) params.set('search', search)

        const res = await fetch(`/api/admin/cbam/asesoria?${params}`)
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Error al cargar')
        setRequests(json.data || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    const t = setTimeout(load, search ? 300 : 0) // debounce búsqueda
    return () => clearTimeout(t)
  }, [authChecked, statusFilter, search])

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-[#0A3D5C] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Link href="/admin/cbam" className="hover:text-[#0A3D5C]">Admin CBAM</Link>
              <span>/</span>
              <span>Asesorías</span>
            </div>
            <h1 className="text-2xl font-bold text-[#0A3D5C]">Solicitudes de asesoría CBAM</h1>
            <p className="text-sm text-gray-600 mt-1">
              Panel de gestión de solicitudes de asesoría premium.
            </p>
          </div>
          <Link
            href="/admin/cbam"
            className="text-sm text-gray-600 hover:text-[#0A3D5C]"
          >
            ← Volver al panel
          </Link>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Buscar por empresa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[240px] px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0A3D5C]/20 focus:border-[#0A3D5C] outline-none"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0A3D5C]/20 focus:border-[#0A3D5C] outline-none"
          >
            {STATUS_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <span className="text-sm text-gray-500 ml-auto">
            {loading ? 'Cargando...' : `${requests.length} solicitud${requests.length !== 1 ? 'es' : ''}`}
          </span>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 mb-4">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-16">
            <div className="inline-block w-6 h-6 border-2 border-[#0A3D5C] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Empty */}
        {!loading && !error && requests.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <div className="text-4xl mb-3">📋</div>
            <p className="font-medium text-gray-700">No hay solicitudes</p>
            <p className="text-sm text-gray-500 mt-1">No se encontraron solicitudes con los filtros actuales.</p>
          </div>
        )}

        {/* Tabla */}
        {!loading && !error && requests.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <th className="px-4 py-3">Ref</th>
                    <th className="px-4 py-3">Empresa</th>
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3 text-right">Líneas</th>
                    <th className="px-4 py-3 text-right">Toneladas</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">Pago</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {requests.map((r) => {
                    const pmt = PAYMENT_BADGE[r.paymentStatus] || PAYMENT_BADGE.unpaid
                    return (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-xs text-gray-600">
                          {r.reportRef || '—'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{r.companyName}</div>
                          <div className="text-xs text-gray-500">{r.contactName}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {formatDate(r.submittedAt || r.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-700">
                          {r.productsCount || 0}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-700">
                          {formatNum(r.totalTonnesAggregated, 1)} t
                        </td>
                        <td className="px-4 py-3">
                          <AdvisoryStatusBadge status={r.status} />
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${pmt.bg} ${pmt.text}`}>
                            {pmt.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/admin/cbam/asesoria/${r.id}`}
                            className="text-[#0A3D5C] hover:underline text-sm font-medium"
                          >
                            Ver →
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
