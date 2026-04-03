import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { getAdvisoryRequest, submitAdvisoryRequest } from '@/lib/cbamAdvisoryService'

/**
 * POST /api/cbam/advisory/[id]/submit
 * Confirma el intake: valida productos, cambia status a 'intake_complete'
 */
export async function POST(request, { params }) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { id } = await params

    // Verificar ownership
    const advisory = await getAdvisoryRequest(id)
    if (!advisory || advisory.userId !== user.id) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })
    }

    const updated = await submitAdvisoryRequest(id)
    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Solicitud enviada correctamente',
    })
  } catch (error) {
    console.error('Error en submit POST:', error)
    return NextResponse.json(
      { error: error.message || 'Error al enviar solicitud' },
      { status: 400 }
    )
  }
}
