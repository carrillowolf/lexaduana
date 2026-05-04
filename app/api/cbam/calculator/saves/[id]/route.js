import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { toDiagnosticFromSnapshot } from '@/lib/cbamCalculatorPayload'
import { shouldShowCost } from '@/lib/cbamDiagnosticBuilder'
import { safeLogger } from '@/lib/safe-logger'

/**
 * GET /api/cbam/calculator/saves/[id]
 * Devuelve el detalle de un cálculo guardado (incluyendo result_snapshot).
 * Ownership enforced por RLS; además verifico en código por defensa en
 * profundidad.
 *
 * Desde el Día 6 aplicamos `toDiagnosticFromSnapshot` sobre el snapshot
 * persistido para entregar el payload cualitativo. El snapshot RAW se
 * conserva en BD por si el flag NIVEL_2_SHOW_COST se invierte.
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

    const showCost = shouldShowCost()
    const products = Array.isArray(data.products) ? data.products : []
    const diagnosticPayload = toDiagnosticFromSnapshot(
      data.result_snapshot || {},
      products,
      { showCost },
    )

    const responseData = {
      id: data.id,
      createdAt: data.created_at,
      year: data.calculation_year,
      products,
      diagnostic: diagnosticPayload.diagnostic,
      lines: diagnosticPayload.lines,
      totals: diagnosticPayload.totals,
      regParams: diagnosticPayload.regParams,
      notes: data.notes || null,
      showCost,
    }

    if (showCost) {
      responseData.resultSnapshot = data.result_snapshot
    }

    return NextResponse.json({ success: true, data: responseData })
  } catch (err) {
    safeLogger.error('[GET /api/cbam/calculator/saves/[id]]', err)
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
      safeLogger.error('[DELETE /api/cbam/calculator/saves/[id]]', error)
      return NextResponse.json({ error: 'Error borrando el cálculo' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    safeLogger.error('[DELETE /api/cbam/calculator/saves/[id]]', err)
    return NextResponse.json({ error: 'Error', detail: err.message }, { status: 500 })
  }
}
