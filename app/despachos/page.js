'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { logActivity, getDispatchAlerts } from '@/lib/dispatchActivity'
import KanbanView from '@/components/despachos/KanbanView'
import Link from 'next/link'
import { useTranslation } from '@/lib/i18n'
import { despachosDict } from '@/lib/i18n/despachos'

export default function DespachosTableV2() {
  const [user, setUser] = useState(null)
  const [dispatches, setDispatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sortBy, setSortBy] = useState('eta')
  const [filterType, setFilterType] = useState('all')
  const [search, setSearch] = useState('')
  const [openParaDropdown, setOpenParaDropdown] = useState(null)
  const [editingETA, setEditingETA] = useState(null)
  const [viewMode, setViewMode] = useState('table')
  // Mapa { dispatchId: { 'docs_ok_at': Date, 'mrn_at': Date } } para alertas precisas
  const [stateChanges, setStateChanges] = useState({})
  // Mapa { dispatchId: { count, last } } para resumen de comentarios en la tabla
  const [commentSummary, setCommentSummary] = useState({})

  const router = useRouter()
  const supabase = createClient()
  const t = useTranslation(despachosDict)

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

      // Cargar timestamps relevantes desde dispatch_timeline para alertas precisas
      const { data: timelineRows } = await supabase
        .from('dispatch_timeline')
        .select('dispatch_id, event_type, new_value, created_at')
        .in('event_type', ['stage_docs', 'dua_status', 'stage_levante'])
        .order('created_at', { ascending: false })

      const changes = {}
      ;(timelineRows || []).forEach(row => {
        if (!changes[row.dispatch_id]) changes[row.dispatch_id] = {}
        const bucket = changes[row.dispatch_id]
        // El primero que vemos por (dispatch, key) es el más reciente porque venimos ordenados desc
        if (row.event_type === 'stage_docs' && row.new_value === 'ok' && !bucket.docs_ok_at) {
          bucket.docs_ok_at = row.created_at
        }
        if (row.event_type === 'dua_status' && row.new_value === 'mrn' && !bucket.mrn_at) {
          bucket.mrn_at = row.created_at
        }
      })
      setStateChanges(changes)

      // Resumen de comentarios por despacho
      const { data: commentRows } = await supabase
        .from('dispatch_comments')
        .select('dispatch_id, content, created_at')
        .order('created_at', { ascending: false })

      const summary = {}
      ;(commentRows || []).forEach(row => {
        if (!summary[row.dispatch_id]) {
          summary[row.dispatch_id] = { count: 0, last: row.content }
        }
        summary[row.dispatch_id].count += 1
      })
      setCommentSummary(summary)
    } catch (error) {
      console.error('Error cargando despachos:', error)
    } finally {
      setLoading(false)
    }
  }

  // Actualizar campo
  const updateField = async (dispatchId, field, value) => {
    setSaving(true)
    try {
      // Capturar valor anterior para el log de actividad
      const currentDispatch = dispatches.find(d => d.id === dispatchId)
      const oldValue = currentDispatch ? currentDispatch[field] : null

      const { error } = await supabase
        .from('dispatches')
        .update({
          [field]: value,
          updated_at: new Date().toISOString()
        })
        .eq('id', dispatchId)

      if (error) throw error

      setDispatches(prev => prev.map(d =>
        d.id === dispatchId ? { ...d, [field]: value } : d
      ))

      // Log de actividad (fire & forget — no bloquea ni rompe el guardado)
      if (user?.id) {
        void logActivity(supabase, {
          dispatchId,
          userId: user.id,
          field,
          oldValue,
          newValue: value
        })
      }
    } catch (error) {
      console.error('Error actualizando:', error)
    } finally {
      setSaving(false)
    }
  }

  // Ciclar estado simple (4 estados)
  const cycleStage = (current) => {
    const cycle = {
      'pending': 'in_progress',
      'in_progress': 'ok',
      'ok': 'blocked',
      'blocked': 'pending',
      'na': 'pending'
    }
    return cycle[current] || 'in_progress'
  }

  // Detectar alertas — usa el helper compartido
  const getAlerts = (dispatch) => getDispatchAlerts(dispatch, stateChanges[dispatch.id])

  // Badge con estado
  const StatusBadge = ({ status, onClick }) => {
    const configs = {
      'ok': { icon: '✓', text: 'OK', color: 'bg-green-100 text-green-700 border-green-300' },
      'in_progress': { icon: '⏳', text: 'Pedidos', color: 'bg-orange-100 text-orange-700 border-orange-300' },
      'blocked': { icon: '⚠️', text: 'Problema', color: 'bg-red-100 text-red-700 border-red-300' },
      'pending': { icon: '-', text: 'Pendiente', color: 'bg-gray-100 text-gray-600 border-gray-300' },
      'na': { icon: '-', text: 'N/A', color: 'bg-gray-50 text-gray-400 border-gray-200' }
    }

    const config = configs[status] || configs.pending

    return (
      <button
        onClick={onClick}
        className={`px-2 py-1 rounded border text-xs font-medium hover:shadow transition whitespace-nowrap ${config.color}`}
      >
        {config.icon} {config.text}
      </button>
    )
  }

  // Dropdown component
  const Dropdown = ({ value, options, onChange, className = '' }) => {
    return (
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className={`px-2 py-1 text-xs border border-gray-300 rounded hover:border-[#0A3D5C] focus:border-[#0A3D5C] focus:ring-1 focus:ring-[#0A3D5C] outline-none ${className}`}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    )
  }

  // Agrupar y ordenar
  const groupedDispatches = () => {
    let filtered = dispatches

    if (search) {
      filtered = filtered.filter(d =>
        d.expediente_number?.toLowerCase().includes(search.toLowerCase()) ||
        d.client_name?.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(d => {
        if (filterType === 'import') return d.operation_type?.startsWith('import')
        if (filterType === 'export') return d.operation_type?.startsWith('export')
        if (filterType === 'transit') return d.operation_type === 'transit'
        return true
      })
    }

    const imports = filtered.filter(d => d.operation_type?.startsWith('import'))
    const exports = filtered.filter(d => d.operation_type?.startsWith('export'))
    const transits = filtered.filter(d => d.operation_type === 'transit')

    const sortFn = (a, b) => {
      if (sortBy === 'eta') {
        if (!a.eta) return 1
        if (!b.eta) return -1
        return new Date(a.eta) - new Date(b.eta)
      }
      if (sortBy === 'expediente') {
        return a.expediente_number?.localeCompare(b.expediente_number)
      }
      return 0
    }

    return {
      imports: imports.sort(sortFn),
      exports: exports.sort(sortFn),
      transits: transits.sort(sortFn)
    }
  }

  const groups = groupedDispatches()
  const totalDispatches = groups.imports.length + groups.exports.length + groups.transits.length

  const allAlerts = dispatches.flatMap(d => getAlerts(d))
  const criticalCount = allAlerts.filter(a => a.type === 'critical').length
  const warningCount = allAlerts.filter(a => a.type === 'warning').length

  // Fila de despacho
  const DispatchRow = ({ dispatch }) => {
    const alerts = getAlerts(dispatch)
    const significantAlerts = alerts.filter(a => a.type !== 'info')
    const topType = significantAlerts.find(a => a.type === 'critical')?.type
      || significantAlerts.find(a => a.type === 'warning')?.type
      || null
    const alert = significantAlerts[0] || null
    const isImport = dispatch.operation_type?.startsWith('import')
    const eta = dispatch.eta ? new Date(dispatch.eta) : null
    const etaDays = eta ? Math.ceil((eta - new Date()) / (1000 * 60 * 60 * 24)) : null

    return (
      <tr
        className={`border-b border-gray-200 hover:bg-blue-50 transition ${
          topType === 'critical' ? 'border-l-4 border-l-red-500 bg-red-50' :
          topType === 'warning' ? 'border-l-4 border-l-orange-500 bg-orange-50' :
          ''
        }`}
      >
        {/* Expediente */}
        <td className="px-3 py-3">
          <button
            onClick={() => router.push(`/despachos/${dispatch.id}`)}
            className="text-left"
          >
            <div className="flex items-center space-x-2">
              <span className="text-lg">
                {dispatch.operation_type?.startsWith('import') ? '🚢' :
                 dispatch.operation_type?.startsWith('export') ? '📤' : '🔄'}
              </span>
              <div>
                <p className="text-xs font-bold text-[#0A3D5C] hover:underline">
                  {dispatch.expediente_number}
                </p>
                <p className="text-xs text-gray-500 truncate max-w-[100px]">
                  {dispatch.client_name}
                </p>
              </div>
            </div>
          </button>
        </td>

        {/* ETA/ETD - Resaltado en rojo si urgente */}
        <td className="px-3 py-3">
          {editingETA === dispatch.id ? (
            <input
              type="date"
              defaultValue={dispatch.eta || ''}
              onBlur={(e) => {
                updateField(dispatch.id, 'eta', e.target.value)
                setEditingETA(null)
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  updateField(dispatch.id, 'eta', e.target.value)
                  setEditingETA(null)
                }
              }}
              className="px-2 py-1 text-xs border border-[#0A3D5C] rounded focus:ring-2 focus:ring-[#0A3D5C]/20 outline-none"
              autoFocus
            />
          ) : (
            <button
              onClick={() => setEditingETA(dispatch.id)}
              className={`text-xs text-left hover:bg-gray-100 px-2 py-1 rounded ${
                (isImport && etaDays !== null && etaDays <= 0) || 
                (!isImport && etaDays !== null && etaDays <= 1 && etaDays >= 0)
                  ? 'font-bold text-red-600 bg-red-50'
                  : 'text-gray-600'
              }`}
            >
              {eta ? (
                <>
                  <div>{eta.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}</div>
                  <div className="text-xs text-gray-400">
                    {etaDays === 0 ? 'HOY' :
                     etaDays === 1 ? '+1d' :
                     etaDays === -1 ? '-1d' :
                     etaDays > 0 ? `+${etaDays}d` :
                     etaDays < 0 ? `${etaDays}d` : ''}
                  </div>
                </>
              ) : (
                <span className="text-gray-400">—</span>
              )}
            </button>
          )}
        </td>

        {/* Documentación */}
        <td className="px-2 py-3 text-center">
          <StatusBadge
            status={dispatch.stage_docs}
            onClick={() => updateField(dispatch.id, 'stage_docs', cycleStage(dispatch.stage_docs))}
          />
        </td>

        {/* Gastos - Ahora editable */}
        <td className="px-2 py-3 text-center">
          <StatusBadge
            status={dispatch.stage_gastos || 'pending'}
            onClick={() => updateField(dispatch.id, 'stage_gastos', cycleStage(dispatch.stage_gastos || 'pending'))}
          />
        </td>

        {/* Sumaria (solo import) */}
        {isImport && (
          <td className="px-2 py-3 text-center">
            <Dropdown
              value={dispatch.sumaria_status || 'sin_sumaria'}
              options={[
                { value: 'sin_sumaria', label: 'Sin Sumaria' },
                { value: 'pte_activacion', label: 'Pte activación' },
                { value: 'ok', label: '✓ OK' }
              ]}
              onChange={(value) => updateField(dispatch.id, 'sumaria_status', value)}
              className={
                dispatch.sumaria_status === 'ok' ? 'bg-green-50 text-green-700 border-green-300' :
                dispatch.sumaria_status === 'pte_activacion' ? 'bg-orange-50 text-orange-700 border-orange-300' :
                'bg-gray-50 text-gray-600'
              }
            />
          </td>
        )}

        {/* Paraaduaneros - Dropdown Sí/No */}
        <td className="px-2 py-3 text-center">
          <Dropdown
            value={dispatch.has_paraaduaneros ? 'si' : 'no'}
            options={[
              { value: 'no', label: 'No' },
              { value: 'si', label: 'Sí' }
            ]}
            onChange={(value) => {
              updateField(dispatch.id, 'has_paraaduaneros', value === 'si')
              if (value === 'no') {
                updateField(dispatch.id, 'paraaduaneros_types', null)
              }
            }}
            className={
              dispatch.has_paraaduaneros 
                ? 'bg-orange-50 text-orange-700 border-orange-300 font-medium' 
                : 'bg-gray-50 text-gray-600'
            }
          />
        </td>

        {/* Tipo Paraaduaneros - Con expedientes */}
        <td className="px-2 py-3 text-center">
          {dispatch.has_paraaduaneros ? (
            <div className="relative">
              <button
                onClick={() => setOpenParaDropdown(openParaDropdown === dispatch.id ? null : dispatch.id)}
                className="px-2 py-1 text-xs border border-gray-300 rounded hover:border-[#0A3D5C] hover:bg-gray-50 transition w-full min-h-[32px]"
              >
                {dispatch.paraaduaneros_types ? (
                  <div className="flex flex-wrap gap-1 justify-center">
                    {(() => {
                      try {
                        const types = JSON.parse(dispatch.paraaduaneros_types)
                        return types.map(item => (
                          <span key={item.code} className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium whitespace-nowrap">
                            {item.code} {item.expediente && `#${item.expediente}`}
                          </span>
                        ))
                      } catch {
                        return <span className="text-gray-400">Error</span>
                      }
                    })()}
                  </div>
                ) : (
                  <span className="text-gray-400">{t('list.addComment')}</span>
                )}
              </button>

              {/* Modal con expedientes */}
              {openParaDropdown === dispatch.id && (
                <div 
                  className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                  onClick={() => setOpenParaDropdown(null)}
                >
                  <div 
                    className="bg-white rounded-lg shadow-2xl p-5 w-[600px] max-h-[600px] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center justify-between">
                      <span>{t('list.paraaduanerosTitle')}</span>
                      <button
                        onClick={() => setOpenParaDropdown(null)}
                        className="text-gray-400 hover:text-gray-600 text-lg"
                      >
                        ✕
                      </button>
                    </h4>
                    
                    <div className="space-y-3">
                      {[
                        { code: 'ROHS', label: 'ROHS/RAEE' },
                        { code: 'SOIV', label: 'SOIVRE' },
                        { code: 'VETE', label: 'VETERINARIO' },
                        { code: 'FITO', label: 'FITOSANITARIO' },
                        { code: 'FARM', label: 'FARMACIA' },
                        { code: 'SANI', label: 'SANIDAD EXT' },
                        { code: 'ECO', label: 'ECOLÓGICO' },
                        { code: 'CITE', label: 'CITES' },
                        { code: 'OTRO', label: 'OTROS' }
                      ].map(para => {
                        let currentTypes = []
                        try {
                          currentTypes = dispatch.paraaduaneros_types ? JSON.parse(dispatch.paraaduaneros_types) : []
                        } catch {}
                        
                        const existingItem = currentTypes.find(t => t.code === para.code)
                        const isChecked = !!existingItem

                        return (
                          <div
                            key={para.code}
                            className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                let newTypes
                                if (e.target.checked) {
                                  newTypes = [...currentTypes, { code: para.code, expediente: '' }]
                                } else {
                                  newTypes = currentTypes.filter(t => t.code !== para.code)
                                }
                                updateField(dispatch.id, 'paraaduaneros_types', JSON.stringify(newTypes))
                              }}
                              className="w-4 h-4 text-[#0A3D5C] border-gray-300 rounded focus:ring-[#0A3D5C]"
                            />
                            <label className="flex-1 text-sm font-medium text-gray-700 min-w-[140px]">
                              {para.label}
                            </label>
                            <input
                              type="text"
                              placeholder="Nº Expediente"
                              value={existingItem?.expediente || ''}
                              disabled={!isChecked}
                              onChange={(e) => {
                                const newTypes = currentTypes.map(t => 
                                  t.code === para.code 
                                    ? { ...t, expediente: e.target.value }
                                    : t
                                )
                                updateField(dispatch.id, 'paraaduaneros_types', JSON.stringify(newTypes))
                              }}
                              className={`flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:border-[#0A3D5C] focus:ring-1 focus:ring-[#0A3D5C] outline-none ${
                                !isChecked ? 'bg-gray-100 cursor-not-allowed' : ''
                              }`}
                            />
                          </div>
                        )
                      })}
                    </div>

                    <div className="mt-5 pt-4 border-t border-gray-200 flex justify-end space-x-2">
                      <button
                        onClick={() => {
                          updateField(dispatch.id, 'paraaduaneros_types', null)
                        }}
                        className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        {t('common.cancel')}
                      </button>
                      <button
                        onClick={() => setOpenParaDropdown(null)}
                        className="px-4 py-2 text-sm bg-[#0A3D5C] text-white rounded-lg hover:bg-[#083049]"
                      >
                        Guardar y cerrar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <span className="text-xs text-gray-400">-</span>
          )}
        </td>

        {/* EUR1/ATR - Solo exportaciones */}
        {!isImport && dispatch.operation_type?.startsWith('export') && (
          <td className="px-2 py-3 text-center">
            <div className="space-y-1">
              <Dropdown
                value={dispatch.eur1_required ? 'si' : 'no'}
                options={[
                  { value: 'no', label: 'NO' },
                  { value: 'si', label: 'SÍ' }
                ]}
                onChange={(value) => {
                  updateField(dispatch.id, 'eur1_required', value === 'si')
                  if (value === 'no') {
                    updateField(dispatch.id, 'eur1_emitted', false)
                  }
                }}
                className={
                  dispatch.eur1_required
                    ? 'bg-blue-50 text-blue-700 border-blue-300 font-medium'
                    : 'bg-gray-50 text-gray-600'
                }
              />
              
              {/* Emitido si está requerido */}
              {dispatch.eur1_required && (
                <button
                  onClick={() => updateField(dispatch.id, 'eur1_emitted', !dispatch.eur1_emitted)}
                  className={`w-full px-2 py-1 rounded border text-xs font-medium transition ${
                    dispatch.eur1_emitted
                      ? 'bg-green-100 text-green-700 border-green-300'
                      : 'bg-orange-100 text-orange-700 border-orange-300'
                  }`}
                >
                  {dispatch.eur1_emitted ? '✓ Emitido' : '⏳ Pdte'}
                </button>
              )}
            </div>
          </td>
        )}

        {/* DUA - Con campo MRN si aplica */}
        <td className="px-2 py-3 text-center">
          <div className="space-y-1">
            <Dropdown
              value={dispatch.dua_status || 'pendiente'}
              options={[
                { value: 'pendiente', label: t('stages.pending') },
                { value: 'picado', label: 'Picado' },
                { value: 'mrn', label: 'MRN' }
              ]}
              onChange={(value) => {
                updateField(dispatch.id, 'dua_status', value)
                if (value !== 'mrn') {
                  updateField(dispatch.id, 'mrn_number', null)
                }
              }}
              className={
                dispatch.dua_status === 'mrn' ? 'bg-green-50 text-green-700 border-green-300 font-medium' :
                dispatch.dua_status === 'picado' ? 'bg-blue-50 text-blue-700 border-blue-300 font-medium' :
                'bg-gray-50 text-gray-600'
              }
            />
            
            {/* Campo MRN si está seleccionado */}
            {dispatch.dua_status === 'mrn' && (
              <input
                type="text"
                placeholder="Ej: 25ES00000123456789012345"
                defaultValue={dispatch.mrn_number || ''}
                onBlur={(e) => {
                  if (e.target.value !== dispatch.mrn_number) {
                    updateField(dispatch.id, 'mrn_number', e.target.value || null)
                  }
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    updateField(dispatch.id, 'mrn_number', e.target.value || null)
                    e.target.blur()
                  }
                }}
                maxLength={30}
                className="w-full px-2 py-1.5 text-xs font-mono border border-gray-300 rounded focus:border-[#0A3D5C] focus:ring-1 focus:ring-[#0A3D5C] outline-none"
              />
            )}
          </div>
        </td>

        {/* Levante - Solo Pendiente/OK */}
        <td className="px-2 py-3 text-center">
          <button
            onClick={() => {
              const newValue = dispatch.stage_levante === 'ok' ? 'pending' : 'ok'
              updateField(dispatch.id, 'stage_levante', newValue)
            }}
            className={`px-2 py-1 rounded border text-xs font-medium hover:shadow transition whitespace-nowrap ${
              dispatch.stage_levante === 'ok'
                ? 'bg-green-100 text-green-700 border-green-300'
                : 'bg-gray-100 text-gray-600 border-gray-300'
            }`}
          >
            {dispatch.stage_levante === 'ok' ? '✓ OK' : '- Pendiente'}
          </button>
        </td>

        {/* TDocs */}
        <td className="px-2 py-3 text-center">
          <StatusBadge
            status={dispatch.stage_closure}
            onClick={() => updateField(dispatch.id, 'stage_closure', cycleStage(dispatch.stage_closure))}
          />
        </td>

        {/* Notas / Alertas / Comentarios */}
        <td className="px-2 py-3">
          {(() => {
            const summary = commentSummary[dispatch.id]
            return (
            <div className="flex items-center space-x-2">
              {/* Alertas automáticas (hasta 2 + badge "+N") */}
              {alerts.length > 0 && (
                <div className="flex flex-wrap gap-1 max-w-[260px]">
                  {alerts.slice(0, 2).map((a, i) => (
                    <span
                      key={i}
                      title={a.detail || a.text}
                      className={`text-xs font-bold px-2 py-1 rounded whitespace-nowrap ${
                        a.type === 'critical' ? 'bg-red-100 text-red-700' :
                        a.type === 'warning' ? 'bg-orange-100 text-orange-700' :
                        'bg-blue-50 text-blue-700'
                      }`}
                    >
                      {a.text}
                    </span>
                  ))}
                  {alerts.length > 2 && (
                    <span
                      className="text-xs font-bold px-2 py-1 rounded bg-gray-200 text-gray-700"
                      title={alerts.slice(2).map(a => a.text).join(', ')}
                    >
                      +{alerts.length - 2}
                    </span>
                  )}
                </div>
              )}

              {/* Resumen del hilo de comentarios — clic abre el detalle */}
              <button
                onClick={() => router.push(`/despachos/${dispatch.id}#comentarios`)}
                className={`flex-1 text-left px-2 py-1 text-xs rounded hover:bg-gray-100 ${
                  summary?.last ? 'text-gray-700' : 'text-gray-400'
                }`}
                title={summary?.last || t('list.addComment')}
              >
                {summary?.last ? (
                  <span className="flex items-center gap-1">
                    <span>💬</span>
                    <span className="truncate max-w-[180px] inline-block align-bottom">{summary.last}</span>
                    {summary.count > 1 && (
                      <span className="ml-1 px-1.5 py-0.5 bg-gray-200 text-gray-700 rounded text-[10px] font-semibold">
                        {summary.count}
                      </span>
                    )}
                  </span>
                ) : (
                  <span>💬 {t('list.addComment')}</span>
                )}
              </button>
            </div>
            )
          })()}
        </td>
      </tr>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-[#0A3D5C]"></div>
          <p className="text-gray-600 mt-4">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-[1800px] mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href="/" className="flex items-center space-x-2">
                <img src="/logo.png" alt="LexAduana" className="h-8 w-8" />
                <span className="text-lg font-bold text-[#0A3D5C]">Despachos</span>
              </Link>
              <span className="text-sm text-gray-500">({totalDispatches})</span>
            </div>

            <div className="flex items-center space-x-2">
              {criticalCount > 0 && (
                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">
                  Críticos: {criticalCount}
                </span>
              )}
              {warningCount > 0 && (
                <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded">
                  Atención: {warningCount}
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder={t('list.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:border-[#0A3D5C] focus:ring-1 focus:ring-[#0A3D5C] outline-none w-48"
              />

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:border-[#0A3D5C] focus:ring-1 focus:ring-[#0A3D5C] outline-none"
              >
                <option value="all">{t('list.filterAll')}</option>
                <option value="import">Importaciones</option>
                <option value="export">Exportaciones</option>
                <option value="transit">Tránsitos</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:border-[#0A3D5C] focus:ring-1 focus:ring-[#0A3D5C] outline-none"
              >
                <option value="eta">{t('list.colEta')}</option>
                <option value="expediente">{t('list.colExpediente')}</option>
              </select>

              <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                    viewMode === 'table'
                      ? 'bg-white text-[#0A3D5C] shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {t('list.tableView')}
                </button>
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                    viewMode === 'kanban'
                      ? 'bg-white text-[#0A3D5C] shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {t('list.kanbanView')}
                </button>
              </div>

              <Link
                href="/despachos/nuevo"
                className="px-4 py-1 bg-[#0A3D5C] text-white text-sm font-bold rounded-lg hover:bg-[#083049] transition"
              >
                + {t('list.newDispatch')}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Tablas / Kanban */}
      <div className="max-w-[1800px] mx-auto px-4 py-4">
        {viewMode === 'kanban' ? (
          <KanbanView
            dispatches={[...groups.imports, ...groups.exports, ...groups.transits]}
            getAlerts={getAlerts}
            onNavigate={(id) => router.push(`/despachos/${id}`)}
          />
        ) : (
        <>
        {/* IMPORTACIONES */}
        {groups.imports.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-bold text-gray-700 mb-2 flex items-center space-x-2">
              <span>🚢 IMPORTACIONES</span>
              <span className="text-xs text-gray-500">({groups.imports.length})</span>
            </h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 w-32">{t('list.colExpediente')}</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 w-20">{t('list.colEta')}</th>
                    <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 w-24">{t('list.colDocs')}</th>
                    <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 w-24">Gastos</th>
                    <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 w-28">{t('list.colSumaria')}</th>
                    <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 w-28">{t('list.colParaaduaneros')}</th>
                    <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 w-48">{t('list.colType')}</th>
                    <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 w-48">{t('list.colDua')}</th>
                    <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 w-24">{t('list.colLevante')}</th>
                    <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 w-24">{t('list.colClosure')}</th>
                    <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700">{t('list.colNotes')}</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.imports.map(dispatch => (
                    <DispatchRow key={dispatch.id} dispatch={dispatch} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* EXPORTACIONES */}
        {groups.exports.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-bold text-gray-700 mb-2 flex items-center space-x-2">
              <span>📤 EXPORTACIONES</span>
              <span className="text-xs text-gray-500">({groups.exports.length})</span>
            </h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 w-32">{t('list.colExpediente')}</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 w-20">{t('list.colEtd')}</th>
                    <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 w-24">{t('list.colDocs')}</th>
                    <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 w-24">Gastos</th>
                    <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 w-28">{t('list.colParaaduaneros')}</th>
                    <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 w-48">{t('list.colType')}</th>
                    <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 w-32">EUR1/ATR</th>
                    <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 w-48">{t('list.colDua')}</th>
                    <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 w-24">{t('list.colLevante')}</th>
                    <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 w-24">{t('list.colClosure')}</th>
                    <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700">{t('list.colNotes')}</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.exports.map(dispatch => (
                    <DispatchRow key={dispatch.id} dispatch={dispatch} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TRÁNSITOS */}
        {groups.transits.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-bold text-gray-700 mb-2 flex items-center space-x-2">
              <span>🔄 TRÁNSITOS</span>
              <span className="text-xs text-gray-500">({groups.transits.length})</span>
            </h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 w-32">{t('list.colExpediente')}</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 w-20">{t('list.sortDate')}</th>
                    <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 w-24">{t('list.colDocs')}</th>
                    <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 w-28">T1/T2</th>
                    <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 w-24">{t('list.colClosure')}</th>
                    <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700">{t('list.colNotes')}</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.transits.map(dispatch => (
                    <DispatchRow key={dispatch.id} dispatch={dispatch} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {totalDispatches === 0 && (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-600 mb-4">{t('list.emptyTitle')}</p>
            <Link
              href="/despachos/nuevo"
              className="inline-flex items-center px-6 py-3 bg-[#0A3D5C] text-white font-bold rounded-lg hover:bg-[#083049] transition"
            >
              + {t('list.emptyDesc')}
            </Link>
          </div>
        )}
        </>
        )}
      </div>

      {/* Leyenda */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 px-4">
        <div className="max-w-[1800px] mx-auto flex items-center space-x-6 text-xs text-gray-600">
          <span className="font-semibold">{t('list.sortStatus')}:</span>
          <div className="flex items-center space-x-1">
            <span className="px-1 py-0.5 bg-green-100 text-green-700 border border-green-300 rounded">✓ OK</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="px-1 py-0.5 bg-orange-100 text-orange-700 border border-orange-300 rounded">⏳ Pedidos</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="px-1 py-0.5 bg-red-100 text-red-700 border border-red-300 rounded">⚠️ Problema</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="px-1 py-0.5 bg-gray-100 text-gray-600 border border-gray-300 rounded">- Pendiente</span>
          </div>
        </div>
      </div>
    </div>
  )
}
