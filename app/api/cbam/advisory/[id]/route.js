import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import {
  getAdvisoryRequest,
  updateAdvisoryRequest,
  deleteAdvisoryRequest,
} from '@/lib/cbamAdvisoryService'

/** Helper para verificar que la solicitud pertenece al usuario */
async function verifyOwnership(requestId, userId) {
  const request = await getAdvisoryRequest(requestId)
  if (!request || request.userId !== userId) return null
  return request
}

/**
 * GET /api/cbam/advisory/[id]
 * Detalle de solicitud con productos y documentos
 */
export async function GET(request, { params }) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { id } = await params
    const advisory = await verifyOwnership(id, user.id)
    if (!advisory) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: advisory })
  } catch (error) {
    console.error('Error en /api/cbam/advisory/[id] GET:', error)
    return NextResponse.json({ error: 'Error al obtener solicitud' }, { status: 500 })
  }
}

/**
 * PATCH /api/cbam/advisory/[id]
 * Actualiza datos de la solicitud (solo draft o intake_complete)
 */
export async function PATCH(request, { params }) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { id } = await params
    const advisory = await verifyOwnership(id, user.id)
    if (!advisory) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })
    }

    if (!['draft', 'intake_complete'].includes(advisory.status)) {
      return NextResponse.json(
        { error: 'Solo se pueden editar solicitudes en estado borrador' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const updated = await updateAdvisoryRequest(id, body)
    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('Error en /api/cbam/advisory/[id] PATCH:', error)
    return NextResponse.json({ error: error.message || 'Error al actualizar' }, { status: 500 })
  }
}

/**
 * DELETE /api/cbam/advisory/[id]
 * Elimina solicitud (solo draft)
 */
export async function DELETE(request, { params }) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { id } = await params
    const advisory = await verifyOwnership(id, user.id)
    if (!advisory) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })
    }

    if (advisory.status !== 'draft') {
      return NextResponse.json(
        { error: 'Solo se pueden eliminar solicitudes en estado borrador' },
        { status: 400 }
      )
    }

    await deleteAdvisoryRequest(id)
    return NextResponse.json({ success: true, message: 'Solicitud eliminada' })
  } catch (error) {
    console.error('Error en /api/cbam/advisory/[id] DELETE:', error)
    return NextResponse.json({ error: error.message || 'Error al eliminar' }, { status: 500 })
  }
}
