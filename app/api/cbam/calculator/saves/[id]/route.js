import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

/**
 * GET /api/cbam/calculator/saves/[id]
 * Devuelve el detalle de un cálculo guardado (incluyendo result_snapshot).
 * Ownership enforced por RLS; además verifico en código por defensa en
 * profundidad.
 */
export async function GET(_request, { params }) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('cbam_calculator_saves')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        createdAt: data.created_at,
        year: data.calculation_year,
        products: data.products,
        resultSnapshot: data.result_snapshot,
        totals: {
          totalCost: Number(data.total_cost || 0),
          totalCertificates: Number(data.total_certificates || 0),
          totalEmissions: Number(data.total_emissions || 0),
        },
        notes: data.notes || null,
      },
    })
  } catch (err) {
    console.error('[GET /api/cbam/calculator/saves/[id]]', err)
    return NextResponse.json({ error: 'Error', detail: err.message }, { status: 500 })
  }
}

/**
 * DELETE /api/cbam/calculator/saves/[id]
 * Borra un cálculo guardado. Ownership por RLS + verificación en código.
 */
export async function DELETE(_request, { params }) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { error } = await supabase
      .from('cbam_calculator_saves')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('[DELETE /api/cbam/calculator/saves/[id]]', error)
      return NextResponse.json({ error: 'Error borrando el cálculo' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/cbam/calculator/saves/[id]]', err)
    return NextResponse.json({ error: 'Error', detail: err.message }, { status: 500 })
  }
}
