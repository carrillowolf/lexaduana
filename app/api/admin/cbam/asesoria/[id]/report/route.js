import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/cbamAdminAuth'
import {
  getCurrentReportForRequest,
  listReportsForRequest,
  getReportSignedUrl,
} from '@/lib/cbamAdvisoryAdminService'
import { safeLogger } from '@/lib/safe-logger'

/**
 * GET /api/admin/cbam/asesoria/[id]/report
 * Devuelve el informe vigente y un signed URL para descarga.
 * Si ?all=1 → devuelve también todas las versiones.
 */
export async function GET(request, { params }) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const includeAll = searchParams.get('all') === '1'

    const current = await getCurrentReportForRequest(id)
    let signedUrl = null
    if (current?.pdf_path) {
      signedUrl = await getReportSignedUrl(current.pdf_path, 3600)
    }

    const result = {
      current: current
        ? {
            id: current.id,
            version: current.version,
            reportRef: current.report_ref,
            pdfFilename: current.pdf_filename,
            pdfSizeBytes: current.pdf_size_bytes,
            generatedAt: current.generated_at,
            generatedBy: current.generated_by,
            signedUrl,
          }
        : null,
    }

    if (includeAll) {
      const all = await listReportsForRequest(id)
      result.versions = all.map(r => ({
        id: r.id,
        version: r.version,
        reportRef: r.report_ref,
        pdfFilename: r.pdf_filename,
        generatedAt: r.generated_at,
        isCurrent: r.is_current,
      }))
    }

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    safeLogger.error('Error en admin report GET:', error)
    return NextResponse.json({ error: error.message || 'Error' }, { status: 500 })
  }
}
