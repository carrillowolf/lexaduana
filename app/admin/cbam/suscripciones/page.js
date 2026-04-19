'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// TECH DEBT (ver lib/cbamAdminAuth.js): esta allowlist hardcoded debe mover
// a NEXT_PUBLIC_ADMIN_EMAILS o helper compartido. Mientras tanto se mantiene
// aquí por consistencia con /admin/cbam/asesoria/page.js.
const ADMIN_EMAILS = ['ccarrillodelolmo@gmail.com']

const STATUS_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'submitted', label: 'Enviada' },
  { value: 'authorized', label: 'Autorizada' },
  { value: 'active', label: 'Activa' },
  { value: 'paused', label: 'Pausada' },
  { value: 'cancelled', label: 'Cancelada' },
]

const STATUS_BADGE = {
  submitted: { label: 'Enviada', bg: 'bg-blue-50', text: 'text-blue-700' },
  authorized: { label: 'Autorizada', bg: 'bg-amber-50', text: 'text-amber-700' },
  active: { label: 'Activa', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  paused: { label: 'Pausada', bg: 'bg-gray-100', text: 'text-gray-600' },
  cancelled: { label: 'Cancelada', bg: 'bg-red-50', text: 'text-red-700' },
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function AdminCbamSuscripcionesPage() {
  const supabase = createClientComponentClient()
  const router = useRouter()

  const [authChecked, setAuthChecked] = useState(false)
  const [subs, setSubs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/auth/login')
      if (!ADMIN_EMAILS.includes(user.email)) return router.push('/dashboard')
      setAuthChecked(true)
    }
    check()
  }, [supabase, router])

  useEffect(() => {
    if (!authChecked) return
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        if (statusFilter) params.set('status', statusFilter)
        if (search) params.set('search', search)
        const res = await fetch(`/api/admin/cbam/suscripciones?${params}`)
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Error al cargar')
        setSubs(json.data || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    const t = setTimeout(load, search ? 300 : 0)
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Link href="/admin/cbam" className="hover:text-[#0A3D5C]">Admin CBAM</Link>
              <span>/</span>
              <span>Suscripciones</span>
            </div>
            <h1 className="text-2xl font-bold text-[#0A3D5C]">Suscripciones de Monitorización</h1>
            <p className="text-sm text-gray-600 mt-1">
              Gestión manual de suscripciones recurrentes (199 €/mes).
            </p>
          </div>
          <Link href="/admin/cbam" className="text-sm text-gray-600 hover:text-[#0A3D5C]">
            ← Volver al panel
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap items-center gap-3">
          <label htmlFor="sub-search" className="sr-only">Buscar por empresa</label>
          <input
            id="sub-search"
            type="text"
            placeholder="Buscar por empresa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[240px] px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0A3D5C]/20 focus:border-[#0A3D5C] outline-none"
          />
          <label htmlFor="sub-status" className="sr-only">Filtrar por estado</label>
          <select
            id="sub-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0A3D5C]/20 focus:border-[#0A3D5C] outline-none"
          >
            {STATUS_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <span className="text-sm text-gray-500 ml-auto">
            {loading ? 'Cargando...' : `${subs.length} suscripci${subs.length !== 1 ? 'ones' : 'ón'}`}
          </span>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 mb-4">{error}</div>
        )}

        {loading && (
          <div className="text-center py-16">
            <div className="inline-block w-6 h-6 border-2 border-[#0A3D5C] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && !error && subs.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <div className="text-4xl mb-3">📊</div>
            <p className="font-medium text-gray-700">No hay suscripciones</p>
            <p className="text-sm text-gray-500 mt-1">No se encontraron suscripciones con los filtros actuales.</p>
          </div>
        )}

        {!loading && !error && subs.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <th className="px-4 py-3">Empresa</th>
                    <th className="px-4 py-3">Contacto</th>
                    <th className="px-4 py-3">Fecha solicitud</th>
                    <th className="px-4 py-3">Volumen mensual</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {subs.map((s) => {
                    const badge = STATUS_BADGE[s.status] || STATUS_BADGE.submitted
                    return (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{s.companyName}</div>
                          <div className="text-xs text-gray-500 font-mono">{s.companyCif || '—'}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          <div>{s.contactName}</div>
                          <div className="text-xs text-gray-500">{s.contactEmail}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{formatDate(s.createdAt)}</td>
                        <td className="px-4 py-3 text-gray-700">{s.expectedMonthlyVolume || '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/admin/cbam/suscripciones/${s.id}`}
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
