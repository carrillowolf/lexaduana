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
    // Si el código tiene menos de 10 dígitos, buscar todos los hijos
    if (cleanHsCode.length < 10 && cleanHsCode.length >= 2) {
      const searchPattern = cleanHsCode.padEnd(10, '0').substring(0, cleanHsCode.length)

      // Buscar todos los códigos que empiecen con este patrón
      const { data: childCodes, error } = await supabase
        .from('tariffs')
        .select('goods_code, duty')
        .eq('origin', 'ERGA OMNES')
        .like('goods_code', `${searchPattern}%`)
        .order('goods_code')

      if (childCodes && childCodes.length > 0) {
        // Si hay múltiples códigos hijos
        if (childCodes.length > 1) {
          // Obtener descripciones para cada código
          const codesWithDescriptions = await Promise.all(
            childCodes.map(async (code) => {
              // Buscar descripción exacta o la más cercana
              const { data: desc } = await supabase
                .from('descriptions')
                .select('description')
                .eq('goods_code', code.goods_code)
                .single()

              return {
                goods_code: code.goods_code,
                duty: code.duty,
                description: desc?.description || 'Sin descripción'
              }
            })
          )

          return NextResponse.json({
            success: false,
            incomplete: true,
            message: 'Código incompleto. Seleccione el código específico:',
            suggestions: codesWithDescriptions,
            originalCode: cleanHsCode
          })
        }
      }
    }

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

    // Determinar IVA aplicable
    let vatRate = 21
    let vatType = 'general'

    // 1. Buscar primero en la tabla de IVA (búsqueda en cascada)
    let foundInTable = false
    for (let len = 10; len >= 2; len -= 2) {
      const searchCode = paddedHsCode.substring(0, len).padEnd(10, '0')

      const { data: vatData, error: vatError } = await supabase
        .from('vat_rates')
        .select('vat_rate, vat_type')
        .eq('goods_code', searchCode)
        .maybeSingle()

      if (!vatError && vatData) {
        vatRate = parseFloat(vatData.vat_rate)
        vatType = vatData.vat_type
        foundInTable = true
        break
      }
    }

    // 2. Si no está en tabla, aplicar reglas por capítulo
    if (!foundInTable) {
      try {
        const { determineVATByChapter } = await import('@/lib/vatCalculator')
        const vatResult = determineVATByChapter(paddedHsCode)
        vatRate = vatResult.rate
        vatType = vatResult.type
      } catch (error) {
        console.error('Error cargando reglas de IVA:', error)
        // Mantener valores por defecto (21%, general)
      }
    }

    const vatAmount = (customsBase * vatRate) / 100
    const totalAmount = customsBase + vatAmount

    // Calcular ahorro si hay acuerdo
    const standardDutyAmount = (cif * parseFloat(tariffData.duty)) / 100
    const savings = standardDutyAmount - dutyAmount

    // Buscar alertas para este código y país
    let alerts = []
    try {
      // 1. Obtener todas las alertas para este código
      const { data: measureAlerts } = await supabase
        .from('measure_alerts')
        .select('alert_type, short_text, full_text, measure_code, priority, origin_code, certificate')
        .eq('goods_code', tariffData.goods_code)
        .order('priority')

      if (measureAlerts && measureAlerts.length > 0) {
        // 2. Verificar si el país está excluido de alguna medida
        const { data: exclusions } = await supabase
          .from('measure_exclusions')
          .select('measure_type_code, excluded_country_code')
          .eq('goods_code', tariffData.goods_code)
          .eq('excluded_country_code', countryCode)

        const excludedMeasures = new Set(
          exclusions?.map(e => e.measure_type_code) || []
        )

        // 3. Filtrar alertas aplicables
        alerts = measureAlerts.filter(alert => {
          // Si el país está excluido de esta medida, no mostrarla
          if (excludedMeasures.has(alert.measure_code)) {
            return false
          }

          // Si la alerta NO especifica origen, o es 'ALL', aplica a todos
          if (!alert.origin_code || alert.origin_code === 'ALL') {
            return true
          }

          // Si origin_code es numérico (como 1011), es un acuerdo/grupo, mostrar siempre
          if (/^\d+$/.test(alert.origin_code)) {
            return true
          }

          // Si origin_code es un código ISO de 2 letras, verificar si coincide con el país
          if (alert.origin_code.length === 2) {
            return alert.origin_code === countryCode
          }

          // Por defecto, mostrar la alerta
          return true
        }).slice(0, 5) // Limitar a 5 alertas más relevantes
      }
    } catch (error) {
      console.error('Error obteniendo alertas:', error)
    }

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
          type: vatType,
          amount: vatAmount
        },
        customsBase,
        total: totalAmount,
        alerts: alerts
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

// Ruta para obtener lista de países
export async function GET() {
  try {
    const { data: countries, error } = await supabase
      .from('countries')
      .select('country_code, country_name, agreement_type, reduction_rate, notes')
      .order('country_name')

    if (error) throw error

    return NextResponse.json({
      success: true,
      countries: countries || []
    })
  } catch (error) {
    console.error('Error obteniendo países:', error)
    return NextResponse.json(
      { success: true, countries: [] },
      { status: 200 }
    )
  }
}