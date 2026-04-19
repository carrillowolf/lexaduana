const TABLE = 'cbam_monitoring_subscriptions'

const VOLUME_ENUM = new Set(['<50t', '50-200t', '200-500t', '500t+'])

export const DUA_AUTHORIZATION_TEXT_VERSION = 'v1-2026-04'

export function sanitizeArray(value, { maxItems = 20, maxLen = 120 } = {}) {
  if (!Array.isArray(value)) return null
  const cleaned = value
    .filter(v => typeof v === 'string')
    .map(v => v.trim())
    .filter(v => v.length > 0 && v.length <= maxLen)
    .slice(0, maxItems)
  return cleaned.length > 0 ? cleaned : null
}

export async function createMonitoringSubscription(userId, data, client) {
  if (!userId) throw new Error('userId requerido')
  if (!data?.companyName) throw new Error('companyName requerido')
  if (!data?.contactName) throw new Error('contactName requerido')
  if (!data?.contactEmail) throw new Error('contactEmail requerido')
  if (!data?.duaAuthorizationAccepted) {
    throw new Error('Se requiere autorización explícita para consultar DUAs')
  }
  if (data.expectedMonthlyVolume && !VOLUME_ENUM.has(data.expectedMonthlyVolume)) {
    throw new Error('expectedMonthlyVolume inválido')
  }

  const insert = {
    user_id: userId,
    status: 'submitted',
    company_name: data.companyName.trim(),
    company_cif: data.companyCif?.trim() || null,
    company_legal_name: data.companyLegalName?.trim() || null,
    contact_name: data.contactName.trim(),
    contact_email: data.contactEmail.trim().toLowerCase(),
    contact_phone: data.contactPhone?.trim() || null,
    dua_authorization_accepted_at: new Date().toISOString(),
    dua_authorization_text_version: DUA_AUTHORIZATION_TEXT_VERSION,
    main_cbam_products: sanitizeArray(data.mainCbamProducts),
    main_origin_countries: sanitizeArray(data.mainOriginCountries, { maxItems: 15, maxLen: 3 }),
    expected_monthly_volume: data.expectedMonthlyVolume || null,
    client_notes: data.clientNotes?.trim() || null,
  }

  const { data: row, error } = await client
    .from(TABLE)
    .insert(insert)
    .select('*')
    .single()

  if (error) throw new Error(`Error al crear suscripción: ${error.message}`)
  return mapRow(row)
}

export async function getMonitoringSubscriptions(userId, client) {
  const { data, error } = await client
    .from(TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Error al listar suscripciones: ${error.message}`)
  return (data || []).map(mapRow)
}

function mapRow(row) {
  if (!row) return null
  return {
    id: row.id,
    userId: row.user_id,
    status: row.status,
    companyName: row.company_name,
    companyCif: row.company_cif,
    companyLegalName: row.company_legal_name,
    contactName: row.contact_name,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    duaAuthorizationAcceptedAt: row.dua_authorization_accepted_at,
    duaAuthorizationTextVersion: row.dua_authorization_text_version,
    mainCbamProducts: row.main_cbam_products || [],
    mainOriginCountries: row.main_origin_countries || [],
    expectedMonthlyVolume: row.expected_monthly_volume,
    clientNotes: row.client_notes,
    authorizedAt: row.authorized_at,
    startedAt: row.started_at,
    pausedAt: row.paused_at,
    cancelledAt: row.cancelled_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
