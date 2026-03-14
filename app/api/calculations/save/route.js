import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Verificar usuario autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    const {
      hsCode,
      cifValue,
      countryCode,
      countryName,
      dutyRate,
      dutyAmount,
      vatRate,
      vatType,
      vatAmount,
      totalAmount,
      description,
      tags,
      notes
    } = body

    // Guardar cálculo
    const { data, error } = await supabase
      .from('user_calculations')
      .insert({
        user_id: user.id,
        hs_code: hsCode,
        cif_value: cifValue,
        country_code: countryCode,
        country_name: countryName,
        duty_rate: dutyRate,
        duty_amount: dutyAmount,
        vat_rate: vatRate,
        vat_type: vatType || 'general',
        vat_amount: vatAmount,
        total_amount: totalAmount,
        description: description,
        tags: tags || [],
        notes: notes || null
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Error guardando cálculo:', error)
    return NextResponse.json(
      { error: 'Error al guardar el cálculo' },
      { status: 500 }
    )
  }
}
