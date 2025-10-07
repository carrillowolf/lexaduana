import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { hsCode, cifValue, countryCode = 'ERGA OMNES' } = await request.json()
    
    if (!hsCode || !cifValue) {
      return NextResponse.json(
        { error: 'HS Code y valor CIF son requeridos' },
        { status: 400 }
      )
    }

    // Limpiar y formatear el HS code
    const cleanHsCode = hsCode.replace(/\s/g, '').replace(/\./g, '')
    const paddedHsCode = cleanHsCode.padEnd(10, '0').substring(0, 10)
    
    // Obtener información del país
    let countryData = null
    if (countryCode !== 'ERGA OMNES') {
      const { data: country } = await supabase
        .from('countries')
        .select('*')
        .eq('country_code', countryCode)
        .single()
      
      countryData = country
    }
    
    // Buscar arancel base (ERGA OMNES)
    let tariffData = null
    let searchCode = paddedHsCode
    
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
    
    if (!tariffData) {
      return NextResponse.json(
        { error: 'No se encontró arancel para este código HS' },
        { status: 404 }
      )
    }
    
    // Buscar si hay arancel preferencial específico para este producto y país
    let preferentialRate = null
    if (countryData && countryCode !== 'ERGA OMNES') {
      const { data: prefTariff } = await supabase
        .from('preferential_tariffs')
        .select('preferential_duty')
        .eq('goods_code', tariffData.goods_code)
        .eq('country_code', countryCode)
        .single()
      
      if (prefTariff) {
        preferentialRate = prefTariff.preferential_duty
      }
    }
    
    // Buscar descripciones en cascada (HS2, HS4, HS6)
    let fullDescription = ''
    
    // Obtener HS2 (capítulo)
    const hs2Code = paddedHsCode.substring(0, 2).padEnd(10, '0')
    const { data: hs2Desc } = await supabase
      .from('descriptions')
      .select('description')
      .eq('goods_code', hs2Code)
      .single()
    
    // Obtener HS4
    const hs4Code = paddedHsCode.substring(0, 4).padEnd(10, '0')
    const { data: hs4Desc } = await supabase
      .from('descriptions')
      .select('description')
      .eq('goods_code', hs4Code)
      .single()
    
    // Obtener HS6
    const hs6Code = paddedHsCode.substring(0, 6).padEnd(10, '0')
    const { data: hs6Desc } = await supabase
      .from('descriptions')
      .select('description')
      .eq('goods_code', hs6Code)
      .single()
    
    // Obtener descripción exacta si existe
    const { data: exactDesc } = await supabase
      .from('descriptions')
      .select('description')
      .eq('goods_code', tariffData.goods_code)
      .single()
    
    // Construir descripción jerárquica
    const descriptions = []
    
    if (hs2Desc?.description) {
      descriptions.push(hs2Desc.description.trim())
    }
    
    if (hs4Desc?.description && hs4Desc.description !== hs2Desc?.description) {
      descriptions.push(hs4Desc.description.trim())
    }
    
    // Usar HS6 o la descripción exacta encontrada
    if (hs6Desc?.description && hs6Desc.description !== hs4Desc?.description) {
      descriptions.push(hs6Desc.description.trim())
    } else if (exactDesc?.description && exactDesc.description !== hs6Desc?.description && exactDesc.description !== hs4Desc?.description) {
      descriptions.push(exactDesc.description.trim())
    }
    
    // Si no hay ninguna descripción, usar un texto por defecto
    fullDescription = descriptions.length > 0 
      ? descriptions.join(' → ') 
      : `Código HS: ${tariffData.goods_code}`
    
    // Calcular el arancel aplicable
    let finalDutyRate = parseFloat(tariffData.duty)
    let appliedAgreement = null
    
    if (countryData) {
      if (preferentialRate !== null) {
        // Hay un arancel preferencial específico para este producto
        finalDutyRate = preferentialRate
        appliedAgreement = `${countryData.agreement_type} - Arancel específico`
      } else if (countryData.reduction_rate < 0) {
        // Sanciones - arancel adicional
        const addition = Math.abs(countryData.reduction_rate)
        finalDutyRate = finalDutyRate + addition
        appliedAgreement = 'Sanciones - Arancel adicional'
      } else if (countryData.agreement_type && countryData.agreement_type !== 'Sin acuerdo') {
        // Tiene acuerdo pero no sabemos el arancel exacto
        appliedAgreement = countryData.agreement_type
        // NO modificamos el arancel, solo avisamos del posible acuerdo
      }
    }
    
    // Calcular valores
    const cif = parseFloat(cifValue)
    const dutyAmount = (cif * finalDutyRate) / 100
    const customsBase = cif + dutyAmount
    
    // IVA estándar 21% (podemos hacerlo configurable después)
    const vatRate = 21
    const vatAmount = (customsBase * vatRate) / 100
    const totalAmount = customsBase + vatAmount
    
    // Calcular ahorro si hay acuerdo
    const standardDutyAmount = (cif * parseFloat(tariffData.duty)) / 100
    const savings = standardDutyAmount - dutyAmount
    
    return NextResponse.json({
      success: true,
      data: {
        hsCode: tariffData.goods_code,
        description: fullDescription,
        cifValue: cif,
        country: {
          code: countryCode,
          name: countryData?.country_name || 'Terceros países',
          agreement: appliedAgreement,
          notes: countryData?.notes
        },
        duty: {
          standardRate: parseFloat(tariffData.duty),
          appliedRate: finalDutyRate,
          amount: dutyAmount,
          savings: savings > 0 ? savings : 0
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

// Nueva ruta para obtener lista de países
export async function GET() {
  try {
    const { data: countries, error } = await supabase
      .from('countries')
      .select('country_code, country_name, agreement_type, reduction_rate, notes')
      .eq('active', true)
      .order('country_name')
    
    if (error) throw error
    
    return NextResponse.json({
      success: true,
      countries
    })
  } catch (error) {
    console.error('Error obteniendo países:', error)
    return NextResponse.json(
      { error: 'Error al obtener lista de países' },
      { status: 500 }
    )
  }
}
