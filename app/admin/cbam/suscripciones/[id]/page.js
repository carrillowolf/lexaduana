'use client'

/**
 * Admin detalle suscripción Monitorización — Día 5, Pieza 2 (Opción C).
 *
 * Vista única scrollable (sin tabs elaboradas como en Advisory). Incluye:
 *   - Stepper pre-entrega con 5 pasos.
 *   - Datos empresa/contacto/perfil de importación (lectura).
 *   - Estado con select para cambiar (submitted → authorized → active → paused / cancelled).
 *   - Notas internas del admin (textarea).
 */

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import AdminChecklistStepper from '@/components/cbam/admin/AdminChecklistStepper'

// TECH DEBT (ver lib/cbamAdminAuth.js): allowlist hardcoded pendiente de refactor.
const ADMIN_EMAILS = ['ccarrillodelolmo@gmail.com']

const STATUS_FLOW = ['submitted', 'authorized', 'active', 'paused', 'cancelled']
const STATUS_LABELS = {
  submitted: 'Enviada',
  authorized: 'Autorizada',
  active: 'Activa',
  paused: 'Pausada',
  cancelled: 'Cancelada',
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default function AdminSuscripcionDetailPage({ params }) {
  const { id } = use(params)
  const supabase = createClientComponentClient()
  const router = useRouter()

  const [authChecked, setAuthChecked] = useState(false)
  const [sub, setSub] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)
  const [status, setStatus] = useState('')
  const [adminNotes, setAdminNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/auth/login')
      if (!ADMIN_EMAILS.includes(user.email)) return router.push('/dashboard')
      setAuthChecked(true)
    }
    check()
  }, [supabase, router])

  const reload = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/cbam/suscripciones/${id}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al cargar')
      setSub(json.data)
      setStatus(json.data.status)
      setAdminNotes(json.data.adminNotes || '')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (authChecked) reload() }, [authChecked, id]) // eslint-disable-line

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/cbam/suscripciones/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminNotes }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al guardar')
      showToast('Cambios guardados')
      setSub(json.data)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  if (!authChecked || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-[#0A3D5C] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !sub) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="max-w-5xl mx-auto px-4 py-12">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
            {error || 'Suscripción no encontrada'}
          </div>
          <Link href="/admin/cbam/suscripciones" className="mt-4 inline-block text-sm text-[#0A3D5C] hover:underline">
            ← Volver al listado
          </Link>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Link href="/admin/cbam" className="hover:text-[#0A3D5C]">Admin CBAM</Link>
              <span>/</span>
              <Link href="/admin/cbam/suscripciones" className="hover:text-[#0A3D5C]">Suscripciones</Link>
              <span>/</span>
              <span className="font-mono">{sub.id.slice(0, 8)}</span>
            </div>
            <h1 className="text-2xl font-bold text-[#0A3D5C]">{sub.companyName}</h1>
            <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
              <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
                {STATUS_LABELS[sub.status] || sub.status}
              </span>
              <span>·</span>
              <span>Creada {formatDate(sub.createdAt)}</span>
            </div>
          </div>
          <Link href="/admin/cbam/suscripciones" className="text-sm text-gray-600 hover:text-[#0A3D5C] whitespace-nowrap">
            ← Volver
          </Link>
        </div>

        {/* Checklist pre-entrega */}
        <AdminChecklistStepper
          kind="monitoring"
          status={sub.status}
          checklist={sub.adminChecklist}
          endpoint={`/api/admin/cbam/suscripciones/${sub.id}/checklist`}
          onChange={reload}
        />

        {toast && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${
            toast.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
            'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}>
            {toast.msg}
          </div>
        )}

        {/* Datos empresa */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Datos de empresa</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <Readonly label="Razón social" value={sub.companyLegalName || sub.companyName} />
            <Readonly label="CIF / NIF" value={sub.companyCif} mono />
            <Readonly label="Contacto" value={sub.contactName} />
            <Readonly label="Email" value={sub.contactEmail} />
            <Readonly label="Teléfono" value={sub.contactPhone} />
            <Readonly label="Volumen mensual esperado" value={sub.expectedMonthlyVolume} />
          </div>
        </div>

        {/* Perfil importación */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Perfil de importación</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs text-gray-500 mb-1">Productos CBAM habituales</div>
              <div className="text-gray-800">
                {sub.mainCbamProducts?.length
                  ? sub.mainCbamProducts.join(', ')
                  : <span className="text-gray-400">—</span>}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Países origen</div>
              <div className="text-gray-800">
                {sub.mainOriginCountries?.length
                  ? sub.mainOriginCountries.join(', ')
                  : <span className="text-gray-400">—</span>}
              </div>
            </div>
            {sub.clientNotes && (
              <div className="md:col-span-2">
                <div className="text-xs text-gray-500 mb-1">Notas del cliente</div>
                <div className="bg-gray-50 p-3 rounded-lg text-gray-700 whitespace-pre-wrap">{sub.clientNotes}</div>
              </div>
            )}
          </div>
        </div>

        {/* Autorización DUAs */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Autorización DUAs</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <Readonly label="Aceptado el" value={formatDate(sub.duaAuthorizationAcceptedAt)} />
            <Readonly label="Versión del texto" value={sub.duaAuthorizationTextVersion} mono />
            <Readonly label="Confirmado en admin" value={sub.authorizedAt ? formatDate(sub.authorizedAt) : 'Pendiente'} />
          </div>
        </div>

        {/* Timeline operativo */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Timeline</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <Readonly label="Autorizada" value={formatDate(sub.authorizedAt)} />
            <Readonly label="Activada" value={formatDate(sub.startedAt)} />
            <Readonly label="Pausada" value={formatDate(sub.pausedAt)} />
            <Readonly label="Cancelada" value={formatDate(sub.cancelledAt)} />
          </div>
        </div>

        {/* Estado + notas admin */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Gestión admin</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="sub-estado" className="block text-xs font-medium text-gray-600 mb-1">Estado</label>
              <select
                id="sub-estado"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0A3D5C]/20 focus:border-[#0A3D5C] outline-none"
              >
                {STATUS_FLOW.map(s => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label htmlFor="sub-admin-notes" className="block text-xs font-medium text-gray-600 mb-1">Notas internas</label>
            <textarea
              id="sub-admin-notes"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0A3D5C]/20 focus:border-[#0A3D5C] outline-none"
            />
          </div>
          <div className="flex justify-end pt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 bg-[#0A3D5C] text-white rounded-lg text-sm font-medium hover:bg-[#082d44] disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

function Readonly({ label, value, mono = false }) {
  return (
    <div>
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className={`text-gray-800 ${mono ? 'font-mono' : ''}`}>
        {value ?? <span className="text-gray-400">—</span>}
      </div>
    </div>
  )
}
