import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/cbamAdminAuth'
import {
  getAdvisoryRequestAsAdmin,
  updateAdvisoryRequestAsAdmin,
  generateReportRef,
  createReportVersion,
  uploadReportPdf,
} from '@/lib/cbamAdvisoryAdminService'
import { buildReportSnapshot } from '@/lib/cbamReportSnapshot'
import { renderReportPdf } from '@/lib/cbamReportGenerator'
import { safeLogger } from '@/lib/safe-logger'

// React-PDF requiere Node runtime (no edge)
export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * POST /api/admin/cbam/asesoria/[id]/generate-report
 *
 * Genera el PDF del informe CBAM:
 *   1. Carga la solicitud completa con productos
 *   2. Asigna report_ref si no tiene
 *   3. Construye el snapshot (con totales + recomendaciones)
 *   4. Renderiza el PDF
 *   5. Sube al bucket cbam-advisory-reports
 *   6. Crea registro versionado en cbam_advisory_reports (transaccional)
 *   7. Actualiza la solicitud: status → 'report_ready'
 */
export async function POST(request, { params }) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  try {
    const { id } = await params

    // 1. Cargar solicitud completa
    const advisory = await getAdvisoryRequestAsAdmin(id)
    if (!advisory) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })
    }

    if (!advisory.products || advisory.products.length === 0) {
      return NextResponse.json(
        { error: 'La solicitud no tiene productos para generar el informe' },
        { status: 400 }
      )
    }

    // 2. Asignar report_ref si no tiene
    let reportRef = advisory.reportRef
    if (!reportRef) {
      reportRef = await generateReportRef()
      await updateAdvisoryRequestAsAdmin(id, { reportRef })
      advisory.reportRef = reportRef
    }

    // 3. Construir snapshot
    const snapshot = buildReportSnapshot({
      advisory,
      reportRef,
      generatedBy: auth.user.email,
    })

    // 4. Renderizar PDF
    const pdfBuffer = await renderReportPdf(snapshot)

    // 5. Subir al bucket
    // Nombre: {report_ref}_v{timestamp}.pdf — el timestamp evita colisiones entre versiones
    const timestamp = Date.now()
    const filename = `${reportRef}_v${timestamp}.pdf`
    const pdfPath = await uploadReportPdf({
      requestId: id,
      filename,
      pdfBuffer,
    })

    // 6. Crear registro versionado (función SQL transaccional)
    const reportId = await createReportVersion({
      requestId: id,
      pdfPath,
      pdfFilename: `Informe_CBAM_${reportRef}.pdf`,
      pdfSizeBytes: pdfBuffer.length,
      reportRef,
      reportYear: snapshot.meta.reportYear,
      calculationSnapshot: snapshot,
      generatedBy: auth.user.email,
    })

    // 7. Actualizar status del request — solo degradar a 'report_ready' si la
    // solicitud aún no ha sido entregada. Si ya está entregada (o en cualquier
    // estado posterior a la entrega que pueda añadirse en el futuro), conservar
    // el estado actual: regenerar el informe sustituye el PDF (el current_report
    // pasa a apuntar al nuevo) pero no debe retroceder la máquina de estados.
    const POST_DELIVERY_STATUSES = new Set(['delivered'])
    const nextStatus = POST_DELIVERY_STATUSES.has(advisory.status)
      ? advisory.status
      : 'report_ready'
    const updated = await updateAdvisoryRequestAsAdmin(id, {
      status: nextStatus,
    })

    return NextResponse.json({
      success: true,
      message: 'Informe generado correctamente',
      data: {
        reportId,
        reportRef,
        pdfPath,
        pdfSizeBytes: pdfBuffer.length,
        request: updated,
      },
    })
  } catch (error) {
    safeLogger.error('Error en generate-report POST:', error)
    return NextResponse.json(
      { error: error.message || 'Error al generar el informe' },
      { status: 500 }
    )
  }
}
