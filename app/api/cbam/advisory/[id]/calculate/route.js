import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { getAdvisoryRequest } from '@/lib/cbamAdvisoryService'
import { calculateAdvisoryRequest } from '@/lib/cbamAdvisoryCalculator'

/**
 * POST /api/cbam/advisory/[id]/calculate
 * Ejecuta el motor de cálculo: detecta sectores, obtiene benchmarks,
 * calcula emisiones/costes, genera escenario dual.
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

    if (advisory.status === 'draft') {
      return NextResponse.json(
        { error: 'Debes enviar la solicitud antes de ejecutar el cálculo' },
        { status: 400 }
      )
    }

    const result = await calculateAdvisoryRequest(id)
    return NextResponse.json({
      success: true,
      data: result,
      message: 'Cálculo completado',
    })
  } catch (error) {
    console.error('Error en calculate POST:', error)
    return NextResponse.json(
      { error: error.message || 'Error al ejecutar el cálculo' },
      { status: 500 }
    )
  }
}
