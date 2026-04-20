import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { calculateProducts } from '@/lib/cbamAdvisoryCalculator'
import { toFreeTierPayload, toDiagnosticPayload } from '@/lib/cbamCalculatorPayload'
import { isCnSupportedByAdvisory } from '@/lib/cbamData'

const MAX_SAVES_PER_USER = 10

/**
 * POST /api/cbam/calculator/save
 *
 * Guarda un cálculo en cbam_calculator_saves. Requiere login.
 * Enforce: máximo 10 cálculos por usuario (FIFO — borra los más antiguos).
 *
 * Body: { year, products }
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
    const year = Number(body.year) || 2026
    const products = Array.isArray(body.products) ? body.products : []
    const notes = typeof body.notes === 'string' ? body.notes.slice(0, 500) : null

    // Reutilizamos las validaciones del endpoint calculate
    if (products.length === 0 || products.length > 5) {
      return NextResponse.json({ error: 'Se requieren entre 1 y 5 productos' }, { status: 400 })
    }
    if (![2026, 2027, 2028].includes(year)) {
      return NextResponse.json({ error: 'Año no soportado' }, { status: 400 })
    }
    for (const p of products) {
      if (!p.cnCode || !p.countryCode || !p.annualTonnes) {
        return NextResponse.json({ error: 'Producto incompleto' }, { status: 400 })
      }
      const check = isCnSupportedByAdvisory(p.cnCode)
      if (!check.supported) {
        return NextResponse.json({
          error: 'Sector no soportado por la calculadora',
          code: 'SECTOR_NOT_SUPPORTED',
        }, { status: 400 })
      }
    }

    // Recalcular en backend para que el snapshot guardado sea el oficial
    // (el cliente podría haber enviado resultados manipulados; aquí no nos
    // fiamos y volvemos a calcular con el motor puro).
    const engineResult = await calculateProducts({ products, year })

    // Snapshot persistido: payload *completo* con cifras exactas. Aunque el
    // flag del Día 6 esté OFF, queremos conservar la cifra en BD para poder
    // revertir el comportamiento sin recalcular. El filtrado se aplica al
    // leer.
    const freeTierPayload = toFreeTierPayload(engineResult, products)
    // Payload devuelto al cliente: diagnóstico cualitativo (respeta flag).
    const diagnosticPayload = toDiagnosticPayload(engineResult, products)

    const totalCost = freeTierPayload.totals.totalCost
    const totalCertificates = freeTierPayload.totals.totalCertificates
    const totalEmissions = freeTierPayload.totals.totalEmissions

    // Insert
    const { data: inserted, error: insertError } = await supabase
      .from('cbam_calculator_saves')
      .insert({
        user_id: user.id,
        calculation_year: year,
        products,
        total_cost: totalCost,
        total_certificates: totalCertificates,
        total_emissions: totalEmissions,
        result_snapshot: freeTierPayload,
        notes,
      })
      .select()
      .single()

    if (insertError) {
      console.error('[POST /api/cbam/calculator/save] insert error', insertError)
      return NextResponse.json({ error: 'Error guardando el cálculo' }, { status: 500 })
    }

    // Enforce FIFO: si >10, borrar los más antiguos
    const { data: allSaves } = await supabase
      .from('cbam_calculator_saves')
      .select('id, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (allSaves && allSaves.length > MAX_SAVES_PER_USER) {
      const toDelete = allSaves.slice(MAX_SAVES_PER_USER).map(r => r.id)
      await supabase.from('cbam_calculator_saves').delete().in('id', toDelete)
    }

    return NextResponse.json({
      success: true,
      data: {
        id: inserted.id,
        createdAt: inserted.created_at,
        totalCount: Math.min(allSaves?.length || 1, MAX_SAVES_PER_USER),
        maxCount: MAX_SAVES_PER_USER,
        payload: diagnosticPayload,
      },
    })
  } catch (err) {
    console.error('[POST /api/cbam/calculator/save]', err)
    return NextResponse.json({ error: 'Error guardando cálculo', detail: err.message }, { status: 500 })
  }
}
