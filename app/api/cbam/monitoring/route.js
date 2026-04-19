import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import {
  createMonitoringSubscription,
  getMonitoringSubscriptions,
} from '@/lib/cbamMonitoringService'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const list = await getMonitoringSubscriptions(user.id, supabase)
    return NextResponse.json({ success: true, data: list })
  } catch (error) {
    console.error('Error en /api/cbam/monitoring GET:', error)
    return NextResponse.json({ error: 'Error al obtener suscripciones' }, { status: 500 })
  }
}

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
        { status: 400 },
      )
    }
    if (!body.duaAuthorizationAccepted) {
      return NextResponse.json(
        { error: 'Debes aceptar la autorización para consultar DUAs en AEAT' },
        { status: 400 },
      )
    }

    const created = await createMonitoringSubscription(user.id, body, supabase)
    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch (error) {
    console.error('Error en /api/cbam/monitoring POST:', error)
    return NextResponse.json(
      { error: error.message || 'Error al crear suscripción' },
      { status: 500 },
    )
  }
}
