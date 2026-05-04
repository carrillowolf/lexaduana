import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/cbamAdminAuth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { safeLogger } from '@/lib/safe-logger'

/**
 * GET /api/admin/cbam/suscripciones
 * Lista TODAS las suscripciones (admin). Soporta filtro ?status=... y ?search=.
 */
export async function GET(request) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  try {
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const search = url.searchParams.get('search')

    let query = supabaseAdmin
      .from('cbam_monitoring_subscriptions')
      .select('*')
      .order('created_at', { ascending: false })

    if (status) query = query.eq('status', status)
    if (search) query = query.ilike('company_name', `%${search}%`)

    const { data, error } = await query
    if (error) {
      safeLogger.error('[Monitoring Admin] Error listando:', error.message)
      return NextResponse.json({ error: 'Error al listar suscripciones' }, { status: 500 })
    }

    const list = (data || []).map(row => ({
      id: row.id,
      status: row.status,
      companyName: row.company_name,
      companyCif: row.company_cif,
      contactName: row.contact_name,
      contactEmail: row.contact_email,
      contactPhone: row.contact_phone,
      expectedMonthlyVolume: row.expected_monthly_volume,
      mainCbamProducts: row.main_cbam_products || [],
      mainOriginCountries: row.main_origin_countries || [],
      duaAuthorizationAcceptedAt: row.dua_authorization_accepted_at,
      duaAuthorizationTextVersion: row.dua_authorization_text_version,
      authorizedAt: row.authorized_at,
      startedAt: row.started_at,
      pausedAt: row.paused_at,
      cancelledAt: row.cancelled_at,
      createdAt: row.created_at,
      adminChecklist: row.admin_checklist || {},
    }))

    return NextResponse.json({ success: true, data: list })
  } catch (err) {
    safeLogger.error('Error suscripciones GET:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
