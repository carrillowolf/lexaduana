'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import AdvisoryStatusBadge from '@/components/cbam/advisory/AdvisoryStatusBadge'
import AdminChecklistStepper from '@/components/cbam/admin/AdminChecklistStepper'

const ADMIN_EMAILS = ['ccarrillodelolmo@gmail.com']

const TABS = [
  { id: 'client', label: 'Cliente' },
  { id: 'products', label: 'Productos' },
  { id: 'documents', label: 'Documentos' },
  { id: 'calc', label: 'Cálculos' },
  { id: 'report', label: 'Informe y Entrega' },
]

const STATUS_FLOW = [
  'draft',
  'intake_complete',
  'reviewing',
  'report_ready',
  'pending_payment',
  'paid',
  'delivered',
  'cancelled',
]

const STATUS_LABELS = {
  draft: 'Borrador',
  intake_complete: 'Enviada',
  reviewing: 'En revisión',
  report_ready: 'Informe listo',
  pending_payment: 'Pendiente pago',
  paid: 'Pagado',
  delivered: 'Entregado',
  cancelled: 'Cancelada',
}

const PAYMENT_OPTIONS = [
  { value: 'unpaid', label: 'Sin facturar' },
  { value: 'invoiced', label: 'Facturado' },
  { value: 'paid', label: 'Pagado' },
]

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function fmtNum(n, decimals = 2) {
  if (n == null || isNaN(n)) return '—'
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n)
}

export default function AdminAsesoriaDetailPage({ params }) {
  const { id } = use(params)
  const supabase = createClientComponentClient()
  const router = useRouter()

  const [authChecked, setAuthChecked] = useState(false)
  const [advisory, setAdvisory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('client')
  const [toast, setToast] = useState(null)

  // Auth
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
      const res = await fetch(`/api/admin/cbam/asesoria/${id}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al cargar')
      setAdvisory(json.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (authChecked) reload()
  }, [authChecked, id])

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  if (!authChecked || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-[#0A3D5C] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !advisory) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="max-w-5xl mx-auto px-4 py-12">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
            {error || 'Solicitud no encontrada'}
          </div>
          <Link href="/admin/cbam/asesoria" className="mt-4 inline-block text-sm text-[#0A3D5C] hover:underline">
            ← Volver al listado
          </Link>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Link href="/admin/cbam" className="hover:text-[#0A3D5C]">Admin CBAM</Link>
              <span>/</span>
              <Link href="/admin/cbam/asesoria" className="hover:text-[#0A3D5C]">Asesorías</Link>
              <span>/</span>
              <span className="font-mono">{advisory.reportRef || advisory.id.slice(0, 8)}</span>
            </div>
            <h1 className="text-2xl font-bold text-[#0A3D5C]">{advisory.companyName}</h1>
            <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
              <AdvisoryStatusBadge status={advisory.status} />
              <span>·</span>
              <span>Creada {formatDate(advisory.createdAt)}</span>
              {advisory.submittedAt && (
                <>
                  <span>·</span>
                  <span>Enviada {formatDate(advisory.submittedAt)}</span>
                </>
              )}
            </div>
          </div>
          <Link
            href="/admin/cbam/asesoria"
            className="text-sm text-gray-600 hover:text-[#0A3D5C] whitespace-nowrap"
          >
            ← Volver
          </Link>
        </div>

        {/* Checklist pre-entrega */}
        <AdminChecklistStepper
          kind="advisory"
          status={advisory.status}
          checklist={advisory.adminChecklist}
          endpoint={`/api/admin/cbam/asesoria/${advisory.id}/checklist`}
          onChange={reload}
        />

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === t.id
                  ? 'border-[#0A3D5C] text-[#0A3D5C]'
                  : 'border-transparent text-gray-500 hover:text-[#0A3D5C]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Toast */}
        {toast && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${
            toast.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
            'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}>
            {toast.msg}
          </div>
        )}

        {/* Content */}
        {activeTab === 'client' && (
          <ClientTab advisory={advisory} onSaved={reload} showToast={showToast} />
        )}
        {activeTab === 'products' && (
          <ProductsTab advisory={advisory} onChange={reload} showToast={showToast} />
        )}
        {activeTab === 'documents' && (
          <DocumentsTab advisory={advisory} showToast={showToast} />
        )}
        {activeTab === 'calc' && (
          <CalcTab advisory={advisory} onCalculated={reload} showToast={showToast} />
        )}
        {activeTab === 'report' && (
          <ReportTab advisory={advisory} onChange={reload} showToast={showToast} />
        )}
      </main>
    </div>
  )
}

// ============================================================
// TAB: CLIENTE
// ============================================================
function ClientTab({ advisory, onSaved, showToast }) {
  const [form, setForm] = useState({
    companyName: advisory.companyName || '',
    companyCif: advisory.companyCif || '',
    companyEori: advisory.companyEori || '',
    contactName: advisory.contactName || '',
    contactEmail: advisory.contactEmail || '',
    contactPhone: advisory.contactPhone || '',
    status: advisory.status,
    internalNotes: advisory.internalNotes || '',
  })
  const [saving, setSaving] = useState(false)

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/cbam/asesoria/${advisory.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al guardar')
      showToast('Cambios guardados')
      onSaved()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Datos de empresa</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Empresa" value={form.companyName} onChange={v => update('companyName', v)} />
          <Field label="CIF / NIF" value={form.companyCif} onChange={v => update('companyCif', v)} />
          <Field label="EORI" value={form.companyEori} onChange={v => update('companyEori', v)} />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Contacto</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Nombre" value={form.contactName} onChange={v => update('contactName', v)} />
          <Field label="Email" value={form.contactEmail} onChange={v => update('contactEmail', v)} />
          <Field label="Teléfono" value={form.contactPhone} onChange={v => update('contactPhone', v)} />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Estado de la solicitud</h3>
        <select
          value={form.status}
          onChange={(e) => update('status', e.target.value)}
          className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0A3D5C]/20 focus:border-[#0A3D5C] outline-none"
        >
          {STATUS_FLOW.map(s => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Notas internas (no visibles al cliente)</h3>
        <textarea
          value={form.internalNotes}
          onChange={(e) => update('internalNotes', e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0A3D5C]/20 focus:border-[#0A3D5C] outline-none"
        />
      </div>

      {advisory.clientNotes && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Notas del cliente</h3>
          <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700 whitespace-pre-wrap">
            {advisory.clientNotes}
          </div>
        </div>
      )}

      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 bg-[#0A3D5C] text-white rounded-lg text-sm font-medium hover:bg-[#082d44] disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0A3D5C]/20 focus:border-[#0A3D5C] outline-none"
      />
    </div>
  )
}

// ============================================================
// TAB: PRODUCTOS
// ============================================================
function ProductsTab({ advisory, onChange, showToast }) {
  const [editingId, setEditingId] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const products = advisory.products || []

  const handleDelete = async (productId) => {
    if (!confirm('¿Eliminar esta línea de producto?')) return
    try {
      const res = await fetch(
        `/api/admin/cbam/asesoria/${advisory.id}/products?productId=${productId}`,
        { method: 'DELETE' }
      )
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al eliminar')
      showToast('Producto eliminado')
      onChange()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">{products.length} producto{products.length !== 1 ? 's' : ''}</p>
        <button
          onClick={() => setShowAdd(true)}
          className="px-4 py-2 bg-[#0A3D5C] text-white rounded-lg text-sm font-medium hover:bg-[#082d44]"
        >
          + Añadir línea
        </button>
      </div>

      {showAdd && (
        <ProductForm
          requestId={advisory.id}
          onSaved={() => { setShowAdd(false); onChange() }}
          onCancel={() => setShowAdd(false)}
          showToast={showToast}
        />
      )}

      {products.length === 0 && !showAdd && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-sm text-gray-500">
          No hay productos en esta solicitud.
        </div>
      )}

      <div className="space-y-3">
        {products.map(p => (
          <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-4">
            {editingId === p.id ? (
              <ProductForm
                requestId={advisory.id}
                product={p}
                onSaved={() => { setEditingId(null); onChange() }}
                onCancel={() => setEditingId(null)}
                showToast={showToast}
              />
            ) : (
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{p.productDescription || '—'}</div>
                  <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-x-3">
                    <span>CN: <span className="font-mono">{p.cnCode || '—'}</span></span>
                    <span>{p.countryCode || '—'}</span>
                    <span>{fmtNum(p.annualTonnes, 1)} t/año</span>
                    {p.supplierName && <span>· {p.supplierName}</span>}
                  </div>
                  {p.totalEmissions != null && (
                    <div className="mt-2 text-xs text-gray-600">
                      Emisiones: <strong>{fmtNum(p.totalEmissions, 2)} tCO₂</strong>
                      {' · '}
                      Coste: <strong>€{fmtNum(p.totalCost, 0)}</strong>
                      {p.emissionSource && (
                        <span className="ml-2 px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 uppercase text-[10px]">
                          {p.emissionSource}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingId(p.id)}
                    className="text-xs text-[#0A3D5C] hover:underline"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function ProductForm({ requestId, product, onSaved, onCancel, showToast }) {
  const [form, setForm] = useState({
    productDescription: product?.productDescription || '',
    cnCode: product?.cnCode || '',
    countryCode: product?.countryCode || '',
    countryName: product?.countryName || '',
    annualTonnes: product?.annualTonnes || '',
    supplierName: product?.supplierName || '',
    supplierInstallationName: product?.supplierInstallationName || '',
    hasRealEmissions: product?.hasRealEmissions || false,
    emissionFactorReal: product?.emissionFactorReal || '',
  })
  const [saving, setSaving] = useState(false)

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        ...form,
        annualTonnes: parseFloat(form.annualTonnes) || 0,
        emissionFactorReal: form.emissionFactorReal ? parseFloat(form.emissionFactorReal) : null,
      }
      const res = await fetch(`/api/admin/cbam/asesoria/${requestId}/products`, {
        method: product ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product ? { productId: product.id, ...payload } : payload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al guardar')
      showToast(product ? 'Producto actualizado' : 'Producto añadido')
      onSaved()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Descripción" value={form.productDescription} onChange={v => update('productDescription', v)} />
        <Field label="Código CN" value={form.cnCode} onChange={v => update('cnCode', v)} />
        <Field label="País origen (ISO)" value={form.countryCode} onChange={v => update('countryCode', v)} />
        <Field label="País origen (nombre)" value={form.countryName} onChange={v => update('countryName', v)} />
        <Field label="Toneladas/año" value={form.annualTonnes} onChange={v => update('annualTonnes', v)} type="number" />
        <Field label="Proveedor" value={form.supplierName} onChange={v => update('supplierName', v)} />
        <Field label="Instalación proveedor" value={form.supplierInstallationName} onChange={v => update('supplierInstallationName', v)} />
        <Field label="EF real (tCO₂/t)" value={form.emissionFactorReal} onChange={v => update('emissionFactorReal', v)} type="number" />
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={form.hasRealEmissions}
          onChange={(e) => update('hasRealEmissions', e.target.checked)}
        />
        Tiene emisiones reales del proveedor
      </label>
      <div className="flex justify-end gap-2 pt-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-[#0A3D5C] text-white rounded-lg text-sm font-medium hover:bg-[#082d44] disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </div>
  )
}

// ============================================================
// TAB: DOCUMENTOS
// ============================================================
function DocumentsTab({ advisory, showToast }) {
  const docs = advisory.documents || []

  const handleDownload = async (docId) => {
    try {
      const res = await fetch(`/api/admin/cbam/asesoria/${advisory.id}/documents/${docId}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al descargar')
      window.open(json.url, '_blank')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  if (docs.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-sm text-gray-500">
        El cliente no ha subido documentos.
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
      {docs.map(doc => (
        <div key={doc.id} className="flex items-center justify-between p-4">
          <div>
            <div className="font-medium text-gray-900 text-sm">{doc.fileName}</div>
            <div className="text-xs text-gray-500 mt-0.5">
              {doc.fileType} · {(doc.fileSize / 1024).toFixed(1)} KB · {formatDate(doc.uploadedAt)}
            </div>
            {doc.notes && <div className="text-xs text-gray-600 mt-1 italic">{doc.notes}</div>}
          </div>
          <button
            onClick={() => handleDownload(doc.id)}
            className="text-sm text-[#0A3D5C] hover:underline font-medium"
          >
            Descargar →
          </button>
        </div>
      ))}
    </div>
  )
}

// ============================================================
// TAB: CÁLCULOS
// ============================================================
function CalcTab({ advisory, onCalculated, showToast }) {
  const [calculating, setCalculating] = useState(false)

  const handleCalculate = async () => {
    if (!confirm('¿Ejecutar el motor de cálculo? Sobrescribirá los valores actuales.')) return
    setCalculating(true)
    try {
      const res = await fetch(`/api/admin/cbam/asesoria/${advisory.id}/calculate`, {
        method: 'POST',
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error en el cálculo')
      showToast('Cálculo completado')
      onCalculated()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setCalculating(false)
    }
  }

  const totalTonnes = (advisory.products || []).reduce((s, p) => s + (parseFloat(p.annualTonnes) || 0), 0)
  const totalEmissions = (advisory.products || []).reduce((s, p) => s + (parseFloat(p.totalEmissions) || 0), 0)
  const totalCost = (advisory.products || []).reduce((s, p) => s + (parseFloat(p.totalCost) || 0), 0)

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-semibold text-gray-900">Motor de cálculo CBAM</h3>
            <p className="text-sm text-gray-600 mt-1">
              Detecta sectores, aplica benchmarks y precio EU ETS, calcula emisiones y coste por línea.
            </p>
          </div>
          <button
            onClick={handleCalculate}
            disabled={calculating || (advisory.products || []).length === 0}
            className="px-5 py-2 bg-[#0A3D5C] text-white rounded-lg text-sm font-medium hover:bg-[#082d44] disabled:opacity-50 whitespace-nowrap"
          >
            {calculating ? 'Calculando...' : 'Ejecutar cálculo'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatBox label="Toneladas totales" value={`${fmtNum(totalTonnes, 1)} t`} />
        <StatBox label="Emisiones totales" value={`${fmtNum(totalEmissions, 2)} tCO₂`} />
        <StatBox label="Coste estimado" value={`€${fmtNum(totalCost, 0)}`} />
      </div>

      {advisory.exceedsDeMinimis !== null && (
        <div className={`p-4 rounded-xl text-sm ${
          advisory.exceedsDeMinimis
            ? 'bg-amber-50 border border-amber-200 text-amber-800'
            : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
        }`}>
          {advisory.exceedsDeMinimis
            ? 'La solicitud supera el umbral de minimis (50 t/año) — sujeta a CBAM.'
            : 'La solicitud está por debajo del umbral de minimis (50 t/año) — exenta.'}
        </div>
      )}

      {advisory.co2PriceUsed && (
        <p className="text-xs text-gray-500">
          Precio CO₂ aplicado: €{fmtNum(advisory.co2PriceUsed, 2)}/tCO₂ · Año cálculo: {advisory.calculationYear || '—'}
        </p>
      )}
    </div>
  )
}

function StatBox({ label, value }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-xl font-bold text-[#0A3D5C] mt-1">{value}</div>
    </div>
  )
}

// ============================================================
// TAB: INFORME Y ENTREGA
// ============================================================
function ReportTab({ advisory, onChange, showToast }) {
  const [report, setReport] = useState(null)
  const [loadingReport, setLoadingReport] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [releasing, setReleasing] = useState(false)
  const [invoiceRef, setInvoiceRef] = useState(advisory.invoiceRef || '')
  const [showPaymentRequest, setShowPaymentRequest] = useState(false)

  useEffect(() => {
    loadReport()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [advisory.id, advisory.reportGeneratedAt])

  async function loadReport() {
    setLoadingReport(true)
    try {
      const res = await fetch(`/api/admin/cbam/asesoria/${advisory.id}/report`)
      const json = await res.json()
      if (res.ok) setReport(json.data?.current || null)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingReport(false)
    }
  }

  const handleGenerate = async () => {
    if ((advisory.products || []).length === 0) {
      showToast('No hay productos para generar informe', 'error')
      return
    }
    if (!confirm('¿Generar el PDF del informe? Se creará una nueva versión.')) return
    setGenerating(true)
    try {
      const res = await fetch(`/api/admin/cbam/asesoria/${advisory.id}/generate-report`, {
        method: 'POST',
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al generar')
      showToast('Informe generado')
      onChange()
      loadReport()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setGenerating(false)
    }
  }

  const updatePayment = async (paymentStatus) => {
    setUpdating(true)
    try {
      const body = { paymentStatus }
      if (invoiceRef) body.invoiceRef = invoiceRef
      // Cuando se marca facturado, mover status a pending_payment si está en report_ready
      if (paymentStatus === 'invoiced' && advisory.status === 'report_ready') {
        body.status = 'pending_payment'
      }
      // Cuando se confirma pago, mover status a paid
      if (paymentStatus === 'paid' && advisory.status !== 'delivered') {
        body.status = 'paid'
      }
      const res = await fetch(`/api/admin/cbam/asesoria/${advisory.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al actualizar')
      showToast('Estado de pago actualizado')
      onChange()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setUpdating(false)
    }
  }

  const handleRelease = async () => {
    if (!confirm('¿Liberar el informe al cliente? El cliente recibirá acceso de descarga.')) return
    setReleasing(true)
    try {
      const res = await fetch(`/api/admin/cbam/asesoria/${advisory.id}/release`, {
        method: 'POST',
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al liberar')
      showToast('Informe liberado al cliente')
      onChange()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setReleasing(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Generación PDF */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 className="font-semibold text-gray-900">1. Generar PDF del informe</h3>
            <p className="text-sm text-gray-600 mt-1">
              Construye el snapshot de cálculo y renderiza el PDF bilingüe ES+EN.
            </p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-5 py-2 bg-[#0A3D5C] text-white rounded-lg text-sm font-medium hover:bg-[#082d44] disabled:opacity-50 whitespace-nowrap"
          >
            {generating ? 'Generando...' : 'Generar PDF'}
          </button>
        </div>

        {loadingReport ? (
          <p className="text-sm text-gray-500">Cargando informe...</p>
        ) : report ? (
          <div className="bg-gray-50 rounded-lg p-4 text-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-mono font-medium text-gray-900">{report.reportRef} · v{report.version}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Generado {formatDate(report.generatedAt)} por {report.generatedBy || '—'}
                  {report.pdfSizeBytes && ` · ${(report.pdfSizeBytes / 1024).toFixed(0)} KB`}
                </div>
              </div>
              {report.signedUrl && (
                <a
                  href={report.signedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#0A3D5C] hover:underline font-medium whitespace-nowrap"
                >
                  Descargar PDF →
                </a>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic">Aún no se ha generado ningún informe.</p>
        )}
      </div>

      {/* Pago */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-1">2. Facturación y pago</h3>
        <p className="text-sm text-gray-600 mb-4">
          Estado actual: <strong>{PAYMENT_OPTIONS.find(o => o.value === advisory.paymentStatus)?.label || 'Sin facturar'}</strong>
          {advisory.paymentDate && ` · Pagado ${formatDate(advisory.paymentDate)}`}
        </p>

        {/* Bloque solicitud de pago profesional (visible en report_ready) */}
        {advisory.status === 'report_ready' && !advisory.paymentRequestSentAt && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="text-sm font-medium text-[#0A3D5C]">Solicitud de pago profesional</div>
                <p className="text-xs text-gray-600 mt-0.5">
                  Envía al cliente un email bilingüe con los datos para pagar por transferencia.
                  Al confirmar, el estado pasa a <strong>Pendiente pago</strong>.
                </p>
              </div>
              <button
                onClick={() => setShowPaymentRequest(true)}
                data-testid="open-payment-request"
                className="px-4 py-2 bg-[#0A3D5C] text-white rounded-lg text-sm font-medium hover:bg-[#082d44] whitespace-nowrap"
              >
                Enviar solicitud de pago
              </button>
            </div>
          </div>
        )}

        {advisory.paymentRequestSentAt && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800">
            ✓ Solicitud de pago enviada el {formatDate(advisory.paymentRequestSentAt)}
            {advisory.paymentRequestReference && (
              <> · Ref. <span className="font-mono">{advisory.paymentRequestReference}</span></>
            )}
            {advisory.paymentRequestAmount != null && (
              <> · €{fmtNum(advisory.paymentRequestAmount, 0)}</>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Referencia factura</label>
            <input
              type="text"
              value={invoiceRef}
              onChange={(e) => setInvoiceRef(e.target.value)}
              placeholder="Ej. FAC-2026-0123"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0A3D5C]/20 focus:border-[#0A3D5C] outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => updatePayment('invoiced')}
              disabled={updating}
              className="flex-1 px-3 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 disabled:opacity-50"
            >
              Marcar facturado
            </button>
            <button
              onClick={() => updatePayment('paid')}
              disabled={updating}
              className="flex-1 px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
            >
              Marcar pagado
            </button>
          </div>
        </div>
      </div>

      {showPaymentRequest && (
        <PaymentRequestModal
          advisory={advisory}
          onClose={() => setShowPaymentRequest(false)}
          onSent={() => { setShowPaymentRequest(false); onChange() }}
          showToast={showToast}
        />
      )}

      {/* Entrega */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-1">3. Liberar al cliente</h3>
        <p className="text-sm text-gray-600 mb-4">
          Solo posible cuando el pago está confirmado <strong>y</strong> existe un informe generado.
          Tras liberar, el cliente verá el PDF en su panel y se enviará el email de notificación.
        </p>

        {advisory.deliveredAt ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-sm text-emerald-800">
            ✓ Entregado al cliente el {formatDate(advisory.deliveredAt)}
          </div>
        ) : (
          <button
            onClick={handleRelease}
            disabled={releasing || advisory.paymentStatus !== 'paid' || !report}
            className="px-5 py-2 bg-[#0A3D5C] text-white rounded-lg text-sm font-medium hover:bg-[#082d44] disabled:opacity-50"
          >
            {releasing ? 'Liberando...' : 'Liberar informe al cliente'}
          </button>
        )}

        {!report && !advisory.deliveredAt && (
          <p className="text-xs text-amber-700 mt-2">⚠ Genera primero el PDF del informe.</p>
        )}
        {advisory.paymentStatus !== 'paid' && !advisory.deliveredAt && (
          <p className="text-xs text-amber-700 mt-1">⚠ Marca el pago como pagado antes de liberar.</p>
        )}
      </div>
    </div>
  )
}

// ============================================================
// MODAL: SOLICITUD DE PAGO (Pieza 1 — Día 5)
// ============================================================
function PaymentRequestModal({ advisory, onClose, onSent, showToast }) {
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [language, setLanguage] = useState('es')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [amount, setAmount] = useState('')
  const [reference, setReference] = useState('')
  const [bank, setBank] = useState({ iban: '', bic: '', holder: '' })
  const [bankMissing, setBankMissing] = useState(false)
  const [error, setError] = useState(null)

  // Carga el preview del backend al abrir
  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`/api/admin/cbam/asesoria/${advisory.id}/payment-request`)
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Error al cargar preview')
        if (cancelled) return
        const { preview, defaults } = json.data
        setLanguage(preview.language)
        setSubject(preview.subject)
        setBody(preview.body)
        setAmount(String(preview.amount))
        setReference(preview.reference)
        setBank(defaults.bank)
        setBankMissing(defaults.bankMissing)
      } catch (err) {
        setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [advisory.id])

  // Regenerar preview al cambiar idioma (conserva importe, referencia y banco actuales)
  const regenerate = async (nextLanguage) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/cbam/asesoria/${advisory.id}/payment-request/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: nextLanguage,
          amount: Number(amount),
          reference,
          bank,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al regenerar')
      setSubject(json.data.preview.subject)
      setBody(json.data.preview.body)
      setLanguage(nextLanguage)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async () => {
    if (!confirm('¿Enviar la solicitud de pago al cliente? El estado pasará a "Pendiente pago".')) return
    setSending(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/cbam/asesoria/${advisory.id}/payment-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language,
          subject,
          body,
          amount: Number(amount),
          reference,
          bank,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al enviar')
      showToast('Solicitud de pago enviada')
      onSent()
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h3 className="font-semibold text-gray-900">Solicitud de pago</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Revisa el contenido antes de enviar. Al confirmar, el email se envía y el estado pasa a pendiente de pago.
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl leading-none">×</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="text-center py-12 text-sm text-gray-500">Cargando preview...</div>
          ) : (
            <>
              {bankMissing && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                  ⚠ Faltan variables de entorno bancarias (LEXADUANA_BANK_IBAN / BIC / HOLDER).
                  Puedes rellenarlas manualmente abajo para este envío.
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Idioma + importe + referencia */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="pr-language" className="block text-xs font-medium text-gray-600 mb-1">Idioma</label>
                  <select
                    id="pr-language"
                    value={language}
                    onChange={(e) => regenerate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0A3D5C]/20 focus:border-[#0A3D5C] outline-none"
                  >
                    <option value="es">Español</option>
                    <option value="en">English</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="pr-amount" className="block text-xs font-medium text-gray-600 mb-1">Importe (€)</label>
                  <input
                    id="pr-amount"
                    type="number"
                    min="0"
                    step="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-[#0A3D5C]/20 focus:border-[#0A3D5C] outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="pr-reference" className="block text-xs font-medium text-gray-600 mb-1">Referencia</label>
                  <input
                    id="pr-reference"
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-[#0A3D5C]/20 focus:border-[#0A3D5C] outline-none"
                  />
                </div>
              </div>

              {/* Datos bancarios */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="pr-iban" className="block text-xs font-medium text-gray-600 mb-1">IBAN</label>
                  <input
                    id="pr-iban"
                    type="text"
                    value={bank.iban}
                    onChange={(e) => setBank({ ...bank, iban: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-[#0A3D5C]/20 focus:border-[#0A3D5C] outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="pr-bic" className="block text-xs font-medium text-gray-600 mb-1">BIC</label>
                  <input
                    id="pr-bic"
                    type="text"
                    value={bank.bic}
                    onChange={(e) => setBank({ ...bank, bic: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-[#0A3D5C]/20 focus:border-[#0A3D5C] outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="pr-holder" className="block text-xs font-medium text-gray-600 mb-1">Titular</label>
                  <input
                    id="pr-holder"
                    type="text"
                    value={bank.holder}
                    onChange={(e) => setBank({ ...bank, holder: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0A3D5C]/20 focus:border-[#0A3D5C] outline-none"
                  />
                </div>
              </div>

              {/* Asunto */}
              <div>
                <label htmlFor="pr-subject" className="block text-xs font-medium text-gray-600 mb-1">Asunto</label>
                <input
                  id="pr-subject"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0A3D5C]/20 focus:border-[#0A3D5C] outline-none"
                />
              </div>

              {/* Cuerpo */}
              <div>
                <label htmlFor="pr-body" className="block text-xs font-medium text-gray-600 mb-1">
                  Cuerpo del email (puedes editarlo)
                </label>
                <textarea
                  id="pr-body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={14}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-[#0A3D5C]/20 focus:border-[#0A3D5C] outline-none"
                />
              </div>

              <p className="text-xs text-gray-500">
                Destinatario: <strong>{advisory.contactEmail}</strong>
              </p>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            disabled={sending}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSend}
            disabled={sending || loading}
            data-testid="send-payment-request"
            className="px-5 py-2 bg-[#0A3D5C] text-white rounded-lg text-sm font-medium hover:bg-[#082d44] disabled:opacity-50"
          >
            {sending ? 'Enviando...' : 'Enviar solicitud de pago'}
          </button>
        </div>
      </div>
    </div>
  )
}
