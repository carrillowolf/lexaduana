'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import Link from 'next/link'

export default function DespachoDetalle() {
  const [user, setUser] = useState(null)
  const [dispatch, setDispatch] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('info') // info, checklist, docs, timeline
  
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()

  // Verificar usuario
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
      } else {
        setUser(user)
      }
    }
    checkUser()
  }, [router, supabase])

  // Cargar despacho
  useEffect(() => {
    if (!user || !params.id) return
    loadDispatch()
  }, [user, params.id, supabase])

  const loadDispatch = async () => {
    setLoading(true)
    try {
      const { data, error: fetchError } = await supabase
        .from('dispatches')
        .select('*')
        .eq('id', params.id)
        .single()

      if (fetchError) throw fetchError
      setDispatch(data)
    } catch (err) {
      console.error('Error cargando despacho:', err)
      setError('Despacho no encontrado')
    } finally {
      setLoading(false)
    }
  }

  const updateField = async (field, value) => {
    setSaving(true)
    try {
      const { error: updateError } = await supabase
        .from('dispatches')
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq('id', params.id)

      if (updateError) throw updateError
      
      setDispatch(prev => ({ ...prev, [field]: value }))
    } catch (err) {
      console.error('Error actualizando:', err)
      alert('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const updateStage = async (stage, newValue) => {
    await updateField(stage, newValue)
  }

  // Helper: Color según estado de stage
  const getStageColor = (stage) => {
    switch(stage) {
      case 'ok': return 'bg-green-500'
      case 'pending': return 'bg-gray-400'
      case 'blocked': return 'bg-red-500'
      case 'in_progress': return 'bg-yellow-500'
      case 'na': return 'bg-gray-200'
      default: return 'bg-gray-400'
    }
  }

  const getStageLabel = (stage) => {
    switch(stage) {
      case 'ok': return 'Completado'
      case 'pending': return 'Pendiente'
      case 'blocked': return 'Bloqueado'
      case 'in_progress': return 'En proceso'
      case 'na': return 'No aplica'
      default: return 'Pendiente'
    }
  }

  // Helper: Icono tipo operación
  const getOperationIcon = (type) => {
    switch(type) {
      case 'import_maritime': return '🚢'
      case 'import_air': return '✈️'
      case 'import_road': return '🚛'
      case 'export_maritime': return '🚢📤'
      case 'export_air': return '✈️📤'
      case 'export_road': return '🚛📤'
      case 'transit': return '🔄'
      default: return '📦'
    }
  }

  const getOperationName = (type) => {
    const names = {
      'import_maritime': 'Importación Marítima',
      'import_air': 'Importación Aérea',
      'import_road': 'Importación Terrestre',
      'export_maritime': 'Exportación Marítima',
      'export_air': 'Exportación Aérea',
      'export_road': 'Exportación Terrestre',
      'transit': 'Tránsito'
    }
    return names[type] || type
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-[#0A3D5C]"></div>
          <p className="text-gray-600 mt-4">Cargando despacho...</p>
        </div>
      </div>
    )
  }

  if (error || !dispatch) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Despacho no encontrado</h2>
          <Link href="/despachos" className="text-[#0A3D5C] hover:underline">
            ← Volver a despachos
          </Link>
        </div>
      </div>
    )
  }

  const isImport = dispatch.operation_type?.startsWith('import')
  const isExport = dispatch.operation_type?.startsWith('export')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/despachos" className="flex items-center space-x-3">
              <img src="/logo.png" alt="LexAduana" className="h-10 w-10" />
              <div>
                <h1 className="text-xl font-bold text-[#0A3D5C]">{dispatch.expediente_number}</h1>
                <p className="text-xs text-gray-500">{dispatch.client_name}</p>
              </div>
            </Link>

            <div className="flex items-center space-x-3">
              {saving && <span className="text-xs text-gray-500">Guardando...</span>}
              <Link
                href="/despachos"
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-[#0A3D5C] hover:bg-gray-50 rounded-lg transition"
              >
                ← Volver
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header info */}
        <div className="mb-6 bg-gradient-to-r from-[#0A3D5C] to-[#0d5078] rounded-2xl p-6 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-5xl">{getOperationIcon(dispatch.operation_type)}</span>
              <div>
                <h2 className="text-3xl font-bold mb-1">{dispatch.expediente_number}</h2>
                <p className="text-blue-100">{getOperationName(dispatch.operation_type)}</p>
                <p className="text-sm text-blue-200 mt-1">
                  {dispatch.product_description || 'Sin descripción'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-blue-200">Estado</p>
              <p className="text-lg font-bold capitalize">{dispatch.status}</p>
              {dispatch.eta && (
                <p className="text-sm text-blue-200 mt-2">
                  {isImport ? 'ETA' : 'ETD'}: {new Date(dispatch.eta).toLocaleDateString('es-ES')}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Cards resumen */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Cliente</p>
                <p className="text-lg font-bold text-gray-900">{dispatch.client_name}</p>
              </div>
              <svg className="w-10 h-10 text-[#0A3D5C] opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Incoterm</p>
                <p className="text-lg font-bold text-gray-900">{dispatch.incoterm || '-'}</p>
              </div>
              <svg className="w-10 h-10 text-[#0A3D5C] opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Gastos</p>
                <p className="text-lg font-bold text-gray-900 capitalize">{dispatch.expenses_status}</p>
              </div>
              <svg className="w-10 h-10 text-[#0A3D5C] opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Barra de progreso con etapas */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Progreso del despacho</h3>
          <div className="flex items-center justify-between">
            {/* Docs */}
            <div className="text-center">
              <div className={`w-12 h-12 rounded-full ${getStageColor(dispatch.stage_docs)} mx-auto mb-2 flex items-center justify-center text-white font-bold cursor-pointer`}
                   onClick={() => {
                     const next = dispatch.stage_docs === 'pending' ? 'ok' : 
                                  dispatch.stage_docs === 'ok' ? 'blocked' : 'pending'
                     updateStage('stage_docs', next)
                   }}>
                {dispatch.stage_docs === 'ok' ? '✓' : '📄'}
              </div>
              <p className="text-xs font-medium text-gray-700">Docs</p>
              <p className="text-xs text-gray-500">{getStageLabel(dispatch.stage_docs)}</p>
            </div>

            {/* Sumaria */}
            {isImport && (
              <div className="text-center">
                <div className={`w-12 h-12 rounded-full ${getStageColor(dispatch.stage_sumaria)} mx-auto mb-2 flex items-center justify-center text-white font-bold cursor-pointer`}
                     onClick={() => {
                       const next = dispatch.stage_sumaria === 'pending' ? 'ok' : 
                                    dispatch.stage_sumaria === 'ok' ? 'blocked' : 'pending'
                       updateStage('stage_sumaria', next)
                     }}>
                  {dispatch.stage_sumaria === 'ok' ? '✓' : '📋'}
                </div>
                <p className="text-xs font-medium text-gray-700">Sumaria</p>
                <p className="text-xs text-gray-500">{getStageLabel(dispatch.stage_sumaria)}</p>
              </div>
            )}

            {/* Despacho */}
            <div className="text-center">
              <div className={`w-12 h-12 rounded-full ${getStageColor(dispatch.stage_despacho)} mx-auto mb-2 flex items-center justify-center text-white font-bold cursor-pointer`}
                   onClick={() => {
                     const next = dispatch.stage_despacho === 'pending' ? 'ok' : 
                                  dispatch.stage_despacho === 'ok' ? 'blocked' : 'pending'
                     updateStage('stage_despacho', next)
                   }}>
                {dispatch.stage_despacho === 'ok' ? '✓' : '📝'}
              </div>
              <p className="text-xs font-medium text-gray-700">Despacho</p>
              <p className="text-xs text-gray-500">{getStageLabel(dispatch.stage_despacho)}</p>
            </div>

            {/* Paraaduaneros */}
            <div className="text-center">
              <div className={`w-12 h-12 rounded-full ${getStageColor(dispatch.stage_paraaduaneros)} mx-auto mb-2 flex items-center justify-center text-white font-bold cursor-pointer`}
                   onClick={() => {
                     const next = dispatch.stage_paraaduaneros === 'pending' ? 'ok' : 
                                  dispatch.stage_paraaduaneros === 'ok' ? 'na' : 
                                  dispatch.stage_paraaduaneros === 'na' ? 'in_progress' : 'pending'
                     updateStage('stage_paraaduaneros', next)
                   }}>
                {dispatch.stage_paraaduaneros === 'ok' ? '✓' : 
                 dispatch.stage_paraaduaneros === 'na' ? '-' : '🔐'}
              </div>
              <p className="text-xs font-medium text-gray-700">Paraaduaneros</p>
              <p className="text-xs text-gray-500">{getStageLabel(dispatch.stage_paraaduaneros)}</p>
            </div>

            {/* DUA */}
            <div className="text-center">
              <div className={`w-12 h-12 rounded-full ${getStageColor(dispatch.stage_dua)} mx-auto mb-2 flex items-center justify-center text-white font-bold cursor-pointer`}
                   onClick={() => {
                     const next = dispatch.stage_dua === 'pending' ? 'ok' : 
                                  dispatch.stage_dua === 'ok' ? 'blocked' : 'pending'
                     updateStage('stage_dua', next)
                   }}>
                {dispatch.stage_dua === 'ok' ? '✓' : '🟠'}
              </div>
              <p className="text-xs font-medium text-gray-700">DUA</p>
              <p className="text-xs text-gray-500">{getStageLabel(dispatch.stage_dua)}</p>
            </div>

            {/* Levante */}
            <div className="text-center">
              <div className={`w-12 h-12 rounded-full ${getStageColor(dispatch.stage_levante)} mx-auto mb-2 flex items-center justify-center text-white font-bold cursor-pointer`}
                   onClick={() => {
                     const next = dispatch.stage_levante === 'pending' ? 'ok' : 
                                  dispatch.stage_levante === 'ok' ? 'blocked' : 'pending'
                     updateStage('stage_levante', next)
                   }}>
                {dispatch.stage_levante === 'ok' ? '✓' : '✅'}
              </div>
              <p className="text-xs font-medium text-gray-700">Levante</p>
              <p className="text-xs text-gray-500">{getStageLabel(dispatch.stage_levante)}</p>
            </div>

            {/* Cierre */}
            <div className="text-center">
              <div className={`w-12 h-12 rounded-full ${getStageColor(dispatch.stage_closure)} mx-auto mb-2 flex items-center justify-center text-white font-bold cursor-pointer`}
                   onClick={() => {
                     const next = dispatch.stage_closure === 'pending' ? 'ok' : 'pending'
                     updateStage('stage_closure', next)
                   }}>
                {dispatch.stage_closure === 'ok' ? '✓' : '📤'}
              </div>
              <p className="text-xs font-medium text-gray-700">Cierre</p>
              <p className="text-xs text-gray-500">{getStageLabel(dispatch.stage_closure)}</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4 text-center">
            Click en cada etapa para cambiar su estado
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('info')}
              className={`pb-4 px-2 font-medium text-sm border-b-2 transition ${
                activeTab === 'info'
                  ? 'border-[#0A3D5C] text-[#0A3D5C]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Información
            </button>
            <button
              onClick={() => setActiveTab('checklist')}
              className={`pb-4 px-2 font-medium text-sm border-b-2 transition ${
                activeTab === 'checklist'
                  ? 'border-[#0A3D5C] text-[#0A3D5C]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Checklist
            </button>
            <button
              onClick={() => setActiveTab('docs')}
              className={`pb-4 px-2 font-medium text-sm border-b-2 transition ${
                activeTab === 'docs'
                  ? 'border-[#0A3D5C] text-[#0A3D5C]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Documentos
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`pb-4 px-2 font-medium text-sm border-b-2 transition ${
                activeTab === 'timeline'
                  ? 'border-[#0A3D5C] text-[#0A3D5C]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Timeline
            </button>
          </div>
        </div>

        {/* Contenido tabs */}
        {activeTab === 'info' && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Información del despacho</h3>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Datos básicos */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Cliente</label>
                <p className="text-gray-900 font-medium">{dispatch.client_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Producto</label>
                <p className="text-gray-900">{dispatch.product_description || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Código HS</label>
                <p className="text-gray-900 font-mono">{dispatch.hs_code || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Incoterm</label>
                <p className="text-gray-900">{dispatch.incoterm || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Referencia transporte</label>
                <p className="text-gray-900 font-mono">{dispatch.transport_reference || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  {isImport ? 'ETA' : 'ETD'}
                </label>
                <p className="text-gray-900">
                  {dispatch.eta ? new Date(dispatch.eta).toLocaleDateString('es-ES', { 
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
                  }) : '-'}
                </p>
              </div>

              {/* Específicos marítima */}
              {dispatch.operation_type === 'import_maritime' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Tipo contenedor</label>
                    <p className="text-gray-900">{dispatch.container_type || '-'}</p>
                  </div>
                  {dispatch.container_type === 'LCL' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Desconsolidación</label>
                      <p className="text-gray-900">
                        {dispatch.waiting_deconsolidation ? '⏳ Esperando' : '✓ Completado'}
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* Estado gastos */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Gastos</label>
                <p className="text-gray-900 capitalize">{dispatch.expenses_status}</p>
              </div>

              {/* MRN (si tiene predeclaración) */}
              {dispatch.mrn_number && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">MRN</label>
                  <p className="text-gray-900 font-mono">{dispatch.mrn_number}</p>
                </div>
              )}

              {/* Notas internas */}
              {dispatch.internal_notes && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Notas internas</label>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{dispatch.internal_notes}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'checklist' && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Checklist</h3>
            <p className="text-gray-600">Próximamente: Checklist dinámico por tipo de operación</p>
          </div>
        )}

        {activeTab === 'docs' && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Documentos</h3>
            <p className="text-gray-600">Próximamente: Subida y gestión de documentos</p>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Timeline</h3>
            <p className="text-gray-600">Próximamente: Historial de cambios</p>
          </div>
        )}
      </div>
    </div>
  )
}