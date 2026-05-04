import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/cbamAdminAuth'
import { listAllAdvisoryRequests } from '@/lib/cbamAdvisoryAdminService'
import { safeLogger } from '@/lib/safe-logger'

/**
 * GET /api/admin/cbam/asesoria
 * Lista TODAS las solicitudes de asesoría (solo admin).
 * Query params opcionales: ?status=...&search=...
 */
export async function GET(request) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const requests = await listAllAdvisoryRequests({ status, search })
    return NextResponse.json({ success: true, data: requests })
  } catch (error) {
    safeLogger.error('Error en /api/admin/cbam/asesoria GET:', error)
    return NextResponse.json(
      { error: error.message || 'Error al listar solicitudes' },
      { status: 500 }
    )
  }
}
