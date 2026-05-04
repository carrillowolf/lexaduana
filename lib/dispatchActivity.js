import { safeLogger } from '@/lib/safe-logger'
// Helpers para el historial de actividad de despachos.
// Usa la tabla existente `dispatch_timeline`.

export const FIELD_LABELS = {
  stage_docs: 'Documentación',
  stage_gastos: 'Gastos',
  stage_sumaria: 'Sumaria',
  stage_despacho: 'Despacho',
  stage_dua: 'DUA',
  stage_levante: 'Levante',
  stage_closure: 'TDocs/Cierre',
  stage_paraaduaneros: 'Paraaduaneros (etapa)',
  dua_status: 'Estado DUA',
  mrn_number: 'MRN',
  eta: 'ETA/ETD',
  notes: 'Notas',
  has_paraaduaneros: 'Paraaduaneros',
  paraaduaneros_types: 'Tipos paraaduaneros',
  eur1_required: 'EUR.1 requerido',
  eur1_emitted: 'EUR.1 emitido',
  sumaria_status: 'Estado sumaria',
  operation_type: 'Tipo operación',
  client_name: 'Cliente',
  expediente_number: 'Nº Expediente',
  expenses_status: 'Estado gastos'
}

export const VALUE_LABELS = {
  pending: 'Pendiente',
  in_progress: 'En curso',
  ok: 'OK',
  blocked: 'Problema',
  na: 'N/A',
  sin_sumaria: 'Sin sumaria',
  pte_activacion: 'Pte. activación',
  pendiente: 'Pendiente',
  picado: 'Picado',
  mrn: 'MRN asignado',
  true: 'Sí',
  false: 'No',
  '': '—'
}

export const getFieldLabel = (field) => FIELD_LABELS[field] || field

export const getValueLabel = (value) => {
  if (value === null || value === undefined || value === '') return '—'
  const key = String(value)
  if (VALUE_LABELS[key] !== undefined) return VALUE_LABELS[key]
  // Si parece JSON (paraaduaneros_types), no destriparlo aquí
  if (key.startsWith('[') || key.startsWith('{')) return 'actualizado'
  return key
}

// Inserta un evento en dispatch_timeline. Es "fire and forget":
// nunca lanza error al llamador para no bloquear el guardado del campo.
export const logActivity = async (supabase, { dispatchId, userId, field, oldValue, newValue }) => {
  try {
    const oldStr = oldValue === null || oldValue === undefined ? null : String(oldValue)
    const newStr = newValue === null || newValue === undefined ? null : String(newValue)
    if (oldStr === newStr) return
    await supabase.from('dispatch_timeline').insert({
      dispatch_id: dispatchId,
      created_by: userId,
      event_type: field,
      old_value: oldStr,
      new_value: newStr,
      description: getFieldLabel(field)
    })
  } catch (err) {
    safeLogger.warn('[dispatchActivity] no se pudo registrar evento:', err?.message || err)
  }
}

// Helper: parsea paraaduaneros_types con tolerancia (string JSON, jsonb, null)
export const parseParaTypes = (raw) => {
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) || [] } catch { return [] }
  }
  return []
}

// Calcula las alertas activas de un despacho.
// `stateChanges` opcional: { docs_ok_at, mrn_at } con timestamps reales (de dispatch_timeline).
export const getDispatchAlerts = (dispatch, stateChanges = {}) => {
  const alerts = []
  if (!dispatch) return alerts
  const now = new Date()
  const updated = dispatch.updated_at ? parseSupabaseDate(dispatch.updated_at) : now
  const hoursSinceUpdate = (now - updated) / (1000 * 60 * 60)

  const isImport = dispatch.operation_type?.startsWith('import')
  const isExport = dispatch.operation_type?.startsWith('export')
  const eta = dispatch.eta ? new Date(dispatch.eta) : null
  const etaDays = eta ? Math.ceil((eta - now) / (1000 * 60 * 60 * 24)) : null

  if (isImport && eta && etaDays <= 0 && dispatch.sumaria_status !== 'ok' && dispatch.stage_sumaria !== 'ok') {
    alerts.push({ type: 'critical', text: 'ETA CUMPLIDA', detail: 'Sumaria no activada' })
  }
  if (isExport && eta && etaDays <= 1 && etaDays >= 0) {
    alerts.push({ type: 'warning', text: 'ETD MAÑANA' })
  }
  if (dispatch.stage_docs === 'ok' && dispatch.dua_status === 'pendiente' && stateChanges.docs_ok_at) {
    const h = (now - parseSupabaseDate(stateChanges.docs_ok_at)) / (1000 * 60 * 60)
    if (h > 48) alerts.push({ type: 'warning', text: 'DUA PENDIENTE', detail: 'Docs listos hace +48h' })
  }
  if (isImport && eta && etaDays !== null && etaDays <= 1 && etaDays >= 0 && dispatch.has_paraaduaneros) {
    const types = parseParaTypes(dispatch.paraaduaneros_types)
    const pending = types.filter(t => !t.expediente)
    if (pending.length > 0) {
      alerts.push({ type: 'warning', text: 'PARAADUANEROS', detail: `${pending.length} sin expediente y ETA inminente` })
    }
  }
  if (dispatch.dua_status === 'mrn' && dispatch.stage_levante !== 'ok' && stateChanges.mrn_at) {
    const h = (now - parseSupabaseDate(stateChanges.mrn_at)) / (1000 * 60 * 60)
    if (h > 48) alerts.push({ type: 'warning', text: 'LEVANTE PENDIENTE', detail: 'MRN asignado hace +48h' })
  }
  const blockedStages = ['stage_docs', 'stage_gastos', 'stage_dua', 'stage_levante'].filter(s => dispatch[s] === 'blocked')
  if (blockedStages.length > 0 && hoursSinceUpdate > 24) {
    const labels = { stage_docs: 'Docs', stage_gastos: 'Gastos', stage_dua: 'DUA', stage_levante: 'Levante' }
    alerts.push({ type: 'critical', text: 'BLOQUEADO +24H', detail: blockedStages.map(s => labels[s]).join(', ') })
  }
  if (isExport && dispatch.eur1_required && !dispatch.eur1_emitted && etaDays !== null && etaDays <= 2 && etaDays >= 0) {
    alerts.push({ type: 'warning', text: 'EUR.1 PENDIENTE', detail: 'Requerido y ETD en ≤2 días' })
  }
  if (!dispatch.eta) {
    alerts.push({ type: 'info', text: 'SIN FECHA' })
  }
  return alerts
}

// Parsea timestamps de Supabase. Las columnas `timestamp without time zone`
// se devuelven sin sufijo de tz; las tratamos como UTC (es como las almacena
// Postgres en este proyecto) añadiendo 'Z'. Si ya trae tz, se respeta.
export const parseSupabaseDate = (value) => {
  if (!value) return null
  if (typeof value !== 'string') return new Date(value)
  // Tiene tz si termina en Z o tiene +HH:MM / -HH:MM (tras la T)
  const hasTz = /Z$|[+-]\d{2}:?\d{2}$/.test(value)
  return new Date(hasTz ? value : value + 'Z')
}

// Formato relativo "hace 2h", "ayer", "15/03"
export const formatRelativeTime = (dateString) => {
  if (!dateString) return ''
  const date = parseSupabaseDate(dateString)
  if (!date) return ''
  const now = new Date()
  const diffMs = now - date
  const diffMin = Math.floor(diffMs / 60000)
  const diffH = Math.floor(diffMs / 3600000)
  const diffD = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return 'ahora'
  if (diffMin < 60) return `hace ${diffMin}m`
  if (diffH < 24) return `hace ${diffH}h`
  if (diffD === 1) return 'ayer'
  if (diffD < 7) return `hace ${diffD}d`
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })
}
