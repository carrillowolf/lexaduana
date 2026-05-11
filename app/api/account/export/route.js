import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { safeLogger } from '@/lib/safe-logger'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const LEXADUANA_VERSION = '1.0'
const FORMAT_VERSION = '1.0'

// Columnas que no deben aparecer en el export: hashes internos para integridad
// pseudonimizada (Phase 8) y cualquier columna marcada como _deprecated_*.
// Los datos del usuario en claro (user_id, created_by) sí se incluyen.
const INTERNAL_COLUMN_PATTERNS = [
  /_hash$/,
  /^_deprecated_/,
]

function stripInternal(row) {
  if (!row || typeof row !== 'object') return row
  const cleaned = {}
  for (const [key, value] of Object.entries(row)) {
    if (INTERNAL_COLUMN_PATTERNS.some((re) => re.test(key))) continue
    cleaned[key] = value
  }
  return cleaned
}

function stripInternalAll(rows) {
  if (!Array.isArray(rows)) return []
  return rows.map(stripInternal)
}

// Ejecuta una query y devuelve siempre un array. Si falla, se loguea y se
// devuelve []. Política: export parcial > export bloqueado por una tabla.
async function safeQuery(label, queryFn) {
  try {
    const { data, error } = await queryFn()
    if (error) {
      safeLogger.error(`[account/export] ${label} error:`, error.message)
      return []
    }
    return data || []
  } catch (err) {
    safeLogger.error(`[account/export] ${label} threw:`, err?.message || err)
    return []
  }
}

function formatDateForFilename(date) {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  return `${y}${m}${d}`
}

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = user.id
  const now = new Date()

  // --- Perfil: solo email + company_name + created_at (decisión Carlos).
  const profileRow = await safeQuery('user_profiles', () =>
    supabase
      .from('user_profiles')
      .select('email, company_name, created_at')
      .eq('id', userId)
      .maybeSingle()
      .then((res) => ({ data: res.data ? [res.data] : [], error: res.error }))
  )

  // --- Tablas planas filtradas por user_id.
  const [
    consents,
    classifications,
    invoiceExtractions,
    rrmRequests,
    cbamCalculatorSaves,
    monitoredCodes,
    favorites,
    userCalculations,
  ] = await Promise.all([
    safeQuery('user_consents', () =>
      supabase.from('user_consents').select('*').eq('user_id', userId)
    ),
    safeQuery('classification_logs', () =>
      supabase.from('classification_logs').select('*').eq('user_id', userId)
    ),
    safeQuery('invoice_extractions', () =>
      supabase.from('invoice_extractions').select('*').eq('user_id', userId)
    ),
    safeQuery('rrm_requests', () =>
      supabase.from('rrm_requests').select('*').eq('user_id', userId)
    ),
    safeQuery('cbam_calculator_saves', () =>
      supabase.from('cbam_calculator_saves').select('*').eq('user_id', userId)
    ),
    safeQuery('monitored_codes', () =>
      supabase.from('monitored_codes').select('*').eq('user_id', userId)
    ),
    safeQuery('user_favorites', () =>
      supabase.from('user_favorites').select('*').eq('user_id', userId)
    ),
    safeQuery('user_calculations', () =>
      supabase.from('user_calculations').select('*').eq('user_id', userId)
    ),
  ])

  // --- Dispatches: dos secciones (created_by_me / assigned_to_me_only).
  const dispatchesCreatedByMe = await safeQuery('dispatches.created_by_me', () =>
    supabase.from('dispatches').select('*').eq('created_by', userId)
  )

  const dispatchesAssignedRaw = await safeQuery('dispatches.assigned_to_me', () =>
    supabase
      .from('dispatches')
      .select('id, created_at, status, assigned_to, created_by')
      .eq('assigned_to', userId)
      .neq('created_by', userId)
  )

  // --- IDs de dispatches "propios" del user (creador o asignado): se usan para
  // restringir timeline y comments a estos dispatches y evitar exfiltrar texto
  // libre (description/old_value/new_value/comment_text) de dispatches de
  // terceros aunque la fila la haya creado el propio user.
  const ownedDispatchIds = Array.from(
    new Set([
      ...dispatchesCreatedByMe.map((d) => d.id),
      ...dispatchesAssignedRaw.map((d) => d.id),
    ])
  ).filter(Boolean)

  // --- dispatch_timeline + dispatch_comments: ambos restringidos a sus
  // dispatches Y autoría del user, en paralelo.
  const [dispatchTimeline, dispatchComments] = ownedDispatchIds.length === 0
    ? [[], []]
    : await Promise.all([
        safeQuery('dispatch_timeline', () =>
          supabase
            .from('dispatch_timeline')
            .select('*')
            .eq('created_by', userId)
            .in('dispatch_id', ownedDispatchIds)
        ),
        safeQuery('dispatch_comments', () =>
          supabase
            .from('dispatch_comments')
            .select('*')
            .eq('user_id', userId)
            .in('dispatch_id', ownedDispatchIds)
        ),
      ])

  // --- CBAM advisory: requests + children anidados por request_id.
  const advisoryRequests = await safeQuery('cbam_advisory_requests', () =>
    supabase.from('cbam_advisory_requests').select('*').eq('user_id', userId)
  )

  const advisoryRequestIds = advisoryRequests.map((r) => r.id).filter(Boolean)

  const [advisoryDocuments, advisoryProducts, advisoryReports, advisoryDownloads] =
    advisoryRequestIds.length === 0
      ? [[], [], [], []]
      : await Promise.all([
          safeQuery('cbam_advisory_documents', () =>
            supabase
              .from('cbam_advisory_documents')
              .select('*')
              .in('request_id', advisoryRequestIds)
          ),
          safeQuery('cbam_advisory_products', () =>
            supabase
              .from('cbam_advisory_products')
              .select('*')
              .in('request_id', advisoryRequestIds)
          ),
          safeQuery('cbam_advisory_reports', () =>
            supabase
              .from('cbam_advisory_reports')
              .select('*')
              .in('request_id', advisoryRequestIds)
          ),
          safeQuery('cbam_advisory_report_downloads', () =>
            supabase
              .from('cbam_advisory_report_downloads')
              .select('*')
              .in('request_id', advisoryRequestIds)
          ),
        ])

  // Indexar children por request_id para merge eficiente.
  const groupByRequestId = (rows) => {
    const map = new Map()
    for (const row of rows) {
      const key = row.request_id
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(stripInternal(row))
    }
    return map
  }

  const docsByReq = groupByRequestId(advisoryDocuments)
  const prodsByReq = groupByRequestId(advisoryProducts)
  const reportsByReq = groupByRequestId(advisoryReports)
  const downloadsByReq = groupByRequestId(advisoryDownloads)

  const cbamAdvisoryRequestsNested = advisoryRequests.map((req) => ({
    ...stripInternal(req),
    documents: docsByReq.get(req.id) || [],
    products: prodsByReq.get(req.id) || [],
    reports: reportsByReq.get(req.id) || [],
    report_downloads: downloadsByReq.get(req.id) || [],
  }))

  const profile = profileRow.length > 0 ? stripInternal(profileRow[0]) : {
    email: user.email,
    company_name: null,
    created_at: null,
  }

  const payload = {
    export_metadata: {
      exported_at: now.toISOString(),
      user_id: userId,
      lexaduana_version: LEXADUANA_VERSION,
      format_version: FORMAT_VERSION,
      rgpd_basis: 'Art. 15 y 20 RGPD',
    },
    profile,
    consents: stripInternalAll(consents),
    classifications: stripInternalAll(classifications),
    invoice_extractions: stripInternalAll(invoiceExtractions),
    rrm_requests: stripInternalAll(rrmRequests),
    dispatches: {
      created_by_me: stripInternalAll(dispatchesCreatedByMe),
      assigned_to_me_only: stripInternalAll(dispatchesAssignedRaw),
      _note:
        'Los despachos en los que figuras como asignado pero no como creador ' +
        'se incluyen con campos mínimos. El contenido completo del despacho ' +
        'pertenece al usuario que lo creó y no está disponible en tu export. ' +
        'Si necesitas información completa sobre uno de estos despachos, ' +
        'contacta con el creador o con privacidad@lexaduana.es.',
    },
    dispatch_comments: stripInternalAll(dispatchComments),
    dispatch_timeline: stripInternalAll(dispatchTimeline),
    cbam_calculator_saves: stripInternalAll(cbamCalculatorSaves),
    cbam_advisory_requests: cbamAdvisoryRequestsNested,
    user_calculations: stripInternalAll(userCalculations),
    alerts: stripInternalAll(monitoredCodes),
    favorites: stripInternalAll(favorites),
  }

  const filename = `lexaduana-export-${userId}-${formatDateForFilename(now)}.json`

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
