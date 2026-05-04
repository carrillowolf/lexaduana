import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/cbamAdminAuth'
import { getAdvisoryRequestAsAdmin } from '@/lib/cbamAdvisoryAdminService'
import { calculateAdvisoryRequest } from '@/lib/cbamAdvisoryCalculator'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { safeLogger } from '@/lib/safe-logger'

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * POST /api/admin/cbam/asesoria/[id]/calculate
 * Ejecuta el motor de cálculo CBAM como admin (sin restricciones de ownership ni status).
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
    if (!advisory.products || advisory.products.length === 0) {
      return NextResponse.json(
        { error: 'La solicitud no tiene productos para calcular' },
        { status: 400 }
      )
    }

    const result = await calculateAdvisoryRequest(id, supabaseAdmin)

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Cálculo completado',
    })
  } catch (error) {
    safeLogger.error('Error en admin calculate POST:', error)
    return NextResponse.json(
      { error: error.message || 'Error al ejecutar el cálculo' },
      { status: 500 }
    )
  }
}
