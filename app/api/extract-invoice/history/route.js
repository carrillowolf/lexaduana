/**
 * API: Historial de extracciones de factura
 *
 *  GET    /api/extract-invoice/history         → lista últimas N (solo no-borradas)
 *  GET    /api/extract-invoice/history?id=xxx  → detalle con JSON extraído completo
 *  DELETE /api/extract-invoice/history?id=xxx  → soft delete (RLS: solo propietario)
 *
 * Seguridad:
 *  - Requiere sesión Supabase.
 *  - Anti-CSRF por Origin en DELETE.
 *  - RLS de tabla restringe a filas propias y no borradas.
 */

import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

import { SECURE_RESPONSE_HEADERS, isSameOrigin } from '@/lib/fileSecurity'

function err(msg, status, extra = {}) {
  return NextResponse.json(
    { success: false, error: msg, ...extra },
    { status, headers: SECURE_RESPONSE_HEADERS }
  )
}

export async function GET(request) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return err('No autenticado', 401)

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    // Detalle con JSON completo
    if (id) {
      const { data, error } = await supabase
        .from('invoice_extractions')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .maybeSingle()

      if (error) throw error
      if (!data) return err('Extracción no encontrada', 404)

      return NextResponse.json(
        { success: true, data },
        { headers: SECURE_RESPONSE_HEADERS }
      )
    }

    // Listado resumen (sin el JSON pesado)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0)

    const { data, error, count } = await supabase
      .from('invoice_extractions')
      .select(
        'id, created_at, file_name, invoice_number, supplier_name, supplier_country, currency, incoterm, total_amount, lines_count, validation_issues',
        { count: 'exact' }
      )
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return NextResponse.json(
      { success: true, data: data || [], total: count || 0 },
      { headers: SECURE_RESPONSE_HEADERS }
    )
  } catch (e) {
    console.error('[extract-invoice/history] GET:', e?.message)
    return err('Error al obtener historial', 500)
  }
}

export async function DELETE(request) {
  try {
    if (!isSameOrigin(request)) return err('Origen no autorizado', 403)

    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return err('No autenticado', 401)

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return err('Falta el id', 400)

    // Soft delete. RLS UPDATE está restringida a filas del usuario.
    const { error } = await supabase
      .from('invoice_extractions')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .is('deleted_at', null)

    if (error) throw error

    return NextResponse.json(
      { success: true },
      { headers: SECURE_RESPONSE_HEADERS }
    )
  } catch (e) {
    console.error('[extract-invoice/history] DELETE:', e?.message)
    return err('Error al borrar la extracción', 500)
  }
}

export const runtime = 'nodejs'
