'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const ADMIN_EMAILS = ['ccarrillodelolmo@gmail.com']

// Pestañas del panel
const TABS = [
  { id: 'overview', label: 'Resumen', icon: '📊' },
  { id: 'ets-price', label: 'Precio EU ETS', icon: '💰' },
  { id: 'codes', label: 'Códigos CN', icon: '📋' },
  { id: 'benchmarks', label: 'Benchmarks', icon: '📐' },
  { id: 'timeline', label: 'Timeline', icon: '📅' },
  { id: 'emissions', label: 'Factores Emisión', icon: '🏭' },
  { id: 'regulations', label: 'Reglamentos', icon: '📜' },
]

export default function AdminCBAMPage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [message, setMessage] = useState(null)

  // Data states
  const [stats, setStats] = useState(null)
  const [etsPrice, setEtsPrice] = useState(null)
  const [etsPriceHistory, setEtsPriceHistory] = useState([])
  const [codes, setCodes] = useState([])
  const [benchmarks, setBenchmarks] = useState([])
  const [timeline, setTimeline] = useState([])
  const [emissions, setEmissions] = useState([])
  const [regulations, setRegulations] = useState([])
  const [sectors, setSectors] = useState([])

  // Form states
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [etsPriceForm, setEtsPriceForm] = useState({ price: '', date: '', source: 'manual' })
  const [timelineForm, setTimelineForm] = useState({ event_date: '', title: '', description: '', event_type: 'deadline', quarter_label: '', icon: '📊' })
  const [editingId, setEditingId] = useState(null)

  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    checkUserAndLoadData()
  }, [])

  const checkUserAndLoadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/auth/login')
      return
    }

    if (!ADMIN_EMAILS.includes(user.email)) {
      router.push('/dashboard')
      return
    }

    setUser(user)
    await loadAllData()
    setLoading(false)
  }

  const loadAllData = async () => {
    const [
      sectorsRes,
      codesRes,
      benchmarksRes,
      timelineRes,
      emissionsRes,
      regulationsRes,
      etsPriceRes,
      etsPriceHistoryRes
    ] = await Promise.all([
      supabase.from('cbam_sectors').select('*').order('sort_order'),
      supabase.from('cbam_cn_codes').select('*').order('sector_id, cn_code'),
      supabase.from('cbam_benchmarks').select('*').order('sector_id, is_default desc'),
      supabase.from('cbam_timeline').select('*').order('event_date'),
      supabase.from('cbam_emission_factors').select('*').order('sector_id'),
      supabase.from('cbam_regulations').select('*').order('effective_date desc'),
      supabase.from('cbam_ets_prices').select('*').eq('is_current', true).single(),
      supabase.from('cbam_ets_prices').select('*').order('price_date', { ascending: false }).limit(10),
    ])

    setSectors(sectorsRes.data || [])
    setCodes(codesRes.data || [])
    setBenchmarks(benchmarksRes.data || [])
    setTimeline(timelineRes.data || [])
    setEmissions(emissionsRes.data || [])
    setRegulations(regulationsRes.data || [])
    setEtsPrice(etsPriceRes.data)
    setEtsPriceHistory(etsPriceHistoryRes.data || [])

    // Stats
    setStats({
      sectors: (sectorsRes.data || []).length,
      codes: (codesRes.data || []).length,
      benchmarks: (benchmarksRes.data || []).length,
      timeline: (timelineRes.data || []).length,
      emissions: (emissionsRes.data || []).length,
      regulations: (regulationsRes.data || []).length,
      etsPrice: etsPriceRes.data?.price || 'N/A'
    })
  }

  const showMsg = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 4000)
  }

  // ============================================================
  // PRECIO ETS
  // ============================================================
  const handleUpdateETSPrice = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      const price = parseFloat(etsPriceForm.price)
      if (!price || price <= 0 || price > 1000) throw new Error('Precio inválido')
      if (!etsPriceForm.date) throw new Error('Fecha requerida')

      // Desmarcar el actual
      await supabase
        .from('cbam_ets_prices')
        .update({ is_current: false })
        .eq('is_current', true)

      // Insertar nuevo
      const { error } = await supabase
        .from('cbam_ets_prices')
        .insert({
          price,
          price_date: etsPriceForm.date,
          price_type: 'closing',
          source: etsPriceForm.source || 'manual',
          is_current: true
        })

      if (error) throw error

      showMsg('success', `Precio actualizado a €${price}/tCO₂`)
      setEtsPriceForm({ price: '', date: '', source: 'manual' })
      setShowForm(false)
      await loadAllData()
    } catch (err) {
      showMsg('error', err.message)
    } finally {
      setSaving(false)
    }
  }

  // ============================================================
  // TIMELINE
  // ============================================================
  const handleSaveTimeline = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      const data = {
        event_date: timelineForm.event_date,
        title: timelineForm.title,
        description: timelineForm.description,
        event_type: timelineForm.event_type,
        quarter_label: timelineForm.quarter_label || null,
        icon: timelineForm.icon || '📊',
        is_new: true,
        sort_order: timeline.length + 1
      }

      if (editingId) {
        const { error } = await supabase.from('cbam_timeline').update(data).eq('id', editingId)
        if (error) throw error
        showMsg('success', 'Evento actualizado')
      } else {
        const { error } = await supabase.from('cbam_timeline').insert([data])
        if (error) throw error
        showMsg('success', 'Evento añadido')
      }

      setTimelineForm({ event_date: '', title: '', description: '', event_type: 'deadline', quarter_label: '', icon: '📊' })
      setEditingId(null)
      setShowForm(false)
      await loadAllData()
    } catch (err) {
      showMsg('error', err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTimeline = async (id) => {
    if (!confirm('¿Eliminar este evento del timeline?')) return
    const { error } = await supabase.from('cbam_timeline').delete().eq('id', id)
    if (!error) {
      showMsg('success', 'Evento eliminado')
      await loadAllData()
    }
  }

  // ============================================================
  // RENDER
  // ============================================================
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-[#0A3D5C] border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#0A3D5C] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="flex items-center gap-2">
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                  <span className="text-[#F4C542] font-bold text-lg">L</span>
                </div>
                <span className="text-xl font-bold">LexAduana</span>
              </Link>
              <span className="text-white/60">|</span>
              <span className="text-white/80">Admin CBAM</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/admin/clasificaciones"
                className="text-white/60 hover:text-white text-sm transition-colors"
              >
                Clasificaciones IA
              </Link>
              <Link
                href="/dashboard"
                className="text-white/80 hover:text-white transition-colors"
              >
                ← Volver
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Panel de Administración CBAM
          </h1>
          <p className="text-gray-600 mt-1">
            Gestiona los datos del módulo CBAM sin necesidad de tocar código
          </p>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-200 pb-4">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setShowForm(false); setEditingId(null) }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#0A3D5C] text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ===================== RESUMEN ===================== */}
        {activeTab === 'overview' && stats && (
          <div>
            {/* Accesos a subpaneles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Link href="/admin/cbam/asesoria" className="block group">
                <div className="bg-gradient-to-r from-[#0A3D5C] to-[#1a5478] rounded-xl p-6 text-white hover:shadow-lg transition-shadow h-full">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm">Subpanel</p>
                      <h3 className="text-xl font-bold mt-1">📋 Solicitudes de asesoría CBAM</h3>
                      <p className="text-blue-100 text-sm mt-1">
                        Revisión, cálculo, generación de informe y entrega.
                      </p>
                    </div>
                    <span className="text-2xl group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              </Link>
              <Link href="/admin/cbam/suscripciones" className="block group">
                <div className="bg-gradient-to-r from-[#0A3D5C] to-[#1a5478] rounded-xl p-6 text-white hover:shadow-lg transition-shadow h-full">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm">Subpanel</p>
                      <h3 className="text-xl font-bold mt-1">📊 Suscripciones Monitorización</h3>
                      <p className="text-blue-100 text-sm mt-1">
                        Alta manual, activación y seguimiento (199 €/mes).
                      </p>
                    </div>
                    <span className="text-2xl group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard label="Precio EU ETS" value={`€${stats.etsPrice}`} sub="por tCO₂" color="emerald" />
              <StatCard label="Códigos CN" value={stats.codes} sub="afectados por CBAM" color="blue" />
              <StatCard label="Benchmarks" value={stats.benchmarks} sub="valores de referencia" color="purple" />
              <StatCard label="Sectores" value={stats.sectors} sub="activos" color="amber" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Próximos deadlines</h3>
                {timeline
                  .filter(e => new Date(e.event_date) > new Date())
                  .slice(0, 5)
                  .map(event => (
                    <div key={event.id} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                      <span>{event.icon}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{event.title}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(event.event_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        event.event_type === 'critical' ? 'bg-red-100 text-red-700' :
                        event.event_type === 'deadline' ? 'bg-amber-100 text-amber-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {event.event_type}
                      </span>
                    </div>
                  ))}
              </div>

              <div className="bg-white rounded-xl shadow p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Códigos CN por sector</h3>
                {sectors.map(sector => {
                  const count = codes.filter(c => c.sector_id === sector.id).length
                  return (
                    <div key={sector.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <span className="text-sm">
                        {sector.icon} {sector.name}
                      </span>
                      <span className="text-sm font-mono font-bold text-gray-700">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ===================== PRECIO EU ETS ===================== */}
        {activeTab === 'ets-price' && (
          <div>
            {/* Precio actual */}
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-700 rounded-xl p-6 text-white mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm">Precio actual EU ETS</p>
                  <p className="text-4xl font-bold mt-1">
                    €{etsPrice?.price || 'N/A'}<span className="text-lg font-normal">/tCO₂</span>
                  </p>
                  {etsPrice && (
                    <p className="text-emerald-200 text-sm mt-2">
                      Fecha: {new Date(etsPrice.price_date).toLocaleDateString('es-ES')} · Fuente: {etsPrice.source}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                >
                  Actualizar precio
                </button>
              </div>
            </div>

            {/* Formulario */}
            {showForm && (
              <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Actualizar Precio EU ETS</h3>
                <form onSubmit={handleUpdateETSPrice} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Precio (EUR/tCO₂) *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={etsPriceForm.price}
                        onChange={(e) => setEtsPriceForm({ ...etsPriceForm, price: e.target.value })}
                        required
                        placeholder="72.50"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A3D5C] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
                      <input
                        type="date"
                        value={etsPriceForm.date}
                        onChange={(e) => setEtsPriceForm({ ...etsPriceForm, date: e.target.value })}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A3D5C] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fuente</label>
                      <select
                        value={etsPriceForm.source}
                        onChange={(e) => setEtsPriceForm({ ...etsPriceForm, source: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A3D5C] focus:border-transparent"
                      >
                        <option value="manual">Manual</option>
                        <option value="EEX">EEX (European Energy Exchange)</option>
                        <option value="ICE">ICE (Intercontinental Exchange)</option>
                        <option value="SENDECO2">SENDECO2</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                    >
                      {saving ? 'Guardando...' : 'Actualizar Precio'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Historial */}
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-800">Historial de precios</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {etsPriceHistory.map(row => (
                  <div key={row.id} className="px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className={`w-2 h-2 rounded-full ${row.is_current ? 'bg-emerald-500' : 'bg-gray-300'}`}></span>
                      <span className="font-mono font-bold text-gray-800">€{parseFloat(row.price).toFixed(2)}</span>
                      <span className="text-gray-500 text-sm">/tCO₂</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{new Date(row.price_date).toLocaleDateString('es-ES')}</span>
                      <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">{row.source}</span>
                      {row.is_current && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">Actual</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
              <strong>Consejo:</strong> Puedes consultar el precio actual en{' '}
              <a href="https://www.eex.com" target="_blank" rel="noopener" className="underline">eex.com</a> o{' '}
              <a href="https://www.sendeco2.com" target="_blank" rel="noopener" className="underline">sendeco2.com</a>.
              En 2026 el precio se actualiza trimestralmente, y a partir de 2027 semanalmente.
            </div>
          </div>
        )}

        {/* ===================== CÓDIGOS CN ===================== */}
        {activeTab === 'codes' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800">
                Códigos CN afectados por CBAM ({codes.length})
              </h2>
            </div>

            {/* Filtro por sector */}
            <div className="flex flex-wrap gap-2 mb-6">
              {sectors.map(sector => (
                <span key={sector.id} className="px-3 py-1 bg-white border border-gray-200 rounded-full text-sm">
                  {sector.icon} {sector.name}: {codes.filter(c => c.sector_id === sector.id).length}
                </span>
              ))}
            </div>

            {/* Tabla de códigos */}
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Código CN</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Sector</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Descripción</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Gas</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Tipo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {codes.map(code => {
                      const sector = sectors.find(s => s.id === code.sector_id)
                      return (
                        <tr key={code.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-mono font-bold text-gray-800">{code.cn_code}</td>
                          <td className="px-4 py-3">
                            <span className="text-sm">{sector?.icon} {sector?.name}</span>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{code.description}</td>
                          <td className="px-4 py-3 text-gray-500">{code.gas}</td>
                          <td className="px-4 py-3">
                            {code.is_chapter ? (
                              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">Capítulo</span>
                            ) : (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">Exacto</span>
                            )}
                            {code.is_downstream && (
                              <span className="ml-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">Downstream</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ===================== BENCHMARKS ===================== */}
        {activeTab === 'benchmarks' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Benchmarks UE - Emisiones de referencia ({benchmarks.length})
            </h2>

            {sectors.map(sector => {
              const sectorBenchmarks = benchmarks.filter(b => b.sector_id === sector.id)
              if (sectorBenchmarks.length === 0) return null

              return (
                <div key={sector.id} className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">
                    {sector.icon} {sector.name}
                  </h3>
                  <div className="bg-white rounded-xl shadow overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="text-left px-4 py-3 font-medium text-gray-600">Producto</th>
                          <th className="text-left px-4 py-3 font-medium text-gray-600">Valor</th>
                          <th className="text-left px-4 py-3 font-medium text-gray-600">Unidad</th>
                          <th className="text-left px-4 py-3 font-medium text-gray-600">Años</th>
                          <th className="text-left px-4 py-3 font-medium text-gray-600">Tipo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {sectorBenchmarks.map(b => (
                          <tr key={b.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-gray-800">{b.description}</td>
                            <td className="px-4 py-3 font-mono font-bold text-gray-800">{parseFloat(b.value).toFixed(3)}</td>
                            <td className="px-4 py-3 text-gray-500">{b.unit}</td>
                            <td className="px-4 py-3 text-gray-500">
                              {b.year_from}{b.year_to ? ` - ${b.year_to}` : '+'}
                            </td>
                            <td className="px-4 py-3">
                              {b.is_default && (
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs">Default</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })}

            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
              <strong>Nota:</strong> Los benchmarks representan las emisiones de las instalaciones europeas más eficientes (top 10%).
              Solo se cobra CBAM por las emisiones que exceden estos valores. Se actualizan con cada nuevo período regulatorio.
            </div>
          </div>
        )}

        {/* ===================== TIMELINE ===================== */}
        {activeTab === 'timeline' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800">
                Timeline CBAM ({timeline.length} eventos)
              </h2>
              <button
                onClick={() => {
                  setTimelineForm({ event_date: '', title: '', description: '', event_type: 'deadline', quarter_label: '', icon: '📊' })
                  setEditingId(null)
                  setShowForm(true)
                }}
                className="px-4 py-2 bg-[#0A3D5C] text-white rounded-lg hover:bg-[#0A3D5C]/90 transition-colors"
              >
                + Añadir evento
              </button>
            </div>

            {/* Formulario */}
            {showForm && (
              <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  {editingId ? 'Editar evento' : 'Nuevo evento'}
                </h3>
                <form onSubmit={handleSaveTimeline} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
                      <input
                        type="date"
                        value={timelineForm.event_date}
                        onChange={(e) => setTimelineForm({ ...timelineForm, event_date: e.target.value })}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A3D5C] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                      <select
                        value={timelineForm.event_type}
                        onChange={(e) => setTimelineForm({ ...timelineForm, event_type: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A3D5C] focus:border-transparent"
                      >
                        <option value="critical">Crítico</option>
                        <option value="deadline">Deadline</option>
                        <option value="milestone">Hito</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Icono</label>
                      <select
                        value={timelineForm.icon}
                        onChange={(e) => setTimelineForm({ ...timelineForm, icon: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A3D5C] focus:border-transparent"
                      >
                        <option value="🚨">🚨 Alerta</option>
                        <option value="📝">📝 Registro</option>
                        <option value="📊">📊 Informe</option>
                        <option value="📋">📋 Declaración</option>
                        <option value="📈">📈 Precios</option>
                        <option value="🎫">🎫 Certificados</option>
                        <option value="🏭">🏭 Industria</option>
                        <option value="🎯">🎯 Meta</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                    <input
                      type="text"
                      value={timelineForm.title}
                      onChange={(e) => setTimelineForm({ ...timelineForm, title: e.target.value })}
                      required
                      placeholder="Informe CBAM Q1 2027"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A3D5C] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
                    <textarea
                      value={timelineForm.description}
                      onChange={(e) => setTimelineForm({ ...timelineForm, description: e.target.value })}
                      required
                      rows={2}
                      placeholder="Presentación del informe trimestral Q1 2027."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A3D5C] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Etiqueta trimestre</label>
                    <input
                      type="text"
                      value={timelineForm.quarter_label}
                      onChange={(e) => setTimelineForm({ ...timelineForm, quarter_label: e.target.value })}
                      placeholder="Q1 2027 - Informe"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A3D5C] focus:border-transparent"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-6 py-2 bg-[#0A3D5C] text-white rounded-lg hover:bg-[#0A3D5C]/90 transition-colors disabled:opacity-50"
                    >
                      {saving ? 'Guardando...' : (editingId ? 'Actualizar' : 'Guardar')}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowForm(false); setEditingId(null) }}
                      className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Lista de eventos */}
            <div className="space-y-3">
              {timeline.map(event => {
                const isPast = new Date(event.event_date) < new Date()
                return (
                  <div key={event.id} className={`bg-white rounded-xl shadow p-4 flex items-center gap-4 ${isPast ? 'opacity-60' : ''}`}>
                    <div className="text-2xl">{event.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-800">{event.title}</h4>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          event.event_type === 'critical' ? 'bg-red-100 text-red-700' :
                          event.event_type === 'deadline' ? 'bg-amber-100 text-amber-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {event.event_type}
                        </span>
                        {isPast && <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">Pasado</span>}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(event.event_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setTimelineForm({
                            event_date: event.event_date,
                            title: event.title,
                            description: event.description,
                            event_type: event.event_type,
                            quarter_label: event.quarter_label || '',
                            icon: event.icon || '📊'
                          })
                          setEditingId(event.id)
                          setShowForm(true)
                        }}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteTimeline(event.id)}
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ===================== FACTORES DE EMISIÓN ===================== */}
        {activeTab === 'emissions' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Factores de Emisión por Defecto ({emissions.length})
            </h2>

            {sectors.map(sector => {
              const sectorEmissions = emissions.filter(e => e.sector_id === sector.id)
              if (sectorEmissions.length === 0) return null

              return (
                <div key={sector.id} className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">
                    {sector.icon} {sector.name}
                  </h3>
                  <div className="bg-white rounded-xl shadow overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="text-left px-4 py-3 font-medium text-gray-600">Producto</th>
                          <th className="text-left px-4 py-3 font-medium text-gray-600">Factor</th>
                          <th className="text-left px-4 py-3 font-medium text-gray-600">Unidad</th>
                          <th className="text-left px-4 py-3 font-medium text-gray-600">Códigos aplicables</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {sectorEmissions.map(ef => (
                          <tr key={ef.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-gray-800 font-medium">{ef.product_name}</td>
                            <td className="px-4 py-3 font-mono font-bold text-gray-800">{parseFloat(ef.factor_value).toFixed(3)}</td>
                            <td className="px-4 py-3 text-gray-500">{ef.unit}</td>
                            <td className="px-4 py-3 text-gray-500 text-xs font-mono">
                              {ef.applicable_cn_codes?.join(', ') || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })}

            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
              <strong>Importante:</strong> Si el importador usa valores por defecto en lugar de emisiones reales verificadas,
              se aplica un markup progresivo: +10% (2026), +20% (2027), +30% (2028+).
            </div>
          </div>
        )}

        {/* ===================== REGLAMENTOS ===================== */}
        {activeTab === 'regulations' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Reglamentos CBAM ({regulations.length})
            </h2>

            <div className="space-y-4">
              {regulations.map(reg => (
                <div key={reg.id} className="bg-white rounded-xl shadow p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-800">{reg.reference}</h4>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          reg.status === 'in_force' ? 'bg-green-100 text-green-700' :
                          reg.status === 'proposed' ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {reg.status === 'in_force' ? 'En vigor' : reg.status === 'proposed' ? 'Propuesta' : reg.status}
                        </span>
                        {reg.regulation_type && (
                          <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">{reg.regulation_type}</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700">{reg.title}</p>
                      {reg.summary && <p className="text-sm text-gray-500 mt-1">{reg.summary}</p>}
                    </div>
                    {reg.effective_date && (
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {new Date(reg.effective_date).toLocaleDateString('es-ES')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

// ============================================================
// COMPONENTES AUXILIARES
// ============================================================
function StatCard({ label, value, sub, color }) {
  const colorClasses = {
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
  }

  return (
    <div className={`rounded-xl border p-4 ${colorClasses[color] || colorClasses.blue}`}>
      <p className="text-sm opacity-80">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      <p className="text-xs opacity-60 mt-1">{sub}</p>
    </div>
  )
}
