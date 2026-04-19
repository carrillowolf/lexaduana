import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/cbamAdminAuth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

/**
 * GET  /api/admin/cbam/suscripciones/[id]     — detalle admin
 * PATCH /api/admin/cbam/suscripciones/[id]    — cambiar status y admin_notes
 *
 * Mantiene minimal: el panel de suscripciones es una vista única scrollable
 * (Opción C del Día 5) en la que el admin ajusta estado, notas y checklist.
 */

const STATUS_ENUM = ['submitted', 'authorized', 'active', 'paused', 'cancelled']

function mapRow(row) {
  if (!row) return null
  return {
    id: row.id,
    status: row.status,
    companyName: row.company_name,
    companyCif: row.company_cif,
    companyLegalName: row.company_legal_name,
    contactName: row.contact_name,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    mainCbamProducts: row.main_cbam_products || [],
    mainOriginCountries: row.main_origin_countries || [],
    expectedMonthlyVolume: row.expected_monthly_volume,
    clientNotes: row.client_notes,
    adminNotes: row.admin_notes,
    duaAuthorizationAcceptedAt: row.dua_authorization_accepted_at,
    duaAuthorizationTextVersion: row.dua_authorization_text_version,
    authorizedAt: row.authorized_at,
    startedAt: row.started_at,
    pausedAt: row.paused_at,
    cancelledAt: row.cancelled_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    adminChecklist: row.admin_checklist || {},
  }
}

export async function GET(request, { params }) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  try {
    const { id } = await params
    const { data, error } = await supabaseAdmin
      .from('cbam_monitoring_subscriptions')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Suscripción no encontrada' }, { status: 404 })
    }
    return NextResponse.json({ success: true, data: mapRow(data) })
  } catch (err) {
    console.error('Error suscripcion GET:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function PATCH(request, { params }) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  try {
    const { id } = await params
    const body = await request.json()

    const patch = {}
    if (body.status !== undefined) {
      if (!STATUS_ENUM.includes(body.status)) {
        return NextResponse.json({ error: 'status inválido' }, { status: 400 })
      }
      patch.status = body.status
      // Timestamp automático según la transición
      const now = new Date().toISOString()
      if (body.status === 'authorized' && !body.authorizedAt) patch.authorized_at = now
      if (body.status === 'active' && !body.startedAt) patch.started_at = now
      if (body.status === 'paused') patch.paused_at = now
      if (body.status === 'cancelled') patch.cancelled_at = now
    }
    if (body.adminNotes !== undefined) patch.admin_notes = body.adminNotes

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('cbam_monitoring_subscriptions')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      console.error('[Monitoring Admin] Error PATCH:', error.message)
      return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
    }
    return NextResponse.json({ success: true, data: mapRow(data) })
  } catch (err) {
    console.error('Error suscripcion PATCH:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
