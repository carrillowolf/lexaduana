import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import {
  getAdvisoryRequestAsAdmin,
  getCurrentReportForRequest,
  getReportSignedUrl,
  logReportDownload,
} from '@/lib/cbamAdvisoryAdminService'
import { safeLogger } from '@/lib/safe-logger'

/**
 * GET /api/cbam/advisory/[id]/download
 *
 * Descarga del informe PDF por parte del cliente.
 * Requisitos:
 *   - Usuario autenticado
 *   - Es propietario de la solicitud
 *   - Status = 'delivered' (el admin debe liberar manualmente tras confirmar pago)
 *   - Existe un informe current
 *
 * Devuelve { success, signedUrl, filename } — el cliente abre el URL.
 * Registra cada descarga en cbam_advisory_report_downloads.
 *
 * Nota: usamos getAdvisoryRequestAsAdmin (service_role) solo para LEER y verificar
 * ownership manualmente. No exponemos datos de otros usuarios porque comparamos
 * advisory.userId === user.id antes de devolver nada.
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
    const advisory = await getAdvisoryRequestAsAdmin(id)

    if (!advisory || advisory.userId !== user.id) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })
    }

    if (advisory.status !== 'delivered') {
      return NextResponse.json(
        { error: 'El informe aún no está disponible para descarga' },
        { status: 403 }
      )
    }

    const report = await getCurrentReportForRequest(id)
    if (!report) {
      return NextResponse.json({ error: 'No hay informe disponible' }, { status: 404 })
    }

    const signedUrl = await getReportSignedUrl(report.pdf_path, 3600)

    // Auditoría (no bloqueante)
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      null
    const userAgent = request.headers.get('user-agent') || null

    await logReportDownload({
      reportId: report.id,
      requestId: id,
      userId: user.id,
      ipAddress: ip,
      userAgent,
    })

    return NextResponse.json({
      success: true,
      signedUrl,
      filename: report.pdf_filename,
      reportRef: report.report_ref,
    })
  } catch (error) {
    safeLogger.error('Error en download GET:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener descarga' },
      { status: 500 }
    )
  }
}
