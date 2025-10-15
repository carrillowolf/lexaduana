import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Verificar usuario autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const { items, batchName } = await request.json()
    
    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'No hay items para procesar' },
        { status: 400 }
      )
    }
    
    if (items.length > 100) {
      return NextResponse.json(
        { error: 'Máximo 100 items por lote' },
        { status: 400 }
      )
    }

    // Generar ID de batch
    const batchId = crypto.randomUUID()
    
    // Procesar cada item
    const results = []
    const errors = []
    
    for (const item of items) {
      try {
        // Llamar a la API de cálculo individual
        const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/calculate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hsCode: item.hsCode,
            cifValue: item.cifValue,
            countryCode: item.countryCode
          })
        })
        
        const data = await response.json()
        
        if (data.success) {
          results.push({
            ...item,
            result: data.data,
            status: 'success'
          })
          
          // Guardar en historial con referencia al batch
          await supabase
            .from('user_calculations')
            .insert({
              user_id: user.id,
              hs_code: data.data.hsCode,
              cif_value: data.data.cifValue,
              country_code: data.data.country.code,
              country_name: data.data.country.name,
              duty_rate: data.data.duty.appliedRate,
              duty_amount: data.data.duty.amount,
              vat_rate: data.data.vat.rate,
              vat_type: data.data.vat.type,
              vat_amount: data.data.vat.amount,
              total_amount: data.data.total,
              description: data.data.description,
              is_bulk: true,
              bulk_batch_id: batchId,
              bulk_batch_name: batchName || `Lote ${new Date().toLocaleDateString('es-ES')}`
            })
        } else {
          results.push({
            ...item,
            status: 'error',
            error: data.error || 'Error desconocido'
          })
          
          errors.push({
            line: item.lineNumber,
            hsCode: item.hsCode,
            error: data.error || 'Error desconocido'
          })
        }
      } catch (error) {
        results.push({
          ...item,
          status: 'error',
          error: error.message
        })
        
        errors.push({
          line: item.lineNumber,
          hsCode: item.hsCode,
          error: error.message
        })
      }
    }
    
    // Calcular totales
    const successful = results.filter(r => r.status === 'success')
    const totals = {
      totalCIF: successful.reduce((sum, r) => sum + (r.result?.cifValue || 0), 0),
      totalDuties: successful.reduce((sum, r) => sum + (r.result?.duty.amount || 0), 0),
      totalVAT: successful.reduce((sum, r) => sum + (r.result?.vat.amount || 0), 0),
      totalAmount: successful.reduce((sum, r) => sum + (r.result?.total || 0), 0)
    }

    return NextResponse.json({
      success: true,
      batchId,
      results,
      errors,
      summary: {
        total: items.length,
        successful: successful.length,
        failed: errors.length,
        totals
      }
    })
  } catch (error) {
    console.error('Error en bulk calculate:', error)
    return NextResponse.json(
      { error: 'Error al procesar el lote' },
      { status: 500 }
    )
  }
}
