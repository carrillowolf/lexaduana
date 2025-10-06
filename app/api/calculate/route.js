import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { hsCode, cifValue, country = 'ERGA OMNES' } = await request.json()
    
    if (!hsCode || !cifValue) {
      return NextResponse.json(
        { error: 'HS Code y valor CIF son requeridos' },
        { status: 400 }
      )
    }

    // Limpiar y formatear el HS code
    const cleanHsCode = hsCode.replace(/\s/g, '').replace(/\./g, '')
    const paddedHsCode = cleanHsCode.padEnd(10, '0').substring(0, 10)
    
    // Buscar arancel - primero exacto, luego reduciendo dígitos
    let tariffData = null
    let searchCode = paddedHsCode
    
    for (let len = 10; len >= 2; len -= 2) {
      searchCode = paddedHsCode.substring(0, len).padEnd(10, '0')
      
      const { data, error } = await supabase
        .from('tariffs')
        .select('goods_code, duty')
        .eq('goods_code', searchCode)
        .eq('origin', country)
        .single()
      
      if (data) {
        tariffData = data
        break
      }
    }
    
    // Si no encuentra con país específico, buscar ERGA OMNES
    if (!tariffData && country !== 'ERGA OMNES') {
      for (let len = 10; len >= 2; len -= 2) {
        searchCode = paddedHsCode.substring(0, len).padEnd(10, '0')
        
        const { data, error } = await supabase
          .from('tariffs')
          .select('goods_code, duty')
          .eq('goods_code', searchCode)
          .eq('origin', 'ERGA OMNES')
          .single()
        
        if (data) {
          tariffData = data
          break
        }
      }
    }
    
    if (!tariffData) {
      return NextResponse.json(
        { error: 'No se encontró arancel para este código HS' },
        { status: 404 }
      )
    }
    
    // Buscar descripción
    const { data: descData } = await supabase
      .from('descriptions')
      .select('description')
      .eq('goods_code', tariffData.goods_code)
      .single()
    
    // Calcular valores
    const cif = parseFloat(cifValue)
    const dutyRate = parseFloat(tariffData.duty)
    const dutyAmount = (cif * dutyRate) / 100
    const customsBase = cif + dutyAmount
    
    // IVA estándar 21% (podemos hacerlo configurable después)
    const vatRate = 21
    const vatAmount = (customsBase * vatRate) / 100
    const totalAmount = customsBase + vatAmount
    
    return NextResponse.json({
      success: true,
      data: {
        hsCode: tariffData.goods_code,
        description: descData?.description || 'Sin descripción disponible',
        cifValue: cif,
        duty: {
          rate: dutyRate,
          amount: dutyAmount
        },
        vat: {
          rate: vatRate,
          amount: vatAmount
        },
        customsBase,
        total: totalAmount
      }
    })
  } catch (error) {
    console.error('Error en cálculo:', error)
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    )
  }
}
