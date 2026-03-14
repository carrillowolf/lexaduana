import { NextResponse } from 'next/server'
import { saveCBAMCalculation, getCBAMCalculationHistory } from '@/lib/cbamService'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

/**
 * GET /api/cbam/calculations
 * Obtiene el historial de cálculos CBAM del usuario autenticado
 *
 * Query params:
 *   ?limit=20   - Número máximo de resultados
 *   ?offset=0   - Offset para paginación
 */
export async function GET(request) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0)

    const history = await getCBAMCalculationHistory(user.id, limit, offset)

    return NextResponse.json({
      success: true,
      data: history,
      pagination: { limit, offset, count: history.length }
    })
  } catch (error) {
    console.error('Error en /api/cbam/calculations GET:', error)
    return NextResponse.json(
      { error: 'Error al obtener historial de cálculos' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/cbam/calculations
 * Guarda un nuevo cálculo CBAM del usuario autenticado
 *
 * Body: {
 *   sectorId, productKey, cnCode, countryCode,
 *   tonnes, emissionFactor, emissionSource,
 *   benchmark, co2Price, totalEmissions, totalCost,
 *   markupApplied, notes
 * }
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

    // Validaciones básicas
    if (!body.sectorId || !body.tonnes || !body.emissionFactor || !body.co2Price) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: sectorId, tonnes, emissionFactor, co2Price' },
        { status: 400 }
      )
    }

    if (body.tonnes <= 0 || body.emissionFactor <= 0 || body.co2Price <= 0) {
      return NextResponse.json(
        { error: 'Los valores numéricos deben ser positivos' },
        { status: 400 }
      )
    }

    const saved = await saveCBAMCalculation(user.id, {
      sectorId: body.sectorId,
      productKey: body.productKey || null,
      cnCode: body.cnCode || null,
      countryCode: body.countryCode || null,
      tonnes: parseFloat(body.tonnes),
      emissionFactor: parseFloat(body.emissionFactor),
      emissionSource: body.emissionSource || 'default',
      benchmark: parseFloat(body.benchmark || 0),
      co2Price: parseFloat(body.co2Price),
      totalEmissions: parseFloat(body.totalEmissions || 0),
      totalCost: parseFloat(body.totalCost || 0),
      markupApplied: parseFloat(body.markupApplied || 0),
      notes: body.notes || null,
    })

    if (!saved) {
      return NextResponse.json(
        { error: 'Error al guardar el cálculo' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: saved,
      message: 'Cálculo CBAM guardado correctamente'
    })
  } catch (error) {
    console.error('Error en /api/cbam/calculations POST:', error)
    return NextResponse.json(
      { error: 'Error al guardar cálculo CBAM' },
      { status: 500 }
    )
  }
}
