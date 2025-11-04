'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import Link from 'next/link'

export default function DespachosListMejorada() {
  const [user, setUser] = useState(null)
  const [dispatches, setDispatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('todos') // todos, mios, esperando, transito
  
  const router = useRouter()
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

  // Cargar despachos
  useEffect(() => {
    if (!user) return
    loadDispatches()
  }, [user, supabase])

  const loadDispatches = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('dispatches')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setDispatches(data || [])
    } catch (error) {
      console.error('Error cargando despachos:', error)
    } finally {
      setLoading(false)
    }
  }

  // Determinar "quién tiene la pelota" y estado descriptivo
  const getDispatchStatus = (dispatch) => {
    const isImport = dispatch.operation_type?.startsWith('import')
    
    // COMPLETADO
    if (dispatch.stage_closure === 'ok') {
      return {
        category: 'completed',
        owner: 'none',
        label: 'Completado',
        action: 'Expediente cerrado',
        color: 'gray',
        urgency: 'low'
      }
    }

    // LEVANTE CONCEDIDO - Requiere acción tuya
    if (dispatch.stage_levante === 'ok' && dispatch.stage_closure === 'pending') {
      return {
        category: 'requires_action',
        owner: 'you',
        label: 'Enviar documentación',
        action: 'Levante concedido - Pasar docs a operativa',
        color: 'red',
        urgency: 'high'
      }
    }

    // DUA VERDE - Puede cerrar
    if (dispatch.stage_dua === 'ok' && dispatch.stage_levante === 'pending') {
      return {
        category: 'requires_action',
        owner: 'you',
        label: 'Gestionar levante',
        action: 'DUA en circuito verde - Tramitar levante',
        color: 'red',
        urgency: 'high'
      }
    }

    // RECONOCIMIENTO FÍSICO - En tus manos
    if (dispatch.stage_dua === 'blocked') {
      const inspectionDate = dispatch.inspection_date ? new Date(dispatch.inspection_date) : null
      const daysUntil = inspectionDate ? Math.ceil((inspectionDate - new Date()) / (1000 * 60 * 60 * 24)) : null
      
      if (daysUntil !== null && daysUntil <= 2) {
        return {
          category: 'requires_action',
          owner: 'you',
          label: 'Reconocimiento próximo',
          action: `${dispatch.inspection_type || 'Reconocimiento'} ${daysUntil === 0 ? 'HOY' : daysUntil === 1 ? 'MAÑANA' : `en ${daysUntil}d`}`,
          color: 'red',
          urgency: 'critical'
        }
      }

      return {
        category: 'waiting_others',
        owner: 'customs',
        label: 'Esperando aduanas',
        action: `Reconocimiento ${dispatch.inspection_type || 'físico'} programado`,
        color: 'yellow',
        urgency: 'medium'
      }
    }

    // DUA PRESENTADO - Esperando aduanas
    if (dispatch.stage_dua === 'in_progress' && dispatch.stage_levante === 'pending') {
      return {
        category: 'waiting_others',
        owner: 'customs',
        label: 'Esperando circuito DUA',
        action: 'DUA presentado - Pendiente resolución aduanas',
        color: 'yellow',
        urgency: 'medium'
      }
    }

    // PARAADUANEROS BLOQUEADOS
    if (dispatch.stage_paraaduaneros === 'blocked' || dispatch.stage_paraaduaneros === 'in_progress') {
      const paraaduaneros = dispatch.paraaduaneros || []
      const blocked = paraaduaneros.filter(p => p.status === 'red' || p.status === 'orange')
      
      if (blocked.length > 0) {
        return {
          category: 'waiting_others',
          owner: 'inspector',
          label: `Paraaduanero ${blocked[0].type}`,
          action: blocked[0].status === 'red' ? 'Esperando inspección física' : 'Pendiente certificado',
          color: 'yellow',
          urgency: 'medium'
        }
      }
    }

    // LISTO PARA PICAR - Requiere acción tuya
    if (dispatch.stage_despacho === 'ok' && 
        dispatch.stage_paraaduaneros !== 'in_progress' && 
        dispatch.stage_dua === 'pending') {
      return {
        category: 'requires_action',
        owner: 'you',
        label: 'Listo para picar',
        action: 'Documentación completa - Presentar DUA',
        color: 'red',
        urgency: 'high'
      }
    }

    // ESPERANDO SUMARIA (Import marítimo/aéreo)
    if (isImport && dispatch.stage_sumaria === 'pending') {
      const etaDays = dispatch.eta ? Math.ceil((new Date(dispatch.eta) - new Date()) / (1000 * 60 * 60 * 24)) : null
      
      if (etaDays !== null && etaDays <= 0) {
        return {
          category: 'requires_action',
          owner: 'you',
          label: 'Verificar sumaria',
          action: `Llegada hace ${Math.abs(etaDays)}d - Comprobar sumaria`,
          color: 'red',
          urgency: 'high'
        }
      }

      return {
        category: 'waiting_others',
        owner: 'port',
        label: 'Esperando llegada',
        action: 'Mercancía en tránsito - Pendiente sumaria',
        color: 'yellow',
        urgency: 'low'
      }
    }

    // ESPERANDO DOCS CLIENTE
    if (dispatch.stage_docs === 'pending' || dispatch.expenses_status === 'pendiente') {
      return {
        category: 'waiting_others',
        owner: 'client',
        label: 'Esperando cliente',
        action: dispatch.stage_docs === 'pending' ? 'Pendiente documentación' : 'Pendiente gastos',
        color: 'yellow',
        urgency: 'medium'
      }
    }

    // EN TRÁNSITO
    if (isImport && dispatch.stage_sumaria === 'pending') {
      const etaDays = dispatch.eta ? Math.ceil((new Date(dispatch.eta) - new Date()) / (1000 * 60 * 60 * 24)) : null
      
      return {
        category: 'in_transit',
        owner: 'none',
        label: 'En tránsito',
        action: etaDays !== null ? `Llegada en ${etaDays} día${etaDays !== 1 ? 's' : ''}` : 'Navegando',
        color: 'green',
        urgency: 'low'
      }
    }

    // DEFAULT
    return {
      category: 'requires_action',
      owner: 'you',
      label: 'Revisar',
      action: 'Verificar estado del despacho',
      color: 'red',
      urgency: 'medium'
    }
  }

  // Agrupar despachos por categoría
  const groupedDispatches = dispatches.reduce((acc, dispatch) => {
    const status = getDispatchStatus(dispatch)
    const category = status.category
    
    if (!acc[category]) acc[category] = []
    acc[category].push({ ...dispatch, statusInfo: status })
    
    return acc
  }, {})

  // Calcular contadores
  const counters = {
    requires_action: groupedDispatches.requires_action?.length || 0,
    waiting_others: groupedDispatches.waiting_others?.length || 0,
    in_transit: groupedDispatches.in_transit?.length || 0,
    completed: groupedDispatches.completed?.length || 0
  }

  // Helper: Calcular progreso
  const calculateProgress = (dispatch) => {
    const stages = ['stage_docs', 'stage_sumaria', 'stage_despacho', 'stage_paraaduaneros', 'stage_dua', 'stage_levante', 'stage_closure']
    const isImport = dispatch.operation_type?.startsWith('import')
    
    let total = isImport ? 7 : 6 // Sumaria solo en import
    let completed = 0
    
    stages.forEach(stage => {
      if (stage === 'stage_sumaria' && !isImport) return // Skip sumaria en export
      if (dispatch[stage] === 'ok') completed++
    })
    
    return Math.round((completed / total) * 100)
  }

  // Helper: Icono según owner
  const getOwnerIcon = (owner) => {
    switch(owner) {
      case 'you': return '👤'
      case 'client': return '👥'
      case 'customs': return '🏛️'
      case 'inspector': return '🔐'
      case 'port': return '🚢'
      default: return '📦'
    }
  }

  // Helper: Color de fondo según categoría
  const getCategoryBg = (category) => {
    switch(category) {
      case 'requires_action': return 'bg-red-50 border-red-200'
      case 'waiting_others': return 'bg-yellow-50 border-yellow-200'
      case 'in_transit': return 'bg-green-50 border-green-200'
      case 'completed': return 'bg-gray-50 border-gray-200'
      default: return 'bg-white border-gray-200'
    }
  }

  const getCategoryTextColor = (category) => {
    switch(category) {
      case 'requires_action': return 'text-red-700'
      case 'waiting_others': return 'text-yellow-700'
      case 'in_transit': return 'text-green-700'
      case 'completed': return 'text-gray-700'
      default: return 'text-gray-700'
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

  // Renderizar card de despacho
  const DispatchCard = ({ dispatch }) => {
    const progress = calculateProgress(dispatch)
    const status = dispatch.statusInfo
    
    return (
      <div 
        onClick={() => router.push(`/despachos/${dispatch.id}`)}
        className={`${getCategoryBg(status.category)} border-2 rounded-xl p-4 cursor-pointer hover:shadow-lg transition-all`}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">{getOperationIcon(dispatch.operation_type)}</span>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{dispatch.expediente_number}</h3>
              <p className="text-sm text-gray-600">{dispatch.client_name}</p>
            </div>
          </div>
          <div className="text-right">
            {dispatch.eta && (
              <p className="text-xs text-gray-500">
                {new Date(dispatch.eta).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}
              </p>
            )}
          </div>
        </div>

        {/* Producto */}
        <p className="text-sm text-gray-700 mb-3">
          {dispatch.product_description?.substring(0, 50)}...
        </p>

        {/* Estado principal */}
        <div className={`flex items-center space-x-2 mb-3 p-2 rounded-lg ${
          status.urgency === 'critical' ? 'bg-red-100' :
          status.urgency === 'high' ? 'bg-orange-100' :
          status.urgency === 'medium' ? 'bg-yellow-100' :
          'bg-blue-100'
        }`}>
          <span className="text-xl">{getOwnerIcon(status.owner)}</span>
          <div className="flex-1">
            <p className={`text-xs font-bold uppercase ${getCategoryTextColor(status.category)}`}>
              {status.label}
            </p>
            <p className="text-xs text-gray-600">{status.action}</p>
          </div>
          {status.urgency === 'critical' && (
            <span className="text-xl animate-pulse">⚡</span>
          )}
        </div>

        {/* Barra de progreso */}
        <div className="mb-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-600">Progreso</span>
            <span className="text-xs font-bold text-gray-700">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all ${
                progress === 100 ? 'bg-green-500' :
                progress >= 70 ? 'bg-blue-500' :
                progress >= 40 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Mini etapas */}
        <div className="flex items-center space-x-1 text-xs">
          <span className={dispatch.stage_docs === 'ok' ? 'text-green-500' : 'text-gray-300'}>📄</span>
          {dispatch.operation_type?.startsWith('import') && (
            <span className={dispatch.stage_sumaria === 'ok' ? 'text-green-500' : 'text-gray-300'}>📋</span>
          )}
          <span className={dispatch.stage_despacho === 'ok' ? 'text-green-500' : 'text-gray-300'}>📝</span>
          <span className={dispatch.stage_paraaduaneros === 'ok' ? 'text-green-500' : dispatch.stage_paraaduaneros === 'na' ? 'text-gray-200' : 'text-gray-300'}>🔐</span>
          <span className={dispatch.stage_dua === 'ok' ? 'text-green-500' : 'text-gray-300'}>🟠</span>
          <span className={dispatch.stage_levante === 'ok' ? 'text-green-500' : 'text-gray-300'}>✅</span>
          <span className={dispatch.stage_closure === 'ok' ? 'text-green-500' : 'text-gray-300'}>📤</span>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-[#0A3D5C]"></div>
          <p className="text-gray-600 mt-4">Cargando despachos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-gray-100 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-3">
              <img src="/logo.png" alt="LexAduana" className="h-10 w-10" />
              <div>
                <h1 className="text-xl font-bold text-[#0A3D5C]">Despachos</h1>
                <p className="text-xs text-gray-500">Gestión operativa</p>
              </div>
            </Link>

            <div className="flex items-center space-x-3">
              <Link
                href="/dashboard"
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-[#0A3D5C] hover:bg-gray-50 rounded-lg transition"
              >
                Dashboard
              </Link>
              <Link
                href="/despachos/nuevo"
                className="px-6 py-2 bg-gradient-to-r from-[#0A3D5C] to-[#0d5078] hover:from-[#083049] hover:to-[#0A3D5C] text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Nuevo</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Contadores superiores */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-md border-2 border-red-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Requieren acción</p>
                <p className="text-3xl font-bold text-red-600">{counters.requires_action}</p>
              </div>
              <div className="text-4xl">🔴</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md border-2 border-yellow-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Esperando terceros</p>
                <p className="text-3xl font-bold text-yellow-600">{counters.waiting_others}</p>
              </div>
              <div className="text-4xl">🟡</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md border-2 border-green-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">En tránsito</p>
                <p className="text-3xl font-bold text-green-600">{counters.in_transit}</p>
              </div>
              <div className="text-4xl">🟢</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md border-2 border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Completados</p>
                <p className="text-3xl font-bold text-gray-600">{counters.completed}</p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </div>
        </div>

        {/* Despachos agrupados */}
        {dispatches.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No hay despachos</h3>
            <p className="text-gray-600 mb-4">Crea tu primer despacho para empezar</p>
            <Link
              href="/despachos/nuevo"
              className="inline-flex items-center px-6 py-3 bg-[#0A3D5C] text-white font-bold rounded-lg hover:bg-[#083049] transition"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Crear primer despacho
            </Link>
          </div>
        ) : (
          <>
            {/* 🔴 REQUIEREN TU ACCIÓN */}
            {groupedDispatches.requires_action?.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-red-700 mb-4 flex items-center">
                  <span className="text-2xl mr-2">🔴</span>
                  REQUIEREN TU ACCIÓN ({groupedDispatches.requires_action.length})
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupedDispatches.requires_action.map(dispatch => (
                    <DispatchCard key={dispatch.id} dispatch={dispatch} />
                  ))}
                </div>
              </div>
            )}

            {/* 🟡 ESPERANDO TERCEROS */}
            {groupedDispatches.waiting_others?.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-yellow-700 mb-4 flex items-center">
                  <span className="text-2xl mr-2">🟡</span>
                  ESPERANDO TERCEROS ({groupedDispatches.waiting_others.length})
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupedDispatches.waiting_others.map(dispatch => (
                    <DispatchCard key={dispatch.id} dispatch={dispatch} />
                  ))}
                </div>
              </div>
            )}

            {/* 🟢 EN TRÁNSITO */}
            {groupedDispatches.in_transit?.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-green-700 mb-4 flex items-center">
                  <span className="text-2xl mr-2">🟢</span>
                  EN TRÁNSITO ({groupedDispatches.in_transit.length})
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupedDispatches.in_transit.map(dispatch => (
                    <DispatchCard key={dispatch.id} dispatch={dispatch} />
                  ))}
                </div>
              </div>
            )}

            {/* ✅ COMPLETADOS */}
            {groupedDispatches.completed?.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-700 mb-4 flex items-center">
                  <span className="text-2xl mr-2">✅</span>
                  COMPLETADOS ({groupedDispatches.completed.length})
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupedDispatches.completed.slice(0, 6).map(dispatch => (
                    <DispatchCard key={dispatch.id} dispatch={dispatch} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
