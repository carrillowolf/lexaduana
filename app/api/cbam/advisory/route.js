import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createAdvisoryRequest, getAdvisoryRequests } from '@/lib/cbamAdvisoryService'
import { safeLogger } from '@/lib/safe-logger'

/**
 * GET /api/cbam/advisory
 * Lista solicitudes del usuario autenticado
 */
export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const requests = await getAdvisoryRequests(user.id, supabase)
    return NextResponse.json({ success: true, data: requests })
  } catch (error) {
    safeLogger.error('Error en /api/cbam/advisory GET:', error)
    return NextResponse.json({ error: 'Error al obtener solicitudes' }, { status: 500 })
  }
}

/**
 * POST /api/cbam/advisory
 * Crea nueva solicitud en estado 'draft'
 */
export async function POST(request) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json()

    if (!body.companyName || !body.contactName || !body.contactEmail) {
      return NextResponse.json(
        { error: 'Campos requeridos: companyName, contactName, contactEmail' },
        { status: 400 }
      )
    }

    const installationsCount = Number.isFinite(body.installationsCount) && body.installationsCount >= 1
      ? Math.min(Math.floor(body.installationsCount), 999)
      : null

    const created = await createAdvisoryRequest(user.id, {
      companyName: body.companyName,
      companyCif: body.companyCif || null,
      companyEori: body.companyEori || null,
      contactName: body.contactName,
      contactEmail: body.contactEmail,
      contactPhone: body.contactPhone || null,
      annualVolumeEstimate: body.annualVolumeEstimate || null,
      isAuthorizedDeclarant: body.isAuthorizedDeclarant || false,
      hasIndirectRepresentative: body.hasIndirectRepresentative || false,
      representativeName: body.representativeName || null,
      clientNotes: body.clientNotes || null,
      installationsCount,
    }, supabase)

    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch (error) {
    safeLogger.error('Error en /api/cbam/advisory POST:', error)
    return NextResponse.json({ error: error.message || 'Error al crear solicitud' }, { status: 500 })
  }
}
