import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/cbamAdminAuth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { applyManualStepToggle } from '@/lib/cbamChecklist'

/**
 * POST /api/admin/cbam/asesoria/[id]/checklist
 *
 * Body: { step: string, completed: boolean }
 *
 * Actualiza SOLO el JSONB admin_checklist para el paso manual indicado.
 * Los pasos automáticos se rechazan (los deriva el frontend del status).
 */
export async function POST(request, { params }) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  try {
    const { id } = await params
    const body = await request.json()
    const stepKey = String(body.step || '').trim()
    const completed = !!body.completed

    if (!stepKey) {
      return NextResponse.json({ error: 'step requerido' }, { status: 400 })
    }

    // Cargar checklist actual
    const { data: row, error: loadErr } = await supabaseAdmin
      .from('cbam_advisory_requests')
      .select('id, admin_checklist')
      .eq('id', id)
      .single()

    if (loadErr || !row) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })
    }

    const nextChecklist = applyManualStepToggle({
      kind: 'advisory',
      currentChecklist: row.admin_checklist || {},
      stepKey,
      completed,
      byEmail: auth.user.email,
    })

    const { data: updated, error: upErr } = await supabaseAdmin
      .from('cbam_advisory_requests')
      .update({ admin_checklist: nextChecklist })
      .eq('id', id)
      .select('admin_checklist')
      .single()

    if (upErr) {
      console.error('[Checklist] Error al actualizar:', upErr.message)
      return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: { checklist: updated.admin_checklist },
    })
  } catch (err) {
    console.error('Error checklist advisory POST:', err)
    return NextResponse.json(
      { error: err.message || 'Error interno' },
      { status: 500 }
    )
  }
}
