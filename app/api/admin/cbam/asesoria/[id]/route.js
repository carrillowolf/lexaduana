import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/cbamAdminAuth'
import {
  getAdvisoryRequestAsAdmin,
  updateAdvisoryRequestAsAdmin,
} from '@/lib/cbamAdvisoryAdminService'
import { sendPendingPaymentEmail } from '@/lib/cbamAdvisoryEmails'
import { safeLogger } from '@/lib/safe-logger'

/**
 * GET /api/admin/cbam/asesoria/[id]
 * Detalle completo de una solicitud (admin, sin restricciones de ownership).
 */
export async function GET(request, { params }) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  try {
    const { id } = await params
    const advisory = await getAdvisoryRequestAsAdmin(id)
    if (!advisory) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })
    }
    return NextResponse.json({ success: true, data: advisory })
  } catch (error) {
    safeLogger.error('Error en /api/admin/cbam/asesoria/[id] GET:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener solicitud' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/cbam/asesoria/[id]
 * Actualiza una solicitud (admin, cualquier campo, cualquier estado).
 *
 * Body: cualquier campo del request en camelCase.
 * Cambios típicos: status, paymentStatus, invoiceRef, internalNotes,
 * companyName, contactName, etc.
 */
export async function PATCH(request, { params }) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  try {
    const { id } = await params
    const body = await request.json()

    // Validar transiciones de pago coherentes
    if (body.paymentStatus === 'paid' && !body.paymentDate) {
      body.paymentDate = new Date().toISOString()
    }

    const updated = await updateAdvisoryRequestAsAdmin(id, body)

    // Email automático cuando admin marca facturado → pending_payment
    if (body.status === 'pending_payment') {
      await sendPendingPaymentEmail(updated)
    }

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    safeLogger.error('Error en /api/admin/cbam/asesoria/[id] PATCH:', error)
    return NextResponse.json(
      { error: error.message || 'Error al actualizar' },
      { status: 500 }
    )
  }
}
