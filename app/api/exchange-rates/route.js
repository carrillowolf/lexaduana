import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const cookieStore = await cookies() // ← AÑADIDO await
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Obtener tipos vigentes actuales
    const { data, error } = await supabase
      .from('current_exchange_rates')
      .select('*')
      .order('currency_code')

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: data || []
    })
  } catch (error) {
    console.error('Error obteniendo tipos de cambio:', error)
    return NextResponse.json(
      { error: 'Error al obtener tipos de cambio' },
      { status: 500 }
    )
  }
}
