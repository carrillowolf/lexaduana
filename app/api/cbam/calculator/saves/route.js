import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

/**
 * GET /api/cbam/calculator/saves
 *
 * Devuelve el listado de cálculos guardados del usuario (últimos 10, DESC).
 * Para la vista /cbam/historial.
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
      console.error('[GET /api/cbam/calculator/saves]', error)
      return NextResponse.json({ error: 'Error cargando historial' }, { status: 500 })
    }

    // Resumen compacto para el listado (no devolvemos result_snapshot completo)
    const items = (data || []).map(row => ({
      id: row.id,
      createdAt: row.created_at,
      year: row.calculation_year,
      productCount: Array.isArray(row.products) ? row.products.length : 0,
      // Primeros 3 CNs como preview
      cnCodesPreview: Array.isArray(row.products)
        ? row.products.slice(0, 3).map(p => p.cnCode).filter(Boolean)
        : [],
      totalCost: Number(row.total_cost || 0),
      totalCertificates: Number(row.total_certificates || 0),
      totalEmissions: Number(row.total_emissions || 0),
      notes: row.notes || null,
    }))

    return NextResponse.json({ success: true, data: items })
  } catch (err) {
    console.error('[GET /api/cbam/calculator/saves]', err)
    return NextResponse.json({ error: 'Error cargando historial', detail: err.message }, { status: 500 })
  }
}
