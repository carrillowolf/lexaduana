import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/cbamAdminAuth'
import {
  getAdvisoryRequestAsAdmin,
  updateAdvisoryRequestAsAdmin,
  getCurrentReportForRequest,
} from '@/lib/cbamAdvisoryAdminService'
import { sendDeliveredEmail } from '@/lib/cbamAdvisoryEmails'
import { safeLogger } from '@/lib/safe-logger'

/**
 * POST /api/admin/cbam/asesoria/[id]/release
 *
 * Libera el informe al cliente:
 *   - Verifica que payment_status = 'paid'
 *   - Verifica que existe un informe current
 *   - Cambia status → 'delivered'
 *   - Setea delivered_at = NOW()
 *   - Dispara email al cliente (Fase F: placeholder)
 */
export async function POST(request, { params }) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  try {
    const { id } = await params
    const advisory = await getAdvisoryRequestAsAdmin(id)

    if (!advisory) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })
    }

    if (advisory.paymentStatus !== 'paid') {
      return NextResponse.json(
        { error: 'No se puede liberar: el pago aún no ha sido confirmado' },
        { status: 400 }
      )
    }

    const currentReport = await getCurrentReportForRequest(id)
    if (!currentReport) {
      return NextResponse.json(
        { error: 'No se puede liberar: no hay informe generado' },
        { status: 400 }
      )
    }

    const updated = await updateAdvisoryRequestAsAdmin(id, {
      status: 'delivered',
      deliveredAt: new Date().toISOString(),
    })

    // Email automático al cliente (no bloqueante)
    const emailResult = await sendDeliveredEmail(updated, currentReport)

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Informe liberado al cliente',
      emailSent: emailResult?.success || false,
    })
  } catch (error) {
    safeLogger.error('Error en release POST:', error)
    return NextResponse.json(
      { error: error.message || 'Error al liberar informe' },
      { status: 500 }
    )
  }
}
