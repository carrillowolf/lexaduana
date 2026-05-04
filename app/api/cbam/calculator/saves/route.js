import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { resolveTrafficLight, shouldShowCost } from '@/lib/cbamDiagnosticBuilder'
import { safeLogger } from '@/lib/safe-logger'

/**
 * GET /api/cbam/calculator/saves
 *
 * Devuelve el listado de cálculos guardados del usuario (últimos 10, DESC).
 * Para la vista /cbam/historial.
 *
 * Desde el Día 6 devolvemos `trafficLight` (semáforo verde/amarillo/rojo)
 * derivado del tonelaje total y ocultamos `totalCost` salvo que el flag
 * `NIVEL_2_SHOW_COST=true` esté activo (reversibilidad).
 */
export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('cbam_calculator_saves')
      .select('id, created_at, calculation_year, products, total_cost, total_certificates, total_emissions, notes')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      safeLogger.error('[GET /api/cbam/calculator/saves]', error)
      return NextResponse.json({ error: 'Error cargando historial' }, { status: 500 })
    }

    const showCost = shouldShowCost()

    // Resumen compacto para el listado (no devolvemos result_snapshot completo)
    const items = (data || []).map(row => {
      const products = Array.isArray(row.products) ? row.products : []
      const totalTonnes = products.reduce(
        (acc, p) => acc + (Number(p.annualTonnes) || 0),
        0,
      )
      const item = {
        id: row.id,
        createdAt: row.created_at,
        year: row.calculation_year,
        productCount: products.length,
        cnCodesPreview: products.slice(0, 3).map(p => p.cnCode).filter(Boolean),
        totalTonnes: Math.round(totalTonnes * 100) / 100,
        trafficLight: resolveTrafficLight(totalTonnes),
        totalEmissions: Number(row.total_emissions || 0),
        notes: row.notes || null,
      }
      if (showCost) {
        item.totalCost = Number(row.total_cost || 0)
        item.totalCertificates = Number(row.total_certificates || 0)
      }
      return item
    })

    return NextResponse.json({ success: true, data: items })
  } catch (err) {
    safeLogger.error('[GET /api/cbam/calculator/saves]', err)
    return NextResponse.json({ error: 'Error cargando historial', detail: err.message }, { status: 500 })
  }
}
