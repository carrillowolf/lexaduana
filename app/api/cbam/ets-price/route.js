import { NextResponse } from 'next/server'
import { getCurrentETSPrice, getETSPriceHistory, updateETSPrice } from '@/lib/cbamService'
import { checkRateLimit, calculatorLimiter } from '@/lib/rate-limit'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { safeLogger } from '@/lib/safe-logger'

// Admin emails (mismo patrón que /admin/clasificaciones)
const ADMIN_EMAILS = ['ccarrillodelolmo@gmail.com']

/**
 * GET /api/cbam/ets-price
 * Obtiene el precio actual del EU ETS y opcionalmente el historial
 *
 * Query params:
 *   ?history=true  - Incluir historial de precios
 *   ?limit=30      - Límite de registros en historial
 */
export async function GET(request) {
  try {
    // Rate limiting
    const rateLimitResult = await checkRateLimit(request, calculatorLimiter)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Demasiadas peticiones. Inténtalo de nuevo más tarde.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      )
    }

    const { searchParams } = new URL(request.url)
    const includeHistory = searchParams.get('history') === 'true'
    const limit = Math.min(parseInt(searchParams.get('limit') || '30'), 100)

    // Obtener precio actual
    const currentPrice = await getCurrentETSPrice()

    const response = {
      success: true,
      data: {
        current: currentPrice
      }
    }

    // Incluir historial si se solicita
    if (includeHistory) {
      response.data.history = await getETSPriceHistory(limit)
    }

    // Cache de 1 hora - el precio no cambia frecuentemente
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200'
      }
    })
  } catch (error) {
    safeLogger.error('Error en /api/cbam/ets-price GET:', error)
    return NextResponse.json(
      { error: 'Error al obtener precio EU ETS' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/cbam/ets-price
 * Actualiza el precio del EU ETS (solo admin)
 *
 * Body: { price: number, date: string, source?: string }
 */
export async function POST(request) {
  try {
    // Verificar autenticación
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Verificar admin
    if (!ADMIN_EMAILS.includes(user.email)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const { price, date, source } = body

    // Validar input
    if (!price || typeof price !== 'number' || price <= 0 || price > 1000) {
      return NextResponse.json(
        { error: 'Precio inválido. Debe ser un número entre 0 y 1000.' },
        { status: 400 }
      )
    }

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: 'Fecha inválida. Formato esperado: YYYY-MM-DD' },
        { status: 400 }
      )
    }

    const success = await updateETSPrice(price, date, source || 'manual')

    if (!success) {
      return NextResponse.json(
        { error: 'Error al actualizar el precio' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Precio EU ETS actualizado a €${price}/tCO₂ (${date})`
    })
  } catch (error) {
    safeLogger.error('Error en /api/cbam/ets-price POST:', error)
    return NextResponse.json(
      { error: 'Error al actualizar precio EU ETS' },
      { status: 500 }
    )
  }
}
